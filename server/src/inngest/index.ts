import { findChunksBySourceId } from "../repository/source-chunk.repository.js";
import { findSourceById } from "../repository/source.repository.js";
import { processArtifactById } from "../services/artifact.service.js";
import { summarizeConversationById } from "../services/conversation-memory.service.js";
import {
    chunkSourceContent,
    embedAndIndexSource,
    extractSourceContent,
    markSourceFailed,
    markSourceProcessing,
} from "../services/source-processing.service.js";
import { inngest } from "./client.js";
import { deductForOperation } from "../services/credit.service.js";
import { CreditOperation } from "../lib/credits/pricing.js";

export const processSource = inngest.createFunction(
    {
        id: "process-source",
        retries: 3,
        triggers: [{ event: "source/created" }],
    },
    async ({ event, step }) => {
        const { sourceId, userId } = event.data;

        await step.run("mark-processing", () => markSourceProcessing(sourceId));

        try {
            // Keep step outputs small — Inngest memoizes them in the request body.
            const extracted = await step.run("extract-content", async () => {
                const result = await extractSourceContent(sourceId);
                return {
                    sourceId: result.sourceId,
                    workspaceId: result.workspaceId,
                    textLength: result.text.length,
                    pageCount: result.pages?.length ?? 0,
                    hasPages: Boolean(result.pages?.length),
                };
            });

            await step.run("chunk-content", async () => {
                const source = await findSourceById(sourceId);
                if (!source?.content?.trim()) {
                    throw new Error("Source has no content after extraction");
                }

                const chunks = await chunkSourceContent(
                    sourceId,
                    source.content,
                    undefined,
                );

                return { chunkCount: chunks.length };
            });

            // Returns estimatedTokens so the deduction step knows how much to charge.
            // No credit deduction happens inside this step — that's intentional.
            const embeddingResult = await step.run("embed-and-index", async () => {
                const source = await findSourceById(sourceId);
                if (!source) {
                    throw new Error("Source not found");
                }

                const chunks = await findChunksBySourceId(sourceId);
                if (chunks.length === 0) {
                    throw new Error("No chunks found for source");
                }

                await embedAndIndexSource(source, chunks);

                // Estimate token count (1 token ≈ 4 chars) — returned for billing
                const totalChars = chunks.reduce((sum, c) => sum + c.content.length, 0);
                const estimatedTokens = Math.ceil(totalChars / 4);

                return { chunkCount: chunks.length, estimatedTokens };
            });

            // ── Deduction step ─────────────────────────────────────────────────────
            // Separate step = memoized by Inngest. If any later step fails and the
            // function retries, Inngest replays this as a no-op (already succeeded).
            // This guarantees exactly-once billing regardless of retry count.
            if (userId) {
                await step.run("deduct-embedding-credits", () =>
                    deductForOperation(
                        userId,
                        CreditOperation.SOURCE_PROCESSING,
                        "text-embedding-3-small",
                        { promptTokens: embeddingResult.estimatedTokens, completionTokens: 0 },
                        { sourceId, workspaceId: extracted.workspaceId },
                    ).catch((err) => {
                        // Insufficient credits or other deduction error — log but don't
                        // fail the source processing. The source is indexed successfully.
                        console.error("[Credits] Embedding deduction failed:", err);
                    }),
                );
            }
            // ──────────────────────────────────────────────────────────────────────

            return {
                sourceId,
                status: "READY",
                textLength: extracted.textLength,
                chunkCount: embeddingResult.chunkCount,
            };
        } catch (error) {
            await step.run("mark-failed", async () => {
                const source = await findSourceById(sourceId);
                if (source) {
                    await markSourceFailed(sourceId, error, source.metadata);
                }
            });
            throw error;
        }
    },
);

export const summarizeConversation = inngest.createFunction(
    {
        id: "summarize-conversation",
        retries: 2,
        triggers: [{ event: "conversation/summarize" }],
    },
    async ({ event, step }) => {
        const { conversationId, userId } = event.data;

        // Step 1: Summarize — returns usage for billing.
        // No credit deduction here — that's intentional.
        const summarizeResult = await step.run("summarize", () =>
            summarizeConversationById(conversationId, userId),
        );

        // ── Deduction step ─────────────────────────────────────────────────────
        // Only reached if the summarize step succeeded. Memoized by Inngest so
        // retries of the function never double-charge.
        if (userId && summarizeResult.usage) {
            await step.run("deduct-summary-credits", () =>
                deductForOperation(
                    userId,
                    CreditOperation.CHAT_MESSAGE, // summarization uses the same chat model
                    "gpt-4o",
                    summarizeResult.usage!,
                    { conversationId },
                ).catch((err) => {
                    // Log but don't fail the summarization — it already completed.
                    console.error("[Credits] Summary deduction failed:", err);
                }),
            );
        }
        // ──────────────────────────────────────────────────────────────────────

        return { conversationId, status: "SUMMARIZED" };
    },
);


export const generateArtifact = inngest.createFunction(
    {
        id: "generate-artifact",
        retries: 2,
        triggers: [{ event: "artifact/generate" }],
    },
    async ({ event, step }) => {
        const { artifactId, userId } = event.data;

        // Step 1: Generate artifact content — returns usage for billing.
        // No credit deduction here — that's intentional.
        const generationResult = await step.run("generate", () =>
            processArtifactById(artifactId),
        );

        // ── Deduction step ─────────────────────────────────────────────────────
        // Separate step = memoized by Inngest. If the generate step succeeded but
        // this step fails and retries, only the deduction retries — not generation.
        // This guarantees exactly-once billing regardless of retry count.
        if (userId && generationResult.usage) {
            await step.run("deduct-artifact-credits", () =>
                deductForOperation(
                    userId,
                    CreditOperation.ARTIFACT_GENERATION,
                    "gpt-4o",
                    generationResult.usage,
                    { artifactId },
                ).catch((err) => {
                    // Insufficient credits or other deduction error — log but don't
                    // fail the artifact. It's already marked READY for the user.
                    console.error("[Credits] Artifact deduction failed:", err);
                }),
            );
        }
        // ──────────────────────────────────────────────────────────────────────

        return { artifactId, status: "READY" };
    },
);

export const functions = [processSource, summarizeConversation, generateArtifact];
