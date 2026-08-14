"use client";

import { useState } from "react";
import {
  WorkspaceSidebar,
  type WorkspaceNavId,
} from "@/components/workspace/workspace-sidebar";
import { WorkspaceChatPanel } from "@/components/workspace/workspace-chat-panel";
import { WorkspaceSourcesPanel } from "@/components/workspace/workspace-sources-panel";
import { WorkspaceArtifactsPanel } from "@/components/workspace/workspace-artifacts-panel";
import { WorkspaceIntegrationsPanel } from "@/components/workspace/workspace-integrations-panel";
import { EditWorkspaceDialog } from "@/components/workspace/edit-workspace-dialog";
import {
  useConversations,
  useCreateConversation,
} from "@/hooks/use-conversations";
import type { Workspace } from "@/lib/validators/workspace";

type WorkspaceStudioProps = {
  workspace: Workspace;
};

export function WorkspaceStudio({ workspace }: WorkspaceStudioProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState<WorkspaceNavId>("chat");
  const [editOpen, setEditOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [createArtifactOpen, setCreateArtifactOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const { data: conversations = [], isPending: conversationsLoading } =
    useConversations(workspace.id);
  const createConversation = useCreateConversation(workspace.id);

  const historyItems = conversations.map((c) => ({
    id: c.id,
    title: c.title?.trim() || "Untitled chat",
    updatedAt:
      typeof c.updatedAt === "string"
        ? c.updatedAt
        : c.updatedAt.toISOString(),
  }));

  function handleAddSource() {
    setActiveNav("sources");
    setAddSourceOpen(true);
  }

  function handleGenerateArtifact() {
    setActiveNav("artifacts");
    setCreateArtifactOpen(true);
  }

  async function handleNewChat() {
    setActiveNav("chat");
    const conversation = await createConversation.mutateAsync({});
    setActiveConversationId(conversation.id);
  }

  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden">
      <WorkspaceSidebar
        workspace={workspace}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onAddSource={handleAddSource}
        onGenerateArtifact={handleGenerateArtifact}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewChat={() => {
          void handleNewChat();
        }}
        conversations={historyItems}
        conversationsLoading={conversationsLoading}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {activeNav === "chat" ? (
          <WorkspaceChatPanel
            workspace={workspace}
            conversationId={activeConversationId}
            onConversationId={setActiveConversationId}
            onEdit={() => setEditOpen(true)}
          />
        ) : null}
        {activeNav === "sources" ? (
          <WorkspaceSourcesPanel
            workspace={workspace}
            addOpen={addSourceOpen}
            onAddOpenChange={setAddSourceOpen}
          />
        ) : null}
        {activeNav === "artifacts" ? (
          <WorkspaceArtifactsPanel
            workspace={workspace}
            createOpen={createArtifactOpen}
            onCreateOpenChange={setCreateArtifactOpen}
          />
        ) : null}
        {activeNav === "integrations" ? (
          <WorkspaceIntegrationsPanel workspace={workspace} />
        ) : null}
      </main>

      <EditWorkspaceDialog
        workspace={workspace}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
