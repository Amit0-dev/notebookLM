import { NotFoundError } from "../types/app-error.js";
import { CreateArtifactInput } from "../validators/artifact.validator.js";
import { gatherSourceContext } from "./artifact-generation.service.js";
import { getWorkspaceByIdForUser } from "./workspace.service.js";
import { createArtifactRecord, deleteArtifactRecord, findArtifactByIdAndWorkspaceId, findArtifactsByWorkspaceId } from "../repository/artifact.repository.js";
import { enqueueArtifactGeneration } from "../lib/inngest-events/artifact-events.js";


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

    const context = await gatherSourceContext(
        workspaceId,
        input.sourceIds,
    );

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