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
      title="Open a desk"
      meta="New workspace"
      backHref="/dashboard"
      backLabel="Workspaces"
    >
      <motion.p
        className="max-w-lg text-[0.95rem] leading-relaxed text-muted-foreground"
        {...fadeUp}
      >
        Name the space. You can add sources and chat after it&apos;s created.
      </motion.p>

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
