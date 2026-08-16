"use client";

import { useRouter } from "next/navigation";
import { ZapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCredits } from "@/hooks/use-credits";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Compact credit balance indicator shown in the dashboard header.
 * Clicking navigates to /dashboard/billing — no floating sheet.
 *
 * States:
 *  - Loading   → skeleton pulse
 *  - Healthy   → foreground tint (> 50 credits)
 *  - Low       → amber tint (10–50 credits)
 *  - Critical  → destructive tint (< 10 credits)
 */
export function CreditChip() {
  const router = useRouter();
  const { data, isLoading } = useCredits();

  if (isLoading) {
    return <Skeleton className="h-8 w-20 rounded-sm" />;
  }

  const balance = data?.balance ?? 0;
  const isCritical = balance < 10;
  const isLow = balance >= 10 && balance < 50;

  return (
    <button
      type="button"
      onClick={() => router.push("/dashboard/billing")}
      aria-label={`Credit balance: ${balance} credits. Click to manage.`}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !isCritical && !isLow && "border-border/70 bg-secondary/50 text-foreground hover:bg-secondary",
        isLow && "border-amber-300/40 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-400",
        isCritical && "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10",
      )}
    >
      <ZapIcon
        className={cn(
          "size-3 shrink-0",
          isCritical && "text-destructive",
          isLow && "text-amber-500 dark:text-amber-400",
        )}
      />
      <span className="font-mono tabular-nums tracking-tight">
        {balance.toLocaleString()}
      </span>
      <span className="text-muted-foreground">cr</span>
    </button>
  );
}
