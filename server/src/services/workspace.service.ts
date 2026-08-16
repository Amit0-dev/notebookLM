import {
    createWorkspaceRecord,
    deleteWorkspaceRecord,
    findWorkspaceByIdAndUserId,
    findWorkspacesByUserId,
    updateWorkspaceRecord,
    type WorkspaceRecord
} from "../repository/workspace.repository.js";
import { NotFoundError } from "../types/app-error.js";
import { deleteWorkspaceVectors } from "../lib/pinecone.js";
import type {
    CreateWorkspaceInput,
    UpdateWorkspaceInput
} from "../validators/workspace.validator.js";

export function listWorkspacesByUser(userId: string) {
    return findWorkspacesByUserId(userId)
}

export async function getWorkspaceByIdForUser(
    workspaceId: string,
    userId: string
): Promise<WorkspaceRecord> {
    const workspace = await findWorkspaceByIdAndUserId(workspaceId, userId)

    if (!workspace) {
        throw new NotFoundError("Workspace not found")
    }

    return workspace;
}

export function createWorkspaceForUser(
    userId: string,
    input: CreateWorkspaceInput,
) {
    return createWorkspaceRecord(userId, input)
}

export async function updateWorkspaceForUser(
    workspaceId: string,
    userId: string,
    input: UpdateWorkspaceInput
) {
    await getWorkspaceByIdForUser(workspaceId, userId);
    return updateWorkspaceRecord(workspaceId, input);
}

export async function deleteWorkspaceForUser(
    workspaceId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    // Wipe the entire Pinecone namespace for this workspace.
    // Must run before the DB delete so we still have the workspaceId in scope.
    await deleteWorkspaceVectors(workspaceId).catch((err) => {
        console.warn(`[Pinecone] Failed to delete namespace for workspace ${workspaceId}:`, err);
    });

    await deleteWorkspaceRecord(workspaceId);
}