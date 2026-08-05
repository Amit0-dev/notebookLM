import { findSourceByIdAndWorkspaceI, findSourcesByWorkspaceId } from "../repository/source.repository.js"
import { NotFoundError } from "../types/app-error.js"
import { ListSourcesQuery, CreateSourceInput, BulkDeleteSourcesInput } from "../validators/source.validator.js"
import { getWorkspaceByIdForUser } from "./workspace.service.js"

export async function listSourcesForWorkspace(
    workspaceId: string,
    userId: string,
    filters: ListSourcesQuery = {}
) {
    await getWorkspaceByIdForUser(workspaceId, userId)
    return findSourcesByWorkspaceId(workspaceId, filters)
}

export async function createTextOrMarkdownSource(
    workspaceId: string,
    userId: string,
    input: CreateSourceInput,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    // create-and-process-source helper.
}

export async function bulkDeleteSourcesForWorkspace(
    workspaceId: string,
    userId: string,
    sourceIds: string[]
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    for (const sourceId of sourceIds) {
        await deleteSourceForWorkspace(workspaceId, sourceId, userId)
    }
}

export async function getSourceForWorkspace(
    workspaceId: string,
    sourceId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const source = await findSourceByIdAndWorkspaceI(sourceId, workspaceId);

    if (!source) {
        throw new NotFoundError("Source not found")
    }

    return source
}

export async function deleteSourceForWorkspace(
    workspaceId: string,
    sourceId: string,
    userId: string,
) {
    // TODO: few things are pending to implement.
}