"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkspaceForm } from "@/components/workspaces/workspace-form";
import { useCreateWorkspace } from "@/hooks/use-workspaces";

type CreateWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const createWorkspace = useCreateWorkspace();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="px-5 pt-5 pb-3">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="font-heading text-xl font-medium tracking-[-0.02em]">
              Open a desk
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Name your workspace — add sources and chat after.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5">
          <WorkspaceForm
            key={open ? "open" : "closed"}
            variant="modal"
            submitLabel="Create workspace"
            pending={createWorkspace.isPending}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (values) => {
              const workspace = await createWorkspace.mutateAsync(values);
              onOpenChange(false);
              router.push(`/dashboard/${workspace.id}`);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
