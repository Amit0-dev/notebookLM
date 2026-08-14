"use client";

import { PlugIcon } from "lucide-react";
import type { Workspace } from "@/lib/validators/workspace";

type WorkspaceIntegrationsPanelProps = {
  workspace: Workspace;
};

export function WorkspaceIntegrationsPanel({
  workspace,
}: WorkspaceIntegrationsPanelProps) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <header className="shrink-0 border-b border-border/60 px-5 py-4 sm:px-7">
        <h1 className="font-heading text-2xl font-medium tracking-[-0.02em]">
          Integrations
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Connect tools for {workspace.title}
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
          <PlugIcon className="size-5" />
        </span>
        <p className="font-heading text-xl font-medium">Coming soon</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Push learning into Notion, Slack, and more — integrations land next.
        </p>
      </div>
    </div>
  );
}
