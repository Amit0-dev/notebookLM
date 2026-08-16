import { openai } from "@ai-sdk/openai";
import {
    convertToModelMessages,
    createUIMessageStream,
    isStepCount,
    pipeUIMessageStreamToResponse,
    streamText,
    tool,
    toUIMessageStream,
    type UIMessage
} from "ai";
import { NotFoundError, ValidationError } from "../types/app-error.js";
import type { Response } from "express";
import { getWorkspaceByIdForUser } from "./workspace.service.js";
import {
    CHAT_MODEL,
    CHAT_MODELS,
    CONVERSATION_SUMMARY_INTERVAL,
    RECENT_MESSAGE_WINDOW
} from "../lib/ai-config.js";
import {
    buildConversationTitle,
    getLastUserMessageText,
    getTextFromUIMessage
} from "../utils/chat-message.js";
import {
    createConversationRecord,
    deleteConversationRecord,
    findConversationByIdAndWorkspaceId,
    findConversationsByWorkspaceId,
    touchConversation,
    updateConversationRecord
} from "../repository/conversation.repository.js";
import {
    countMessagesByConversationId,
    createMessageRecord,
    findMessagesByConversationId
} from "../repository/message.repository.js";
import { buildChatSystemPrompt, retrieveWorkspaceContext, type WorkspaceSourceSummary } from "../lib/rag/retrieve.js";
import { addMemoriesFromMessages, searchUserMemories } from "../lib/mem0.js";
import { formatTavilyResultsForPrompt, searchWeb, TavilySearchResponse } from "../lib/tavily.js";
import { z } from "zod";
import { enqueueConversationSummarize } from "../lib/inngest-events/conversation-events.js";
import { findSourcesByWorkspaceId } from "../repository/source.repository.js";
import { deductForOperation, getUserBalance } from "../services/credit.service.js";
import { CreditOperation } from "../lib/credits/pricing.js";
import { InsufficientCreditsError } from "../types/app-error.js";
import { estimateCreditsForTokens } from "../lib/credits/calculate.js";


export async function listConversationsForWorkspace(
    workspaceId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);
    return findConversationsByWorkspaceId(workspaceId);
}

export async function createConversationForWorkspace(
    workspaceId: string,
    userId: string,
    title?: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);
    return createConversationRecord(workspaceId, title);
}

export async function getConversationMessagesForWorkspace(
    workspaceId: string,
    conversationId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const conversation = await findConversationByIdAndWorkspaceId(
        conversationId,
        workspaceId,
    );

    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }

    return findMessagesByConversationId(conversationId);
}

export async function deleteConversationForWorkspace(
    workspaceId: string,
    conversationId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);
    const conversation = await findConversationByIdAndWorkspaceId(
        conversationId,
        workspaceId,
    );
    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }
    await deleteConversationRecord(conversationId);
}


async function resolveConversation(
    workspaceId: string,
    conversationId: string | undefined,
    firstMessage: string
) {
    if (conversationId) {
        const existing = await findConversationByIdAndWorkspaceId(
            conversationId,
            workspaceId,
        );

        if (!existing) {
            throw new NotFoundError("Conversation not found");
        }

        return existing;
    }

    return createConversationRecord(
        workspaceId,
        buildConversationTitle(firstMessage),
    );
}


export async function streamWorkspaceChat(
    res: Response,
    workspaceId: string,
    userId: string,
    input: {
        conversationId?: string;
        messages: UIMessage[];
        model?: string;
        webSearch?: boolean;
    }
) {
    const workspace = await getWorkspaceByIdForUser(workspaceId, userId);

    const requestedModel = input.model ?? workspace.defaultModel;

    const chatModel = CHAT_MODELS.find((model) => model === requestedModel) ?? CHAT_MODEL;

    const webSearchEnabled =
        input.webSearch === true && !!process.env.TAVILY_API_KEY?.trim();

    const userText = getLastUserMessageText(input.messages);
    if (!userText) {
        throw new ValidationError("A user message is required");
    }

    // Pre-flight credit check — rough estimate based on typical chat tokens.
    // This prevents starting an expensive call when the user has no balance.
    const estimatedTokens = userText.length / 4 + 2000; // approx: input chars/4 + ~2K context
    const estimatedCredits = estimateCreditsForTokens(
        chatModel as "gpt-4o" | "gpt-4o-mini",
        estimatedTokens,
    );
    const currentBalance = await getUserBalance(userId);
    if (currentBalance < estimatedCredits) {
        throw new InsufficientCreditsError();
    }

    const conversation = await resolveConversation(
        workspaceId,
        input.conversationId,
        userText,
    );

    await createMessageRecord({
        conversationId: conversation.id,
        role: "USER",
        content: userText,
    });

    const contextMessages =
        conversation.summary &&
            input.messages.length > RECENT_MESSAGE_WINDOW
            ? input.messages.slice(-RECENT_MESSAGE_WINDOW)
            : input.messages;

    let webSearchResults: TavilySearchResponse | null = null;
    let citations: Array<{
        sourceId: string;
        sourceTitle: string;
        sourceType: string;
        chunkId: string;
        chunkIndex: number;
        page: string | number | null | undefined;
        excerpt: string;
        score: number;
    }> = [];

    // Hoisted so both execute and onFinish closures can share it
    let streamUsage: { promptTokens?: number; completionTokens?: number } | null = null;

    // Open the SSE response immediately; RAG runs inside execute so tokens can flush
    // as soon as the model starts (instead of buffering behind retrieval).
    const stream = createUIMessageStream({
        originalMessages: input.messages,
        execute: async ({ writer }) => {
            const [retrievedChunks, userMemories, allSources] = await Promise.all([
                retrieveWorkspaceContext(workspaceId, userText),
                searchUserMemories(userId, userText),
                findSourcesByWorkspaceId(workspaceId),
            ]);

            const workspaceSources: WorkspaceSourceSummary[] = allSources.map((s) => ({
                title: s.title,
                type: s.type,
                status: s.status,
            }));

            citations = retrievedChunks.map((chunk) => ({
                sourceId: chunk.sourceId,
                sourceTitle: chunk.sourceTitle,
                sourceType: chunk.sourceType,
                chunkId: chunk.chunkId,
                chunkIndex: chunk.chunkIndex,
                page: chunk.page,
                excerpt: chunk.text.slice(0, 280),
                score: chunk.score,
            }));

            if (citations.length > 0) {
                writer.write({
                    type: "data-citations",
                    id: "citations",
                    data: citations,
                });
            }

            const systemPrompt = buildChatSystemPrompt({
                chunks: retrievedChunks,
                workspaceSources,
                conversationSummary: conversation.summary,
                userMemories: userMemories.map((memory) => memory.memory),
                webSearchEnabled,
            });

            const tools =
                webSearchEnabled
                    ? {
                        web_search: tool({
                            description:
                                "Search the web for up-to-date information outside the workspace sources.",
                            inputSchema: z.object({
                                query: z
                                    .string()
                                    .describe(
                                        "The search query for current web information",
                                    ),
                            }),
                            execute: async ({ query }) => {
                                const results = await searchWeb(query);
                                webSearchResults = results;
                                return formatTavilyResultsForPrompt(results);
                            },
                        }),
                    }
                    : undefined;

            const result = streamText({
                model: openai(chatModel),
                system: systemPrompt,
                messages: await convertToModelMessages(contextMessages),
                tools,
                stopWhen: webSearchEnabled ? isStepCount(3) : undefined,
                onFinish: ({ usage }) => {
                    streamUsage = usage as unknown as { promptTokens?: number; completionTokens?: number } ?? null;
                },
            });

            writer.merge(toUIMessageStream({ stream: result.stream }));

            const webCitations = webSearchResults
                ? webSearchResults.results.map((result) => ({
                    sourceType: "WEB" as const,
                    sourceTitle: result.title,
                    url: result.url,
                    excerpt: result.content.slice(0, 280),
                }))
                : [];

            if (webCitations.length > 0) {
                writer.write({
                    type: "data-citations",
                    id: "citations",
                    data: [...citations, ...webCitations],
                });
            }
        },
        onFinish: async ({ responseMessage, isAborted }) => {
            if (isAborted) {
                return;
            }

            const assistantText = getTextFromUIMessage(responseMessage).trim();
            if (!assistantText) {
                return;
            }

            // Deduct credits based on actual token usage (fire-and-forget, non-blocking)
            if (streamUsage) {
                void deductForOperation(
                    userId,
                    CreditOperation.CHAT_MESSAGE,
                    chatModel as "gpt-4o" | "gpt-4o-mini",
                    streamUsage,
                    { conversationId: conversation.id, workspaceId },
                ).catch((err) => {
                    console.error("[Credits] Chat deduction failed:", err);
                });  
            }

            const webCitations = webSearchResults
                ? webSearchResults.results.map((result) => ({
                    sourceType: "WEB" as const,
                    sourceTitle: result.title,
                    url: result.url,
                    excerpt: result.content.slice(0, 280),
                }))
                : [];
            const allCitations = [...citations, ...webCitations];

            await createMessageRecord({
                conversationId: conversation.id,
                role: "ASSISTANT",
                content: assistantText,
                citations: allCitations,
            });

            await touchConversation(conversation.id);

            if (!conversation.title) {
                await updateConversationRecord(conversation.id, {
                    title: buildConversationTitle(userText),
                });
            }

            const messageCount = await countMessagesByConversationId(
                conversation.id,
            );

            if (messageCount % CONVERSATION_SUMMARY_INTERVAL === 0) {
                await enqueueConversationSummarize({
                    conversationId: conversation.id,
                    userId,
                });
            }

            void addMemoriesFromMessages(
                userId,
                [
                    { role: "user", content: userText },
                    { role: "assistant", content: assistantText },
                ],
                {
                    source: "learned",
                    conversationId: conversation.id,
                },
            ).catch((error) => {
                console.error("Mem0 add failed:", error);
            });
        },
    });

    // Disable Nagle so small SSE chunks flush promptly over TCP.
    res.socket?.setNoDelay?.(true);

    await pipeUIMessageStreamToResponse({
        response: res,
        stream,
        headers: {
            "X-Conversation-Id": conversation.id,
            "Cache-Control": "no-cache, no-transform",
            "Content-Encoding": "none",
            "X-Accel-Buffering": "no",
        },
    });
}