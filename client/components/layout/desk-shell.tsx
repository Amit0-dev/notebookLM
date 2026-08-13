"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { FixedColumn } from "@/components/layout/fixed-column";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

type DeskShellProps = {
  title: string;
  meta?: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

export function DeskShell({
  title,
  meta = "ShelfLM",
  children,
  backHref,
  backLabel = "Back",
  className,
}: DeskShellProps) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/login");
        },
      },
    });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col py-12 sm:py-16">
      <FixedColumn as="main" className={cn("flex flex-col gap-10", className)}>
        <motion.header
          className="flex items-start justify-between gap-4 border-b border-border pb-5"
          {...fadeUp}
        >
          <div className="min-w-0">
            {backHref ? (
              <Link
                href={backHref}
                className="mb-3 inline-block font-mono text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
              >
                ← {backLabel}
              </Link>
            ) : null}
            <p className="font-heading text-2xl font-semibold tracking-[-0.02em]">
              {meta}
            </p>
            <p className="mt-1 font-mono text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">
              {title}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              className="border-b border-transparent pb-1 font-mono text-[0.7rem] tracking-[0.08em] text-muted-foreground uppercase transition-colors hover:border-foreground hover:text-foreground focus-visible:border-ring outline-none"
            >
              Sign out
            </button>
          </div>
        </motion.header>
        {children}
      </FixedColumn>
    </div>
  );
}

export function SealButton({
  children,
  className,
  pending,
  disabled,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  pending?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled || pending}
      onClick={onClick}
      className={cn(
        "relative flex h-12 w-full items-center justify-center gap-2 border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground outline-none",
        "hover:brightness-[0.96] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-wait disabled:opacity-80",
        className,
      )}
      whileTap={disabled || pending ? undefined : { scale: 0.97, rotate: -0.4 }}
      transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
    >
      <span
        className="pointer-events-none absolute top-1.5 right-1.5 size-2 rounded-[1px] bg-[var(--ring)] opacity-90"
        aria-hidden="true"
      />
      {pending ? "Working…" : children}
    </motion.button>
  );
}

export const deskFieldClass =
  "h-10 w-full rounded-sm border border-border bg-background px-3 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50 aria-invalid:border-destructive";

export const deskTextareaClass =
  "min-h-24 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50 aria-invalid:border-destructive resize-y";
