"use client";

import { useMemo, useState } from "react";
import { BookOpenIcon, MessageSquareIcon, SparklesIcon, SearchIcon } from "lucide-react";
import { motion } from "motion/react";
import { AppHeader } from "@/components/layout/app-header";
import { DeskCanvas } from "@/components/layout/fixed-column";
import {
  CreateWorkspaceCard,
  WorkspaceCard,
} from "@/components/workspaces/workspace-card";
import { authClient } from "@/lib/auth-client";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { getUserFacingError } from "@/lib/errors";
import { easeOutExpo } from "@/lib/motion";

const tips = [
  {
    icon: BookOpenIcon,
    title: "Feed sources",
    body: "Add PDFs, websites, YouTube, or notes to ground every answer.",
  },
  {
    icon: MessageSquareIcon,
    title: "Chat with context",
    body: "Ask across your materials — citations stay tied to what you kept.",
  },
  {
    icon: SparklesIcon,
    title: "Turn learning into action",
    body: "Generate artifacts and push outputs into tools you already use.",
  },
] as const;

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const { data, isPending, isError, error, refetch, isFetching } =
    useWorkspaces();
  const [query, setQuery] = useState("");

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
      <AppHeader />

      <DeskCanvas as="main" className="flex flex-1 flex-col gap-10 py-10 sm:py-12">
        <motion.section
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOutExpo}
        >
          <p className="font-mono text-[0.7rem] tracking-[0.12em] text-primary uppercase">
            Welcome back, {firstName}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Your workspaces
          </h1>
          <p className="max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
            Organize sources, chat with your materials, and generate learning
            tools — all in one desk.
          </p>
        </motion.section>

        <motion.section
          className="grid gap-3 sm:grid-cols-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOutExpo, delay: 0.05 }}
        >
          {tips.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex gap-3 border border-border bg-card/60 p-4"
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </motion.section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">
                Recent workspaces
              </h2>
              <p className="mt-1 font-mono text-[0.65rem] tracking-[0.1em] text-muted-foreground uppercase">
                {isPending ? "Loading…" : countLabel}
              </p>
            </div>

            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Search workspaces</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search workspaces…"
                className="h-10 w-full border border-border bg-background pr-3 pl-10 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </label>
          </div>

          {isError ? (
            <div
              role="alert"
              className="border border-primary/40 bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-4 py-3"
            >
              <p className="font-mono text-[0.7rem] tracking-[0.12em] text-primary uppercase">
                Couldn’t load
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {getUserFacingError(
                  error,
                  "We couldn’t load your workspaces. Please try again.",
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
          ) : null}

          {isPending ? (
            <div
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              aria-busy="true"
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="min-h-[220px] animate-pulse border border-border bg-muted/60"
                />
              ))}
            </div>
          ) : null}

          {!isPending && !isError ? (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05 } },
              }}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0, transition: easeOutExpo },
                }}
              >
                <CreateWorkspaceCard />
              </motion.div>

              {filtered.map((workspace) => (
                <motion.div
                  key={workspace.id}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    show: { opacity: 1, y: 0, transition: easeOutExpo },
                  }}
                >
                  <WorkspaceCard workspace={workspace} />
                </motion.div>
              ))}
            </motion.div>
          ) : null}

          {!isPending &&
          !isError &&
          workspaces.length > 0 &&
          filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workspaces match “{query.trim()}”.
            </p>
          ) : null}
        </section>
      </DeskCanvas>
    </div>
  );
}
