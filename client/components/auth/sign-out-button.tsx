"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
  variant?: "text" | "icon";
};

export function SignOutButton({
  className,
  variant = "text",
}: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    if (pending) return;
    setPending(true);

    try {
      const result = await authClient.signOut();
      if (!result.error) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setPending(false);
    } catch {
      setPending(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className={cn(
          "flex size-10 items-center justify-center rounded-full border border-border/80 bg-secondary/40 text-muted-foreground transition-colors",
          "hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
          "disabled:cursor-wait disabled:opacity-60",
          className,
        )}
        aria-label={pending ? "Signing out…" : "Sign out"}
      >
        <LogOutIcon className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className={cn(
        "text-sm text-muted-foreground transition-colors hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
        "disabled:cursor-wait disabled:opacity-60",
        className,
      )}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
