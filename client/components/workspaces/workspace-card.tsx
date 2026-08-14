"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart3Icon,
  BookOpenIcon,
  BriefcaseIcon,
  CodeIcon,
  GraduationCapIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { motion } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteWorkspaceDialog } from "@/components/workspaces/delete-workspace-button";
import type { Workspace } from "@/lib/validators/workspace";
import {
  getWorkspaceCardVariant,
  workspaceCardMetaMuted,
  workspaceCardStyles,
} from "@/lib/workspace-card-theme";
import { cn } from "@/lib/utils";

const CARD_ICONS = [
  BookOpenIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  CodeIcon,
  BarChart3Icon,
] as const;

function getCardIcon(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CARD_ICONS[Math.abs(hash) % CARD_ICONS.length];
}

function formatUpdated(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

type CardLayout = "grid" | "list";

export function CreateWorkspaceCard({ layout = "grid" }: { layout?: CardLayout }) {
  const isList = layout === "list";

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="h-full">
      <Link
        href="/dashboard/new"
        className={cn(
          "flex h-full rounded-2xl border-2 border-dashed border-border/80 bg-card/40 outline-none transition-colors",
          "hover:border-primary/40 hover:bg-secondary/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
          isList
            ? "min-h-[88px] flex-row items-center gap-4 px-5 py-4"
            : "min-h-[200px] flex-col items-center justify-center gap-3 px-6 py-8 text-center",
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary">
          <PlusIcon className="size-5" />
        </span>
        <div className={cn(isList && "text-left")}>
          <span className="block text-base font-semibold tracking-[-0.02em]">
            Create new workspace
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Feed sources and start chatting.
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function WorkspaceCard({
  workspace,
  layout = "grid",
}: {
  workspace: Workspace;
  layout?: CardLayout;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const variant = getWorkspaceCardVariant(workspace.id);
  const Icon = getCardIcon(workspace.id);
  const isList = layout === "list";

  const metaMuted = cn("text-sm", workspaceCardMetaMuted[variant]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative h-full"
    >
      <Link
        href={`/dashboard/${workspace.id}`}
        className={cn(
          "group relative flex h-full overflow-hidden rounded-2xl border p-5 outline-none transition-[box-shadow,border-color]",
          "hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/25",
          workspaceCardStyles[variant],
          isList ? "min-h-[88px] flex-row items-center gap-4" : "min-h-[200px] flex-col",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-start justify-between gap-3",
            isList ? "flex-row items-center" : "w-full",
          )}
        >
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-xl bg-black/10 dark:bg-white/10",
              workspace.icon?.trim() ? "text-lg" : "",
            )}
            aria-hidden="true"
          >
            {workspace.icon?.trim() ? (
              workspace.icon.trim()
            ) : (
              <Icon className="size-5" strokeWidth={1.5} />
            )}
          </span>
          {!isList && <span className="size-8" aria-hidden="true" />}
        </div>

        <div className={cn("min-w-0 flex-1", !isList && "mt-auto space-y-2 pr-1")}>
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-balance">
            {workspace.title}
          </h3>
          <p className={metaMuted}>
            {workspace.description?.trim()
              ? workspace.description.trim()
              : "Ready for sources"}
            <span className="mx-1.5 opacity-50">•</span>
            Updated {formatUpdated(workspace.updatedAt)}
          </p>
        </div>
      </Link>

      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex size-8 items-center justify-center rounded-full bg-black/10 text-inherit outline-none transition-colors",
              "hover:bg-black/20 focus-visible:ring-2 focus-visible:ring-ring/25 dark:bg-white/10 dark:hover:bg-white/20",
            )}
            aria-label={`Actions for ${workspace.title}`}
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40 rounded-xl">
            <DropdownMenuItem
              className="gap-2 rounded-lg"
              onClick={() => router.push(`/dashboard/${workspace.id}`)}
            >
              <PencilIcon className="size-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              className="gap-2 rounded-lg"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon className="size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DeleteWorkspaceDialog
        workspaceId={workspace.id}
        workspaceTitle={workspace.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </motion.div>
  );
}
