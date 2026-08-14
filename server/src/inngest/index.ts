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

export const processSource = inngest.createFunction(
    {
        id: "process-source",
        retries: 3,
        triggers: [{ event: "source/created" }],
    },
    async ({ event, step }) => {
        const { sourceId } = event.data;

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

                // Re-read pages from content when PDF extraction stored pageCount only.
                // Pages themselves aren't needed if full text is on the source.
                const chunks = await chunkSourceContent(
                    sourceId,
                    source.content,
                    undefined,
                );

                return { chunkCount: chunks.length };
            });

            const result = await step.run("embed-and-index", async () => {
                const source = await findSourceById(sourceId);
                if (!source) {
                    throw new Error("Source not found");
                }

                const chunks = await findChunksBySourceId(sourceId);
                if (chunks.length === 0) {
                    throw new Error("No chunks found for source");
                }

                await embedAndIndexSource(source, chunks);
                return { chunkCount: chunks.length };
            });

            return {
                sourceId,
                status: "READY",
                textLength: extracted.textLength,
                ...result,
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

        await step.run("summarize", () =>
            summarizeConversationById(conversationId, userId),
        );

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
        const { artifactId } = event.data;

        await step.run("generate", () => processArtifactById(artifactId));

        return { artifactId, status: "READY" };
    },
);

export const functions = [processSource, summarizeConversation, generateArtifact];
