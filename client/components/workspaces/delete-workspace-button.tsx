"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteWorkspace } from "@/hooks/use-workspaces";
import { getUserFacingError } from "@/lib/errors";

type DeleteWorkspaceDialogProps = {
  workspaceId: string;
  workspaceTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteWorkspaceDialog({
  workspaceId,
  workspaceTitle,
  open,
  onOpenChange,
}: DeleteWorkspaceDialogProps) {
  const router = useRouter();
  const deleteWorkspace = useDeleteWorkspace();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteWorkspace.mutateAsync(workspaceId);
      onOpenChange(false);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        getUserFacingError(
          err,
          "Couldn’t delete this workspace. Please try again.",
        ),
      );
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className="rounded-sm" size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-xl">
            Delete this desk?
          </AlertDialogTitle>
          <AlertDialogDescription>
            “{workspaceTitle}” and its sources, chats, and artifacts will be
            removed. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <Button
            variant="destructive"
            className="rounded-sm"
            onClick={() => void handleDelete()}
            disabled={deleteWorkspace.isPending}
          >
            {deleteWorkspace.isPending ? "Deleting…" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type DeleteWorkspaceButtonProps = {
  workspaceId: string;
  workspaceTitle: string;
};

/** Visible text trigger for settings / detail pages. */
export function DeleteWorkspaceButton({
  workspaceId,
  workspaceTitle,
}: DeleteWorkspaceButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-b border-transparent pb-0.5 font-mono text-[0.7rem] tracking-[0.08em] text-destructive uppercase transition-colors hover:border-destructive"
      >
        Delete workspace
      </button>
      <DeleteWorkspaceDialog
        workspaceId={workspaceId}
        workspaceTitle={workspaceTitle}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
