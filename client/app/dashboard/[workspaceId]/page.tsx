"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { DeskShell } from "@/components/layout/desk-shell";
import { WorkspaceForm } from "@/components/workspaces/workspace-form";
import { DeleteWorkspaceButton } from "@/components/workspaces/delete-workspace-button";
import {
  useUpdateWorkspace,
  useWorkspace,
} from "@/hooks/use-workspaces";
import { getUserFacingError } from "@/lib/errors";
import { fadeUp } from "@/lib/motion";
import { CHAT_MODELS } from "@/lib/validators/workspace";

type PageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default function WorkspaceDetailPage({ params }: PageProps) {
  const { workspaceId } = use(params);
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isFetching } =
    useWorkspace(workspaceId);
  const updateWorkspace = useUpdateWorkspace(workspaceId);
  const [saved, setSaved] = useState(false);

  if (isPending) {
    return (
      <DeskShell
        title="Workspace"
        backHref="/dashboard"
        backLabel="Workspaces"
      >
        <div className="flex flex-col gap-4" aria-busy="true">
          <div className="h-8 w-2/3 animate-pulse bg-muted" />
          <div className="h-4 w-full animate-pulse bg-muted" />
          <div className="h-32 w-full animate-pulse bg-muted" />
        </div>
      </DeskShell>
    );
  }

  if (isError || !data) {
    return (
      <DeskShell
        title="Workspace"
        backHref="/dashboard"
        backLabel="Workspaces"
      >
        <div
          role="alert"
          className="border border-primary/40 bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-3 py-3"
        >
          <p className="font-mono text-[0.7rem] tracking-[0.12em] text-primary uppercase">
            Couldn’t load
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">
            {getUserFacingError(
              error,
              "This workspace doesn’t exist or you don’t have access.",
            )}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 border-b border-foreground pb-0.5 font-mono text-[0.7rem] tracking-[0.08em] uppercase"
            disabled={isFetching}
          >
            {isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      </DeskShell>
    );
  }

  const model = (CHAT_MODELS as readonly string[]).includes(data.defaultModel)
    ? (data.defaultModel as (typeof CHAT_MODELS)[number])
    : "gpt-4o-mini";

  return (
    <DeskShell
      title="Edit workspace"
      backHref="/dashboard"
      backLabel="Workspaces"
    >
      <motion.div className="flex flex-col gap-3" {...fadeUp}>
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center border border-border bg-secondary text-base"
            aria-hidden="true"
          >
            {data.icon?.trim() || "棚"}
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-[1.75rem] font-semibold tracking-[-0.02em] text-balance">
              {data.title}
            </h1>
            <p className="mt-1 font-mono text-[0.65rem] tracking-[0.08em] text-muted-foreground uppercase">
              Model {data.defaultModel}
            </p>
          </div>
        </div>
        <p className="max-w-[40ch] text-[0.95rem] leading-relaxed text-muted-foreground">
          Update the desk details. Sources and chat land here next.
        </p>
      </motion.div>

      <AnimatePresence>
        {saved ? (
          <motion.p
            key="saved"
            role="status"
            className="font-mono text-[0.7rem] tracking-[0.08em] text-primary uppercase"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Saved
          </motion.p>
        ) : null}
      </AnimatePresence>

      <WorkspaceForm
        key={data.updatedAt.toString()}
        initial={{
          title: data.title,
          description: data.description ?? "",
          icon: data.icon ?? "",
          defaultModel: model,
        }}
        submitLabel="Save changes"
        pending={updateWorkspace.isPending}
        onCancel={() => router.push("/dashboard")}
        onSubmit={async (values) => {
          await updateWorkspace.mutateAsync(values);
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2000);
        }}
      />

      <div className="border-t border-border pt-8">
        <p className="font-mono text-[0.7rem] tracking-[0.08em] text-muted-foreground uppercase">
          Danger
        </p>
        <p className="mt-2 mb-4 max-w-[36ch] text-sm leading-relaxed text-muted-foreground">
          Deleting removes this workspace and everything inside it.
        </p>
        <DeleteWorkspaceButton
          workspaceId={data.id}
          workspaceTitle={data.title}
        />
      </div>
    </DeskShell>
  );
}
