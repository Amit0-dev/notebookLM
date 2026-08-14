"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ShelfLogo } from "@/components/brand/shelf-logo";
import { DeskCanvas } from "@/components/layout/fixed-column";
import { ThemeToggle } from "@/components/theme-toggle";
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
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-md">
        <DeskCanvas className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <ShelfLogo />
            {backHref ? (
              <Link
                href={backHref}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ← {backLabel}
              </Link>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <ThemeToggle className="rounded-full" />
            <SignOutButton />
          </div>
        </DeskCanvas>
      </header>

      <DeskCanvas as="main" className={cn("flex flex-col gap-8 py-8 sm:py-10", className)}>
        <motion.header className="space-y-1" {...fadeUp}>
          <p className="text-sm text-muted-foreground">{meta}</p>
          <h1 className="font-heading text-3xl font-medium tracking-[-0.02em]">
            {title}
          </h1>
        </motion.header>
        {children}
      </DeskCanvas>
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
        "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground outline-none",
        "hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-wait disabled:opacity-80",
        className,
      )}
      whileTap={disabled || pending ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {pending ? "Working…" : children}
    </motion.button>
  );
}

export const deskFieldClass =
  "h-11 w-full rounded-full border border-border/80 bg-background px-4 text-sm text-foreground outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50 aria-invalid:border-destructive";

export const deskSelectClass =
  "h-11 w-full appearance-none rounded-full border border-border/80 bg-background bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10 pl-4 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50 aria-invalid:border-destructive";

export const deskTextareaClass =
  "min-h-28 w-full rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm text-foreground outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50 aria-invalid:border-destructive resize-y";
