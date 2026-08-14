"use client";

import { useMemo, useState } from "react";
import { LayoutGridIcon, ListIcon } from "lucide-react";
import { motion } from "motion/react";
import { ZenWash } from "@/components/art/zen-wash";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DeskCanvas } from "@/components/layout/fixed-column";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";
import {
  CreateWorkspaceCard,
  WorkspaceCard,
} from "@/components/workspaces/workspace-card";
import { authClient } from "@/lib/auth-client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { getUserFacingError } from "@/lib/errors";
import { easeOutExpo } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const { data, isPending, isError, error, refetch, isFetching } =
    useWorkspaces();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [createOpen, setCreateOpen] = useState(false);

  const workspaces = data ?? [];
  const firstName =
    session?.user?.name?.split(" ")[0] ||
    session?.user?.email?.split("@")[0] ||
    "there";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        (w.description ?? "").toLowerCase().includes(q),
    );
  }, [workspaces, query]);

  const countLabel =
    filtered.length === 1 ? "1 workspace" : `${filtered.length} workspaces`;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <DashboardHeader
        search={query}
        onSearchChange={setQuery}
        onCreateClick={() => setCreateOpen(true)}
      />

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />

      <DeskCanvas as="main" className="flex flex-1 flex-col gap-8 py-8 sm:py-10">
        <motion.section
          className="relative flex flex-col gap-2 sm:gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOutExpo}
        >
          <ZenWash className="pointer-events-none absolute -top-4 right-0 hidden h-48 w-72 opacity-90 lg:block xl:-right-4 xl:h-56 xl:w-80" />
          <h1 className="font-heading text-3xl leading-snug tracking-[-0.02em] text-foreground sm:text-4xl lg:text-[2.75rem]">
            Welcome back,{" "}
            <span className="font-semibold">{firstName}</span>
          </h1>
          <p className="max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
            Pick up where you left off — your shelves are ready.
          </p>
        </motion.section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex h-8 items-center rounded-full bg-secondary px-3.5 text-sm font-medium text-foreground">
              {isPending ? "Loading…" : countLabel}
            </span>

            <div className="flex items-center gap-2">
              <label className="relative block w-full sm:hidden">
                <span className="sr-only">Search workspaces</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search workspaces…"
                  className="h-10 w-full rounded-full border border-border/80 bg-secondary/60 px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                />
              </label>

              <div className="inline-flex rounded-full border border-border/80 bg-secondary/40 p-1">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-colors",
                    view === "grid"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                >
                  <LayoutGridIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-colors",
                    view === "list"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-label="List view"
                  aria-pressed={view === "list"}
                >
                  <ListIcon className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {isError ? (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-3"
            >
              <p className="text-sm font-medium text-destructive">
                Couldn&apos;t load workspaces
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {getUserFacingError(
                  error,
                  "We couldn't load your workspaces. Please try again.",
                )}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-3 text-sm font-medium underline underline-offset-2"
                disabled={isFetching}
              >
                {isFetching ? "Retrying…" : "Retry"}
              </button>
            </div>
          ) : null}

          {isPending ? (
            <div
              className={cn(
                "gap-4",
                view === "grid"
                  ? "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col",
              )}
              aria-busy="true"
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "animate-pulse rounded-2xl bg-muted/60",
                    view === "grid" ? "min-h-[200px]" : "min-h-[88px]",
                  )}
                />
              ))}
            </div>
          ) : null}

          {!isPending && !isError ? (
            <motion.div
              className={cn(
                "gap-4",
                view === "grid"
                  ? "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col",
              )}
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.04 } },
              }}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0, transition: easeOutExpo },
                }}
              >
                <CreateWorkspaceCard
                  layout={view}
                  onClick={() => setCreateOpen(true)}
                />
              </motion.div>

              {filtered.map((workspace) => (
                <motion.div
                  key={workspace.id}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    show: { opacity: 1, y: 0, transition: easeOutExpo },
                  }}
                >
                  <WorkspaceCard workspace={workspace} layout={view} />
                </motion.div>
              ))}
            </motion.div>
          ) : null}

          {!isPending &&
          !isError &&
          workspaces.length > 0 &&
          filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workspaces match &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : null}
        </section>
      </DeskCanvas>
    </div>
  );
}
