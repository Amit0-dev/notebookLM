"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkspaceForm } from "@/components/workspaces/workspace-form";
import { useUpdateWorkspace } from "@/hooks/use-workspaces";
import { CHAT_MODELS } from "@/lib/validators/workspace";
import type { Workspace } from "@/lib/validators/workspace";

type EditWorkspaceDialogProps = {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
}: EditWorkspaceDialogProps) {
  const updateWorkspace = useUpdateWorkspace(workspace.id);
  const model = (CHAT_MODELS as readonly string[]).includes(
    workspace.defaultModel,
  )
    ? (workspace.defaultModel as (typeof CHAT_MODELS)[number])
    : "gpt-4o-mini";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="px-5 pt-5 pb-3">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="font-heading text-xl font-medium tracking-[-0.02em]">
              Edit workspace
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Update title, icon, and default model.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-5 pb-5">
          <WorkspaceForm
            key={workspace.updatedAt.toString()}
            variant="modal"
            initial={{
              title: workspace.title,
              description: workspace.description ?? "",
              icon: workspace.icon ?? "",
              defaultModel: model,
            }}
            submitLabel="Save changes"
            pending={updateWorkspace.isPending}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (values) => {
              await updateWorkspace.mutateAsync(values);
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
