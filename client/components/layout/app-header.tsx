"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ShelfLogo } from "@/components/brand/shelf-logo";
import { DeskCanvas } from "@/components/layout/fixed-column";
import { ThemeToggle } from "@/components/theme-toggle";

type AppHeaderProps = {
  backHref?: string;
  backLabel?: string;
};

export function AppHeader({ backHref, backLabel = "Back" }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
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
        <div className="flex items-center gap-3">
          <ThemeToggle className="rounded-full" />
          <SignOutButton />
        </div>
      </DeskCanvas>
    </header>
  );
}
