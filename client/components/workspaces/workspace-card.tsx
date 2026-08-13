"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { motion } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteWorkspaceDialog } from "@/components/workspaces/delete-workspace-button";
import type { Workspace } from "@/lib/validators/workspace";
import { cn } from "@/lib/utils";

function formatUpdated(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function CreateWorkspaceCard() {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="h-full">
      <Link
        href="/dashboard/new"
        className={cn(
          "flex h-full min-h-[220px] flex-col items-center justify-center gap-3 border border-dashed border-border bg-background/40 px-6 text-center outline-none transition-colors",
          "hover:border-primary/50 hover:bg-secondary/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        )}
      >
        <span className="flex size-12 items-center justify-center border border-border text-2xl leading-none text-primary">
          +
        </span>
        <span className="font-heading text-base font-semibold tracking-[-0.02em]">
          Create workspace
        </span>
        <span className="max-w-[18ch] text-sm leading-relaxed text-muted-foreground">
          Feed sources and start chatting.
        </span>
      </Link>
    </motion.div>
  );
}

export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative h-full min-h-[220px]"
    >
      <Link
        href={`/dashboard/${workspace.id}`}
        className={cn(
          "group relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden border border-border p-5 outline-none",
          "bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_16%,var(--secondary))_0%,var(--card)_52%,var(--background)_100%)]",
          "hover:border-primary/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className="flex size-9 items-center justify-center border border-border/80 bg-background/55 text-sm"
            aria-hidden="true"
          >
            {workspace.icon?.trim() || "棚"}
          </span>
          <span className="size-8" aria-hidden="true" />
        </div>

        <div className="mt-auto space-y-2 pr-1">
          <h3 className="font-heading text-xl font-semibold tracking-[-0.02em] text-balance">
            {workspace.title}
          </h3>
          {workspace.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {workspace.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No description yet</p>
          )}
          <p className="font-mono text-[0.65rem] tracking-[0.08em] text-muted-foreground uppercase">
            Updated {formatUpdated(workspace.updatedAt)}
          </p>
        </div>
      </Link>

      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex size-8 items-center justify-center border border-transparent bg-background/75 text-foreground outline-none transition-colors",
              "hover:border-border hover:bg-background focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
            )}
            aria-label={`Actions for ${workspace.title}`}
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40 rounded-sm">
            <DropdownMenuItem
              className="rounded-sm gap-2"
              onClick={() => router.push(`/dashboard/${workspace.id}`)}
            >
              <PencilIcon className="size-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              className="rounded-sm gap-2"
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
