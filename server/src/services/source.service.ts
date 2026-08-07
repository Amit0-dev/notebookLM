import { uploadPdfToCloudinary } from "../lib/cloudinary.js"
import { scrapeWebsite } from "../lib/firecrawl.js"
import { extractPdfFromBuffer } from "../lib/pdf.js"
import { enqueueSourceProcessing } from "../lib/source-events.js"
import { fetchYoutubeTranscript } from "../lib/youtube.js"
import { createSourceRecord, deleteSourceRecord, findSourceByIdAndWorkspaceI, findSourcesByWorkspaceId } from "../repository/source.repository.js"
import { NotFoundError } from "../types/app-error.js"
import { ListSourcesQuery, CreateSourceInput, ImportWebsiteInput, ImportYoutubeInput } from "../validators/source.validator.js"
import { getWorkspaceByIdForUser } from "./workspace.service.js"

async function createAndProcessSource(
    data: Parameters<typeof createSourceRecord>[0]
) {
    const source = await createSourceRecord(data);

    await enqueueSourceProcessing({
        sourceId: source.id,
        workspaceId: source.workspaceId,
    });

    return source;
}

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

    return createAndProcessSource({
        workspaceId,
        type: input.type,
        title: input.title,
        content: input.content,
        status: "PENDING",
    });
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
    await getSourceForWorkspace(workspaceId, sourceId, userId);
    // TODO: await removeSourceFromIndex(workspaceId, sourceId);
    await deleteSourceRecord(sourceId);
}

export async function uploadPdfSource(
    workspaceId: string,
    userId: string,
    file: Express.Multer.File,
    title?: string,
) {

    await getWorkspaceByIdForUser(workspaceId, userId);

    const upload = await uploadPdfToCloudinary(
        file.buffer,
        file.originalname,
    );

    let content: string | null = null;
    let pageCount: number | undefined;

    try {
        const extracted = await extractPdfFromBuffer(file.buffer);
        content = extracted.text;
        pageCount = extracted.pageCount;
    } catch {
        // Inngest will retry extraction from Cloudinary if upload-time parse fails.
    }

    return createAndProcessSource({
        workspaceId,
        type: "PDF",
        title: title?.trim() || file.originalname.replace(/\.pdf$/i, ""),
        content,
        status: "PENDING",
        metadata: {
            fileUrl: upload.secureUrl,
            fileName: upload.originalFilename,
            fileSize: upload.bytes,
            publicId: upload.publicId,
            resourceType: upload.resourceType,
            pageCount,
        },
    });
}

export async function importWebsiteSource(
    workspaceId: string,
    userId: string,
    input: ImportWebsiteInput
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const scraped = await scrapeWebsite(input.url);

    return createAndProcessSource({
        workspaceId,
        type: "WEBSITE",
        title: input.title || scraped.title || input.url,
        content: scraped.markdown,
        url: scraped.sourceUrl,
        status: "PENDING",
        metadata: {
            importedFrom: scraped.sourceUrl,
        },
    });
}

export async function importYoutubeSource(
    workspaceId: string,
    userId: string,
    input: ImportYoutubeInput,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const transcript = await fetchYoutubeTranscript(input.url);

    return createAndProcessSource({
        workspaceId,
        type: "YOUTUBE",
        title: input.title || `YouTube: ${transcript.videoId}`,
        content: transcript.content,
        url: input.url,
        status: "PENDING",
        metadata: {
            videoId: transcript.videoId,
        },
    });
}