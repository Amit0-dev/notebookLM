"use client";

import { useRouter } from "next/navigation";
import { ZapOffIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCredits } from "@/hooks/use-credits";
import { cn } from "@/lib/utils";

type LowBalanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Shown when the server returns HTTP 402 (InsufficientCreditsError).
 * "Buy credits" navigates to /dashboard/billing.
 */
export function LowBalanceDialog({ open, onOpenChange }: LowBalanceDialogProps) {
  const router = useRouter();
  const { data } = useCredits();
  const balance = data?.balance ?? 0;

  function handleBuy() {
    onOpenChange(false);
    router.push("/dashboard/billing");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-0">
        {/* Alert stamp — destructive border at low opacity, light wash */}
        <div className="border-b border-destructive/20 bg-destructive/5 px-6 py-5">
          <div className="flex items-start gap-3">
            <ZapOffIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="space-y-1">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-destructive">
                Out of credits
              </p>
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold text-foreground">
                  You&apos;ve run out of credits
                </DialogTitle>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <DialogDescription className="text-sm text-muted-foreground">
            Your balance is{" "}
            <span className="font-mono font-medium tabular-nums text-foreground">
              {balance.toLocaleString()} cr
            </span>
            . Top up to continue chatting and generating content.
          </DialogDescription>

          <div className="border-t border-border/60" />

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleBuy}
              className={cn(
                "flex h-11 w-full items-center justify-center rounded-sm bg-primary px-4",
                "text-sm font-medium text-primary-foreground",
                "transition-opacity hover:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              Buy credits
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-full items-center justify-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
            >
              Dismiss
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
