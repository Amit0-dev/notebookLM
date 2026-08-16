"use client";

import { useState } from "react";
import { CheckIcon, ZapIcon, ReceiptIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlans, useCreateOrder, useCredits, useLedger } from "@/hooks/use-credits";
import type { Plan, PlanBundle, LedgerEntry } from "@/lib/api/billing";
import { format } from "date-fns";

type BuyCreditsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Tab = "plans" | "history";

export function BuyCreditsSheet({ open, onOpenChange }: BuyCreditsSheetProps) {
  const [activeTab, setActiveTab] = useState<Tab>("plans");
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: balanceData } = useCredits();
  const { mutateAsync: createOrder } = useCreateOrder();
  const [pending, setPending] = useState<string | null>(null);

  const currentPlanId = balanceData?.subscription?.planId ?? "FREE";

  async function handleBuy(bundle: PlanBundle, planId: string) {
    const key = `${planId}-${bundle.credits}`;
    setPending(key);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        console.error("[Razorpay] Failed to load checkout script");
        return;
      }

      const order = await createOrder({ priceInr: bundle.priceInr, credits: bundle.credits });

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "ShelfLM",
        description: bundle.label,
        theme: { color: "#1a1c2e" },
        handler: () => {
          // Webhook handles the credit — close sheet and balance refetches
          onOpenChange(false);
        },
        modal: {
          ondismiss: () => setPending(null),
        },
      });

      rzp.open();
    } finally {
      setPending(null);
    }
  }

  const plans = plansData?.plans ?? {};
  const paidPlans = Object.values(plans).filter((p) => p.id !== "FREE");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-md flex-col gap-0 overflow-hidden p-0"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="text-base font-semibold tracking-[-0.01em]">
            Credits
          </SheetTitle>
          {balanceData && (
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              Balance:{" "}
              <span className="font-medium text-foreground">
                {balanceData.balance.toLocaleString()} cr
              </span>
            </p>
          )}
        </SheetHeader>

        {/* ── Tab bar — line variant, per design: hairline underline tabs ── */}
        <div className="flex border-b border-border/60">
          {(["plans", "history"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex h-10 flex-1 items-center justify-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                activeTab === tab
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "plans" ? (
                <><ZapIcon className="size-3" /> Plans</>
              ) : (
                <><ReceiptIcon className="size-3" /> History</>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "plans" && (
            <div className="flex flex-col divide-y divide-border/60">
              {plansLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="space-y-3 px-6 py-6">
                      <Skeleton className="h-4 w-24 rounded-sm" />
                      <Skeleton className="h-3 w-48 rounded-sm" />
                      <div className="space-y-2 pt-1">
                        <Skeleton className="h-12 w-full rounded-sm" />
                        <Skeleton className="h-12 w-full rounded-sm" />
                      </div>
                    </div>
                  ))
                : paidPlans.map((plan) => (
                    <PlanSection
                      key={plan.id}
                      plan={plan}
                      isCurrent={currentPlanId === plan.id}
                      pending={pending}
                      onBuy={(bundle) => handleBuy(bundle, plan.id)}
                    />
                  ))}
            </div>
          )}

          {activeTab === "history" && <LedgerTab />}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t border-border/60 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Credits never expire · Payments secured by Razorpay
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Ledger tab ───────────────────────────────────────────────────────────────

function LedgerTab() {
  const { data, isLoading } = useLedger(50);
  const entries = data?.ledger ?? [];

  if (isLoading) {
    return (
      <div className="space-y-px px-6 py-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between border-b border-border/40 py-3">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-32 rounded-sm" />
              <Skeleton className="h-2.5 w-20 rounded-sm" />
            </div>
            <Skeleton className="h-3 w-12 rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <ReceiptIcon className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No transactions yet</p>
        <p className="text-xs text-muted-foreground/60">
          Usage will appear here after your first chat or source upload.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {entries.map((entry) => (
        <LedgerRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const isCredit = entry.credits > 0;

  const label: Record<string, string> = {
    CHAT_MESSAGE:        "Chat",
    SOURCE_PROCESSING:   "Source indexed",
    ARTIFACT_GENERATION: "Artifact",
    CREDIT_PURCHASE:     "Purchase",
    SIGNUP_BONUS:        "Welcome bonus",
    REFUND:              "Refund",
  };

  return (
    <div className="flex items-start justify-between gap-3 px-6 py-3">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-xs font-medium text-foreground">
          {label[entry.operation] ?? entry.operation}
        </p>
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
          {format(new Date(entry.createdAt), "dd MMM · HH:mm")}
          {entry.model ? ` · ${entry.model}` : ""}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 font-mono text-xs font-medium tabular-nums",
          isCredit ? "text-ring" : "text-muted-foreground",
        )}
      >
        {isCredit ? "+" : ""}
        {entry.credits.toFixed(1)} cr
      </span>
    </div>
  );
}

// ── Plan section ─────────────────────────────────────────────────────────────

type PlanSectionProps = {
  plan: Plan;
  isCurrent: boolean;
  pending: string | null;
  onBuy: (bundle: PlanBundle) => void;
};

function PlanSection({ plan, isCurrent, pending, onBuy }: PlanSectionProps) {
  const bundles: PlanBundle[] = (plan as { bundles?: PlanBundle[] }).bundles ?? [];

  return (
    <div className="space-y-4 px-6 py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
            {plan.id}
          </p>
          <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
          <p className="text-xs text-muted-foreground">{plan.description}</p>
        </div>
        {isCurrent && (
          <span className="flex shrink-0 items-center gap-1 rounded-sm border border-border/60 bg-secondary px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
            <CheckIcon className="size-3" />
            Current
          </span>
        )}
      </div>

      {plan.integrationsEnabled && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckIcon className="size-3 text-ring" />
          Includes integrations (Notion, Eraser and more)
        </p>
      )}

      <div className="space-y-2">
        {bundles.map((bundle) => {
          const key = `${plan.id}-${bundle.credits}`;
          const isPending = pending === key;
          return (
            <BundleRow
              key={key}
              bundle={bundle}
              isPending={isPending}
              anyPending={!!pending}
              onBuy={() => onBuy(bundle)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Bundle row ────────────────────────────────────────────────────────────────

type BundleRowProps = {
  bundle: PlanBundle;
  isPending: boolean;
  anyPending: boolean;
  onBuy: () => void;
};

function BundleRow({ bundle, isPending, anyPending, onBuy }: BundleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 border border-border/70 bg-secondary/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <ZapIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <div>
          <span className="font-mono text-sm font-medium tabular-nums text-foreground">
            {bundle.credits.toLocaleString()}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">credits</span>
          {bundle.monthly && (
            <span className="ml-1.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
              /mo
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onBuy}
        disabled={anyPending}
        className={cn(
          "flex h-9 items-center rounded-sm bg-primary px-3.5 font-mono text-xs font-medium text-primary-foreground",
          "transition-opacity hover:opacity-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-wait disabled:opacity-60",
        )}
      >
        {isPending ? "Opening…" : `₹${bundle.priceInr}`}
      </button>
    </div>
  );
}
