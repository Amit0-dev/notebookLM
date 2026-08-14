"use client";

import Link from "next/link";
import { BellIcon, PlusIcon, SearchIcon } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ShelfLogo } from "@/components/brand/shelf-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { DeskCanvas } from "@/components/layout/fixed-column";
import { cn } from "@/lib/utils";

type DashboardHeaderProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
};

export function DashboardHeader({
  search = "",
  onSearchChange,
  showSearch = true,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <DeskCanvas className="flex h-16 items-center gap-4 sm:gap-6">
        <ShelfLogo />

        {showSearch && onSearchChange ? (
          <label className="relative mx-auto hidden min-w-0 flex-1 sm:block sm:max-w-md lg:max-w-xl">
            <span className="sr-only">Search workspaces</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search workspaces…"
              className="h-11 w-full rounded-full border border-border/80 bg-secondary/60 pr-4 pl-11 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
            />
          </label>
        ) : (
          <div className="hidden flex-1 sm:block" />
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/new"
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity",
              "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">New Workspace</span>
            <span className="sm:hidden">New</span>
          </Link>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full border border-border/80 bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            aria-label="Notifications"
          >
            <BellIcon className="size-4" />
          </button>
          <ThemeToggle className="rounded-full" />
          <SignOutButton />
        </div>
      </DeskCanvas>
    </header>
  );
}
