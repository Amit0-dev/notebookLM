import { uploadPdfToCloudinary } from "../lib/cloudinary.js"
import { scrapeWebsite } from "../lib/firecrawl.js"
import { extractPdfFromBuffer } from "../lib/pdf.js"
import { enqueueSourceProcessing } from "../lib/inngest-events/source-events.js"
import { fetchYoutubeTranscript } from "../lib/youtube.js"
import { createSourceRecord, deleteSourceRecord, findSourceByIdAndWorkspaceI, findSourcesByWorkspaceId } from "../repository/source.repository.js"
import { NotFoundError, InsufficientCreditsError } from "../types/app-error.js"
import { ListSourcesQuery, CreateSourceInput, ImportWebsiteInput, ImportYoutubeInput } from "../validators/source.validator.js"
import { getWorkspaceByIdForUser } from "./workspace.service.js"
import { deleteSourceVectors } from "../lib/pinecone.js"
import { getUserBalance } from "./credit.service.js"
import { estimateCreditsForTokens } from "../lib/credits/calculate.js"

async function createAndProcessSource(
    data: Parameters<typeof createSourceRecord>[0],
    userId: string,
) {
    // ── Pre-flight credit estimate ───────────────────────────────────────────
    // Estimate embedding cost BEFORE creating the record or firing Inngest.
    // Embedding is cheap but we still guard against zero-balance users and
    // very large documents that would exceed the remaining balance.
    //
    // Cost model: text-embedding-3-small at 5× margin
    //   ≈ $0.0001 / 1K tokens  →  ~0.01 credits per 1K tokens
    //
    // Estimation heuristics (conservative, with a 20% buffer built-in):
    //   - Known content  → chars / 4  (standard chars-to-tokens ratio)
    //   - PDF page count → 750 tokens / page  (upper-end estimate per A4 page)
    //   - Unknown size   → assume 50,000 tokens (large document safety net)

    const metadata = (data.metadata ?? {}) as Record<string, unknown>;
    const pageCount = typeof metadata.pageCount === "number" ? metadata.pageCount : undefined;

    let estimatedTokens: number;
    if (data.content && data.content.length > 0) {
        estimatedTokens = Math.ceil(data.content.length / 4);
    } else if (pageCount) {
        estimatedTokens = pageCount * 750; // conservative upper-bound per page
    } else {
        estimatedTokens = 50_000; // large unknown → err on the side of caution
    }

    const estimatedCredits = estimateCreditsForTokens(
        "text-embedding-3-small",
        estimatedTokens,
    );

    const balance = await getUserBalance(userId);
    if (balance < Math.max(estimatedCredits, 0.1)) {
        throw new InsufficientCreditsError();
    }
    // ────────────────────────────────────────────────────────────────────────

    const source = await createSourceRecord(data);

    await enqueueSourceProcessing({
        sourceId: source.id,
        workspaceId: source.workspaceId,
        userId,
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
    }, userId);
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

    // Remove vectors from Pinecone first, then delete the DB record.
    // Fire-and-forget with a warning log — a Pinecone failure should not
    // block the source from being deleted in the database.
    await deleteSourceVectors(workspaceId, sourceId).catch((err) => {
        console.warn(`[Pinecone] Failed to delete vectors for source ${sourceId}:`, err);
    });

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
    }, userId);
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
    }, userId);
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
    }, userId);
}