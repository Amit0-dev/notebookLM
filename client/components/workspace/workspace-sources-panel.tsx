"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  FileTextIcon,
  GlobeIcon,
  PlusIcon,
  Trash2Icon,
  VideoIcon,
} from "lucide-react";
import { AddSourceDialog } from "@/components/workspace/add-source-dialog";
import { useDeleteSource, useSources } from "@/hooks/use-sources";
import { getUserFacingError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { Source, SourceType } from "@/lib/validators/source";
import type { Workspace } from "@/lib/validators/workspace";

type WorkspaceSourcesPanelProps = {
  workspace: Workspace;
  addOpen?: boolean;
  onAddOpenChange?: (open: boolean) => void;
};

const TYPE_META: Record<
  SourceType,
  { label: string; icon: typeof FileTextIcon }
> = {
  PDF: { label: "PDF", icon: FileTextIcon },
  WEBSITE: { label: "Website", icon: GlobeIcon },
  YOUTUBE: { label: "YouTube", icon: VideoIcon },
  TEXT: { label: "Text", icon: FileTextIcon },
  MARKDOWN: { label: "Markdown", icon: FileTextIcon },
};

function statusClass(status: Source["status"]) {
  switch (status) {
    case "READY":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "FAILED":
      return "bg-destructive/15 text-destructive";
    case "PROCESSING":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

function formatUpdated(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function WorkspaceSourcesPanel({
  workspace,
  addOpen: controlledOpen,
  onAddOpenChange,
}: WorkspaceSourcesPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [initialKind, setInitialKind] = useState<
    "text" | "website" | "youtube" | "pdf"
  >("text");

  const addOpen = controlledOpen ?? internalOpen;
  const setAddOpen = onAddOpenChange ?? setInternalOpen;

  const { data: sources = [], isPending, isError, error, refetch, isFetching } =
    useSources(workspace.id);
  const deleteSource = useDeleteSource(workspace.id);

  function openAdd(kind: "text" | "website" | "youtube" | "pdf" = "text") {
    setInitialKind(kind);
    setAddOpen(true);
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-7">
        <div>
          <h1 className="font-heading text-2xl font-medium tracking-[-0.02em]">
            Sources
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Feed materials into {workspace.title}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAdd("text")}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <PlusIcon className="size-4" />
          Add source
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
        {isPending ? (
          <div className="mx-auto grid max-w-3xl gap-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-muted/70"
              />
            ))}
          </div>
        ) : null}

        {isError ? (
          <div
            role="alert"
            className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-4 text-center"
          >
            <p className="text-sm font-medium text-destructive">
              Couldn&apos;t load sources
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {getUserFacingError(
                error,
                "We couldn't load sources. Please try again.",
              )}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 text-sm font-medium underline underline-offset-2"
              disabled={isFetching}
            >
              {isFetching ? "Retrying…" : "Retry"}
            </button>
          </div>
        ) : null}

        {!isPending && !isError && sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-10">
            <div className="grid w-full max-w-lg gap-3 sm:grid-cols-3">
              {(
                [
                  { kind: "text" as const, icon: FileTextIcon, label: "Text" },
                  {
                    kind: "website" as const,
                    icon: GlobeIcon,
                    label: "Website",
                  },
                  {
                    kind: "youtube" as const,
                    icon: VideoIcon,
                    label: "YouTube",
                  },
                ] as const
              ).map(({ kind, icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => openAdd(kind)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/80 bg-card/50 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-foreground"
                >
                  <Icon className="size-5" strokeWidth={1.5} />
                  {label}
                </button>
              ))}
            </div>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              No sources yet. Add text, a site, or a video to ground your chats.
            </p>
          </div>
        ) : null}

        {!isPending && !isError && sources.length > 0 ? (
          <ul className="mx-auto flex max-w-3xl flex-col gap-3">
            {sources.map((source) => {
              const meta = TYPE_META[source.type];
              const Icon = meta.icon;
              return (
                <li
                  key={source.id}
                  className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card/60 p-4"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
                    <Icon className="size-4" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {source.title}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide",
                          statusClass(source.status),
                        )}
                      >
                        {source.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {meta.label}
                      {source.url ? ` · ${source.url}` : ""}
                      {" · "}
                      Updated {formatUpdated(source.updatedAt)}
                    </p>
                    {source.status === "FAILED" &&
                    source.metadata &&
                    typeof source.metadata === "object" &&
                    !Array.isArray(source.metadata) &&
                    typeof (source.metadata as { processingError?: unknown })
                      .processingError === "string" ? (
                      <p className="mt-1.5 text-xs text-destructive">
                        {
                          (
                            source.metadata as {
                              processingError: string;
                            }
                          ).processingError
                        }
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete “${source.title}”? This can’t be undone.`,
                        )
                      ) {
                        void deleteSource.mutateAsync(source.id);
                      }
                    }}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${source.title}`}
                    disabled={deleteSource.isPending}
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <AddSourceDialog
        key={`${addOpen}-${initialKind}`}
        workspaceId={workspace.id}
        open={addOpen}
        onOpenChange={setAddOpen}
        initialKind={initialKind}
      />
    </div>
  );
}
