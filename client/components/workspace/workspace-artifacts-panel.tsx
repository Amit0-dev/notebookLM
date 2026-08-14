"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  BookOpenIcon,
  BrainIcon,
  ChevronLeftIcon,
  ClipboardListIcon,
  LayersIcon,
  ListChecksIcon,
  NetworkIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { ArtifactContentView } from "@/components/workspace/artifact-content-view";
import { CreateArtifactDialog } from "@/components/workspace/create-artifact-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  useArtifacts,
  useDeleteArtifact,
} from "@/hooks/use-artifacts";
import { getUserFacingError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type {
  Artifact,
  ArtifactType,
} from "@/lib/validators/artifact";
import type { Workspace } from "@/lib/validators/workspace";

type WorkspaceArtifactsPanelProps = {
  workspace: Workspace;
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
};

const TYPE_META: Record<
  ArtifactType,
  { label: string; icon: typeof BookOpenIcon }
> = {
  SUMMARY: { label: "Summary", icon: BookOpenIcon },
  TAKEAWAYS: { label: "Takeaways", icon: ListChecksIcon },
  FLASHCARDS: { label: "Flashcards", icon: LayersIcon },
  QUIZ: { label: "Quiz", icon: ClipboardListIcon },
  MINDMAP: { label: "Mind map", icon: NetworkIcon },
  REPORT: { label: "Report", icon: BrainIcon },
};

function statusClass(status: Artifact["status"]) {
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

export function WorkspaceArtifactsPanel({
  workspace,
  createOpen: controlledOpen,
  onCreateOpenChange,
}: WorkspaceArtifactsPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [initialType, setInitialType] = useState<ArtifactType>("SUMMARY");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const createOpen = controlledOpen ?? internalOpen;
  const setCreateOpen = onCreateOpenChange ?? setInternalOpen;

  const {
    data: artifacts = [],
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useArtifacts(workspace.id);
  const deleteArtifact = useDeleteArtifact(workspace.id);

  const selected =
    artifacts.find((artifact) => artifact.id === selectedId) ?? null;

  function openCreate(type: ArtifactType = "SUMMARY") {
    setInitialType(type);
    setCreateOpen(true);
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-7">
        <div className="min-w-0">
          {selected ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Back to artifacts"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <div className="min-w-0">
                <h1 className="font-heading truncate text-2xl font-medium tracking-[-0.02em]">
                  {selected.title}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {TYPE_META[selected.type].label} · {selected.status.toLowerCase()}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="font-heading text-2xl font-medium tracking-[-0.02em]">
                Artifacts
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Learning tools generated from your sources
              </p>
            </div>
          )}
        </div>

        {!selected ? (
          <button
            type="button"
            onClick={() => openCreate("SUMMARY")}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PlusIcon className="size-4" />
            Generate
          </button>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
        {selected ? (
          <div className="mx-auto max-w-3xl">
            <ArtifactContentView artifact={selected} />
          </div>
        ) : (
          <>
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
                  Couldn&apos;t load artifacts
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {getUserFacingError(
                    error,
                    "We couldn't load artifacts. Please try again.",
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

            {!isPending && !isError && artifacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 py-10">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <SparklesIcon className="size-5" />
                </span>
                <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                  {(
                    [
                      "SUMMARY",
                      "TAKEAWAYS",
                      "FLASHCARDS",
                      "QUIZ",
                      "MINDMAP",
                      "REPORT",
                    ] as const
                  ).map((type) => {
                    const meta = TYPE_META[type];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => openCreate(type)}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/80 bg-card/50 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-foreground"
                      >
                        <Icon className="size-5" strokeWidth={1.5} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  No artifacts yet. Generate a summary, quiz, or mind map from
                  ready sources.
                </p>
              </div>
            ) : null}

            {!isPending && !isError && artifacts.length > 0 ? (
              <ul className="mx-auto flex max-w-3xl flex-col gap-3">
                {artifacts.map((artifact) => {
                  const meta = TYPE_META[artifact.type];
                  const Icon = meta.icon;
                  const busy =
                    artifact.status === "PENDING" ||
                    artifact.status === "PROCESSING";
                  return (
                    <li key={artifact.id}>
                      <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card/60 p-4">
                        <button
                          type="button"
                          onClick={() => setSelectedId(artifact.id)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
                            {busy ? (
                              <Spinner className="size-4" />
                            ) : (
                              <Icon className="size-4" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-medium">
                                {artifact.title}
                              </span>
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                                  statusClass(artifact.status),
                                )}
                              >
                                {artifact.status.toLowerCase()}
                              </span>
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {meta.label} · updated{" "}
                              {formatUpdated(artifact.updatedAt)}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Delete “${artifact.title}”? This can’t be undone.`,
                              )
                            ) {
                              return;
                            }
                            void deleteArtifact.mutateAsync(artifact.id).then(
                              () => {
                                if (selectedId === artifact.id) {
                                  setSelectedId(null);
                                }
                              },
                            );
                          }}
                          disabled={deleteArtifact.isPending}
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete ${artifact.title}`}
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </>
        )}
      </div>

      <CreateArtifactDialog
        workspaceId={workspace.id}
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialType={initialType}
        onCreated={(id) => setSelectedId(id)}
      />
    </div>
  );
}
