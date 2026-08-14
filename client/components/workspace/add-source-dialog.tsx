"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  deskFieldClass,
  deskTextareaClass,
  SealButton,
} from "@/components/layout/desk-shell";
import {
  useCreateSource,
  useImportWebsite,
  useImportYoutube,
  useUploadPdf,
} from "@/hooks/use-sources";
import { getUserFacingError } from "@/lib/errors";
import { cn } from "@/lib/utils";

type AddKind = "text" | "website" | "youtube" | "pdf";

type AddSourceDialogProps = {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind?: AddKind;
};

const TABS: { id: AddKind; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "website", label: "Website" },
  { id: "youtube", label: "YouTube" },
  { id: "pdf", label: "PDF" },
];

export function AddSourceDialog({
  workspaceId,
  open,
  onOpenChange,
  initialKind = "text",
}: AddSourceDialogProps) {
  const [kind, setKind] = useState<AddKind>(initialKind);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createSource = useCreateSource(workspaceId);
  const importWebsite = useImportWebsite(workspaceId);
  const importYoutube = useImportYoutube(workspaceId);
  const uploadPdf = useUploadPdf(workspaceId);

  const pending =
    createSource.isPending ||
    importWebsite.isPending ||
    importYoutube.isPending ||
    uploadPdf.isPending;

  function reset() {
    setTitle("");
    setContent("");
    setUrl("");
    setFile(null);
    setFormError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    try {
      if (kind === "text") {
        await createSource.mutateAsync({
          type: "TEXT",
          title: title.trim(),
          content: content.trim(),
        });
      } else if (kind === "website") {
        await importWebsite.mutateAsync({
          url: url.trim(),
          title: title.trim() || undefined,
        });
      } else if (kind === "youtube") {
        await importYoutube.mutateAsync({
          url: url.trim(),
          title: title.trim() || undefined,
        });
      } else {
        if (!file) {
          setFormError("Choose a PDF file to upload.");
          return;
        }
        await uploadPdf.mutateAsync({
          file,
          title: title.trim() || undefined,
        });
      }

      handleOpenChange(false);
    } catch (err) {
      setFormError(
        getUserFacingError(err, "Couldn't add that source. Please try again."),
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="px-5 pt-5 pb-3">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="font-heading text-xl font-medium tracking-[-0.02em]">
              Add source
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Feed text, a website, YouTube, or a PDF into this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 inline-flex w-full rounded-full bg-secondary/70 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setKind(tab.id);
                  setFormError(null);
                }}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-xs font-medium transition-colors",
                  kind === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form className="flex flex-col gap-3 px-5 pb-5" onSubmit={handleSubmit}>
          {kind === "text" || kind === "pdf" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="source-title" className="text-sm font-medium">
                Title{kind === "pdf" ? " (optional)" : ""}
              </label>
              <input
                id="source-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={kind === "pdf" ? "Lecture notes" : "My notes"}
                className={deskFieldClass}
                required={kind === "text"}
                maxLength={200}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="source-title-opt" className="text-sm font-medium">
                Title (optional)
              </label>
              <input
                id="source-title-opt"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Override title"
                className={deskFieldClass}
                maxLength={200}
              />
            </div>
          )}

          {kind === "text" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="source-content" className="text-sm font-medium">
                Content
              </label>
              <textarea
                id="source-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste notes or excerpts…"
                className={cn(deskTextareaClass, "min-h-28")}
                required
              />
            </div>
          ) : null}

          {kind === "website" || kind === "youtube" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="source-url" className="text-sm font-medium">
                URL
              </label>
              <input
                id="source-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  kind === "youtube"
                    ? "https://www.youtube.com/watch?v=…"
                    : "https://…"
                }
                className={deskFieldClass}
                required
              />
            </div>
          ) : null}

          {kind === "pdf" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="source-pdf" className="text-sm font-medium">
                PDF file
              </label>
              <input
                id="source-pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground"
                required
              />
            </div>
          ) : null}

          {formError ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm"
            >
              {formError}
            </div>
          ) : null}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-full"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <SealButton
              type="submit"
              className="h-10 flex-1"
              pending={pending}
              disabled={pending}
            >
              Add source
            </SealButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
