"use client";

import { use } from "react";
import Link from "next/link";
import { WorkspaceStudio } from "@/components/workspace/workspace-studio";
import { useWorkspace } from "@/hooks/use-workspaces";
import { getUserFacingError } from "@/lib/errors";

type PageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default function WorkspaceDetailPage({ params }: PageProps) {
  const { workspaceId } = use(params);
  const { data, isPending, isError, error, refetch, isFetching } =
    useWorkspace(workspaceId);

  if (isPending) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-48 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded-full bg-muted/70" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="font-heading text-2xl font-medium">Workspace unavailable</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {getUserFacingError(
            error,
            "This workspace doesn't exist or you don't have access.",
          )}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-full border border-border px-4 py-2 text-sm"
            disabled={isFetching}
          >
            {isFetching ? "Retrying…" : "Retry"}
          </button>
          <Link
            href="/dashboard"
            className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <WorkspaceStudio workspace={data} />;
}
