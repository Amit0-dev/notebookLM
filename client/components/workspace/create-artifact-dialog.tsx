"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SealButton } from "@/components/layout/desk-shell";
import { useCreateArtifact } from "@/hooks/use-artifacts";
import { useSources } from "@/hooks/use-sources";
import { getUserFacingError } from "@/lib/errors";
import { ApiError } from "@/lib/api/client";
import { useBilling } from "@/components/billing/billing-provider";
import { cn } from "@/lib/utils";
import {
  ARTIFACT_TYPES,
  type ArtifactType,
} from "@/lib/validators/artifact";

type CreateArtifactDialogProps = {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: ArtifactType;
  onCreated?: (artifactId: string) => void;
};

const TYPE_COPY: Record<ArtifactType, { label: string; blurb: string }> = {
  SUMMARY: {
    label: "Summary",
    blurb: "A clear markdown overview of your sources",
  },
  TAKEAWAYS: {
    label: "Key takeaways",
    blurb: "Concise bullets you can skim and keep",
  },
  FLASHCARDS: {
    label: "Flashcards",
    blurb: "Front/back cards for active recall",
  },
  QUIZ: {
    label: "Quiz",
    blurb: "Multiple-choice questions with explanations",
  },
  MINDMAP: {
    label: "Mind map",
    blurb: "A branching map of topics and links",
  },
  REPORT: {
    label: "Report",
    blurb: "A longer structured write-up with sections",
  },
};

export function CreateArtifactDialog({
  workspaceId,
  open,
  onOpenChange,
  initialType = "SUMMARY",
  onCreated,
}: CreateArtifactDialogProps) {
  const [type, setType] = useState<ArtifactType>(initialType);
  const [title, setTitle] = useState("");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: sources = [] } = useSources(workspaceId, { status: "READY" });
  const createArtifact = useCreateArtifact(workspaceId);
  const { openLowBalanceDialog } = useBilling();

  useEffect(() => {
    if (open) setType(initialType);
  }, [open, initialType]);

  function reset() {
    setTitle("");
    setSelectedSourceIds([]);
    setFormError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function toggleSource(id: string) {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    try {
      const artifact = await createArtifact.mutateAsync({
        type,
        title: title.trim() || undefined,
        sourceIds:
          selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
      });
      handleOpenChange(false);
      onCreated?.(artifact.id);
    } catch (error) {
      // 402 — close this dialog and open the low-balance dialog instead.
      if (error instanceof ApiError && error.status === 402) {
        handleOpenChange(false);
        openLowBalanceDialog();
        return;
      }
      setFormError(
        getUserFacingError(
          error,
          "Couldn't start generation. Check that you have ready sources.",
        ),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate artifact</DialogTitle>
          <DialogDescription>
            Create a learning tool from ready sources in this workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {ARTIFACT_TYPES.map((id) => {
              const meta = TYPE_COPY[id];
              const active = type === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setType(id)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/8"
                      : "border-border/80 hover:bg-secondary/40",
                  )}
                >
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {meta.blurb}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="artifact-title" className="text-sm font-medium">
              Title <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="artifact-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${TYPE_COPY[type].label} · today`}
              className="h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Sources{" "}
              <span className="font-normal text-muted-foreground">
                (optional — defaults to all ready)
              </span>
            </p>
            {sources.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/80 px-3 py-4 text-sm text-muted-foreground">
                No ready sources yet. Process at least one source first.
              </p>
            ) : (
              <ul className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-border/70 p-2">
                {sources.map((source) => {
                  const checked = selectedSourceIds.includes(source.id);
                  return (
                    <li key={source.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSource(source.id)}
                          className="size-3.5 accent-primary"
                        />
                        <span className="truncate">{source.title}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <SealButton
              type="submit"
              disabled={createArtifact.isPending || sources.length === 0}
            >
              {createArtifact.isPending ? "Starting…" : "Generate"}
            </SealButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
