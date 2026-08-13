"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { DeskShell } from "@/components/layout/desk-shell";
import { WorkspaceForm } from "@/components/workspaces/workspace-form";
import { useCreateWorkspace } from "@/hooks/use-workspaces";
import { fadeUp } from "@/lib/motion";

export default function NewWorkspacePage() {
  const router = useRouter();
  const createWorkspace = useCreateWorkspace();

  return (
    <DeskShell
      title="New workspace"
      backHref="/dashboard"
      backLabel="Workspaces"
    >
      <motion.div className="flex flex-col gap-3" {...fadeUp}>
        <h1 className="font-heading text-[1.75rem] font-semibold tracking-[-0.02em]">
          Open a desk
        </h1>
        <p className="max-w-[40ch] text-[0.95rem] leading-relaxed text-muted-foreground">
          Name the space. You can add sources and chat after it’s created.
        </p>
      </motion.div>

      <WorkspaceForm
        submitLabel="Create workspace"
        pending={createWorkspace.isPending}
        onCancel={() => router.push("/dashboard")}
        onSubmit={async (values) => {
          const workspace = await createWorkspace.mutateAsync(values);
          router.replace(`/dashboard/${workspace.id}`);
        }}
      />
    </DeskShell>
  );
}
