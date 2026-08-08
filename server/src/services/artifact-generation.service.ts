import { findSourcesByWorkspaceId } from "../repository/source.repository.js";
import { ValidationError } from "../types/app-error.js";

const MAX_CONTEXT_CHARS = 120_000;

export async function gatherSourceContext(
    workspaceId: string,
    sourceIds?: string[],
) {
    const sources = await findSourcesByWorkspaceId(
        workspaceId,
        { status: "READY" }
    )

    const selected = sourceIds?.length
        ? sources.filter((source) => sourceIds.includes(source.id))
        : sources;

    if (selected.length === 0) {
        throw new ValidationError(
            "No ready sources found. Add and process sources before generating learning tools.",
        );
    }

    const withContent = selected.flatMap((source) => {
        const content = source.content?.trim();
        return content ? [{ title: source.title, content }] : [];
    });

    if (withContent.length === 0) {
        throw new ValidationError(
            "Selected sources have no extracted content yet.",
        );
    }

    const text = withContent
        .map((source) => `# ${source.title}\n\n${source.content}`)
        .join("\n\n---\n\n")
        .slice(0, MAX_CONTEXT_CHARS);

    return {
        text,
        sourceIds: selected.map((source) => source.id),
    };
}