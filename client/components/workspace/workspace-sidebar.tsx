"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  FileTextIcon,
  MessageSquareIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
  PlusIcon,
  PlugIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { WorkspaceIcon } from "@/components/workspaces/workspace-icon";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/lib/validators/workspace";
import { useCredits } from "@/hooks/use-credits";

export type WorkspaceNavId = "chat" | "sources" | "artifacts" | "integrations";

type ChatHistoryItem = {
  id: string;
  title: string;
  updatedAt?: string;
};

type WorkspaceSidebarProps = {
  workspace: Workspace;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  activeNav: WorkspaceNavId;
  onNavChange: (nav: WorkspaceNavId) => void;
  onAddSource?: () => void;
  onGenerateArtifact?: () => void;
  activeConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  conversations?: ChatHistoryItem[];
  conversationsLoading?: boolean;
};

const NAV_ITEMS: {
  id: WorkspaceNavId;
  label: string;
  icon: typeof MessageSquareIcon;
}[] = [
  { id: "chat", label: "Chat", icon: MessageSquareIcon },
  { id: "sources", label: "Sources", icon: FileTextIcon },
  { id: "artifacts", label: "Artifacts", icon: SparklesIcon },
  { id: "integrations", label: "Integrations", icon: PlugIcon },
];

export function WorkspaceSidebar({
  workspace,
  collapsed,
  onCollapsedChange,
  activeNav,
  onNavChange,
  onAddSource,
  onGenerateArtifact,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  conversations = [],
  conversationsLoading = false,
}: WorkspaceSidebarProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const { data: creditsData } = useCredits();
  const balance = creditsData?.balance ?? null;
  const initials =
    session?.user?.name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border/70 bg-[#1a1c2e] text-[#f8f6f2] transition-[width] duration-200 ease-out dark:bg-[#161616]",
        collapsed ? "w-[4.25rem]" : "w-[15.5rem]",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b border-white/10 px-3 py-3",
          collapsed ? "flex-col" : "justify-between",
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex min-w-0 items-center gap-2 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/30",
            collapsed && "justify-center",
          )}
          title="Back to workspaces"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <WorkspaceIcon icon={workspace.icon} iconClassName="text-[#f8f6f2]" />
          </span>
          {!collapsed ? (
            <span className="truncate text-sm font-medium">{workspace.title}</span>
          ) : null}
        </Link>

        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftIcon className="size-4" />
          ) : (
            <PanelLeftCloseIcon className="size-4" />
          )}
        </button>
      </div>

      <nav className="flex flex-col gap-1 p-2" aria-label="Workspace">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeNav === id;
          return (
            <div key={id} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => onNavChange(id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-white/30",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/8 hover:text-white",
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                {!collapsed ? <span>{label}</span> : null}
              </button>

              {id === "sources" && !collapsed ? (
                <button
                  type="button"
                  onClick={onAddSource}
                  className="ml-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-white/55 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  <PlusIcon className="size-3.5" />
                  Add sources
                </button>
              ) : null}

              {id === "sources" && collapsed ? (
                <button
                  type="button"
                  onClick={onAddSource}
                  className="mx-auto flex size-8 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                  title="Add sources"
                  aria-label="Add sources"
                >
                  <PlusIcon className="size-3.5" />
                </button>
              ) : null}

              {id === "artifacts" && !collapsed ? (
                <button
                  type="button"
                  onClick={onGenerateArtifact}
                  className="ml-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-white/55 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  <PlusIcon className="size-3.5" />
                  Generate
                </button>
              ) : null}

              {id === "artifacts" && collapsed ? (
                <button
                  type="button"
                  onClick={onGenerateArtifact}
                  className="mx-auto flex size-8 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                  title="Generate artifact"
                  aria-label="Generate artifact"
                >
                  <PlusIcon className="size-3.5" />
                </button>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="mx-3 my-2 h-px bg-white/10" />

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        <div
          className={cn(
            "mb-2 flex items-center px-2",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed ? (
            <p className="text-[0.7rem] font-medium tracking-wide text-white/45 uppercase">
              Chat history
            </p>
          ) : null}
          <button
            type="button"
            onClick={onNewChat}
            className="flex size-7 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            title="New chat"
            aria-label="New chat"
          >
            <PlusIcon className="size-3.5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {conversationsLoading ? (
            !collapsed ? (
              <div className="space-y-2 px-2 py-2" aria-busy="true">
                <div className="h-8 animate-pulse rounded-lg bg-white/10" />
                <div className="h-8 animate-pulse rounded-lg bg-white/10" />
                <div className="h-8 animate-pulse rounded-lg bg-white/10" />
              </div>
            ) : null
          ) : conversations.length === 0 ? (
            !collapsed ? (
              <p className="px-2 py-3 text-xs leading-relaxed text-white/40">
                No chats yet. Ask something to start a thread.
              </p>
            ) : null
          ) : (
            conversations.map((chat) => {
              const active = chat.id === activeConversationId;
              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => {
                    onNavChange("chat");
                    onSelectConversation?.(chat.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors outline-none",
                    "focus-visible:ring-2 focus-visible:ring-white/30",
                    collapsed && "justify-center",
                    active
                      ? "bg-white/12 text-white"
                      : "text-white/65 hover:bg-white/8 hover:text-white",
                  )}
                  title={chat.title}
                >
                  <MessageSquareIcon className="size-3.5 shrink-0 opacity-70" />
                  {!collapsed ? (
                    <span className="truncate">{chat.title}</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div
        className={cn(
          "mt-auto flex items-center gap-2 border-t border-white/10 px-3 py-3",
          collapsed && "flex-col",
        )}
      >
        <Link
          href="/dashboard"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-medium"
          title="All workspaces"
        >
          <ChevronLeftIcon className="size-4" />
        </Link>

        {!collapsed ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[0.7rem] font-medium">
              {initials}
            </span>
            <span className="truncate text-xs text-white/70">
              {session?.user?.name?.split(" ")[0] || "You"}
            </span>
          </div>
        ) : null}

        {/* Credit chip — navigates to billing page */}
        <button
          type="button"
          onClick={() => router.push("/dashboard/billing")}
          aria-label={balance !== null ? `${balance} credits` : "Credits"}
          title="Buy credits"
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-sm border border-white/15 bg-white/8 px-2 py-1 font-mono text-[0.65rem] tabular-nums text-white/70 transition-colors hover:bg-white/15 hover:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
          )}
        >
          <ZapIcon className="size-3 shrink-0" />
          {!collapsed && balance !== null ? (
            <span>{balance.toLocaleString()}</span>
          ) : null}
        </button>
      </div>
    </aside>
  );
}
