import { NotFoundError, InsufficientCreditsError } from "../types/app-error.js";
import { CreateArtifactInput } from "../validators/artifact.validator.js";
import { gatherSourceContext, generateArtifactContent } from "./artifact-generation.service.js";
import { getWorkspaceByIdForUser } from "./workspace.service.js";
import {
    createArtifactRecord,
    deleteArtifactRecord,
    findArtifactById,
    findArtifactByIdAndWorkspaceId, findArtifactsByWorkspaceId,
    updateArtifactRecord,
    type ArtifactRecord
} from "../repository/artifact.repository.js";
import { enqueueArtifactGeneration } from "../lib/inngest-events/artifact-events.js";
import { Prisma } from "../generated/prisma/client.js";
import { getUserBalance } from "./credit.service.js";
import { estimateCreditsForTokens } from "../lib/credits/calculate.js";


export async function listArtifactsForWorkspace(
    workspaceId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);
    return findArtifactsByWorkspaceId(workspaceId);
}

export async function getArtifactForWorkspace(
    workspaceId: string,
    artifactId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const artifact = await findArtifactByIdAndWorkspaceId(
        artifactId,
        workspaceId,
    );

    if (!artifact) {
        throw new NotFoundError("Artifact not found");
    }

    return artifact;
}

export async function createArtifactForWorkspace(
    workspaceId: string,
    userId: string,
    input: CreateArtifactInput,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    // Gather source context first — we need it anyway and the content
    // length tells us the real token cost of this artifact.
    const context = await gatherSourceContext(
        workspaceId,
        input.sourceIds,
    );

    // ── Pre-flight credit estimate ───────────────────────────────────────────
    // gpt-4o-mini: $0.15/1M input, $0.60/1M output at 5× margin
    // Estimate: combined source text tokens + 1,500-token output budget
    const inputTokens = Math.ceil(context.text.length / 4);
    const estimatedCredits = estimateCreditsForTokens(
        "gpt-4o-mini",
        inputTokens + 1_500,  // input estimate + generous output budget
    );

    const balance = await getUserBalance(userId);
    if (balance < Math.max(estimatedCredits, 1)) {
        throw new InsufficientCreditsError();
    }
    // ────────────────────────────────────────────────────────────────────────

    const artifact = await createArtifactRecord({
        workspaceId,
        type: input.type,
        title:
            input.title ||
            `${{
                SUMMARY: "Summary",
                TAKEAWAYS: "Key Takeaways",
                FLASHCARDS: "Flashcards",
                QUIZ: "Quiz",
                MINDMAP: "Mind Map",
                REPORT: "AI Report",
            }[input.type]
            } · ${new Date().toLocaleDateString()}`,
        sourceIds: context.sourceIds,
        status: "PENDING",
    })

    await enqueueArtifactGeneration({
        artifactId: artifact.id,
        workspaceId,
        userId,
    });

    return artifact;
}

export async function deleteArtifactForWorkspace(
    workspaceId: string,
    artifactId: string,
    userId: string,
) {
    await getArtifactForWorkspace(workspaceId, artifactId, userId);
    await deleteArtifactRecord(artifactId);
}

/**
 * Generates artifact content and marks it READY.
 * Returns the updated artifact record + token usage so the caller
 * (Inngest step) can deduct credits in a separate memoized step.
 * Credits are NOT deducted here — deduction is the caller's responsibility.
 */
export async function processArtifactById(artifactId: string) {
    const artifact = await findArtifactById(artifactId);
    if (!artifact) {
        throw new Error("Artifact not found");
    }

    await updateArtifactRecord(artifactId, { status: "PROCESSING" });

    try {
        const context = await gatherSourceContext(
            artifact.workspaceId,
            artifact.sourceIds,
        );

        const generationResult = await generateArtifactContent(
            artifact.type,
            context.text,
        );

        const updated = await updateArtifactRecord(artifactId, {
            status: "READY",
            content: generationResult.content as Prisma.InputJsonValue,
            metadata: {
                generatedAt: new Date().toISOString(),
                processingError: undefined,
            },
        });

        // Return usage so the Inngest caller can deduct in a separate step.
        return {
            artifact: updated,
            usage: generationResult.usage,
        };
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Artifact generation failed";

        await updateArtifactRecord(artifactId, {
            status: "FAILED",
            metadata: {
                processingError: message,
            },
        });

        throw error;
    }
}

export type { ArtifactRecord };