"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { DeskCanvas } from "@/components/layout/fixed-column";
import { authClient } from "@/lib/auth-client";

type AppHeaderProps = {
  backHref?: string;
  backLabel?: string;
};

export function AppHeader({ backHref, backLabel = "Back" }: AppHeaderProps) {
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
    <header className="border-b border-border/80">
      <DeskCanvas className="flex h-14 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {backHref ? (
            <Link
              href={backHref}
              className="font-mono text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              ← {backLabel}
            </Link>
          ) : null}
          <Link
            href="/dashboard"
            className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground"
          >
            ShelfLM
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={signOut}
            className="border-b border-transparent pb-0.5 font-mono text-[0.7rem] tracking-[0.08em] text-muted-foreground uppercase transition-colors hover:border-foreground hover:text-foreground outline-none focus-visible:border-ring"
          >
            Sign out
          </button>
        </div>
      </DeskCanvas>
    </header>
  );
}
