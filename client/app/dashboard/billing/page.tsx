"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ZapIcon,
  ReceiptIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  CheckIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeskCanvas } from "@/components/layout/fixed-column";
import { ShelfLogo } from "@/components/brand/shelf-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlans, useCreateOrder, useCredits, useLedger } from "@/hooks/use-credits";
import type { Plan, PlanBundle, LedgerEntry } from "@/lib/api/billing";
import { format } from "date-fns";

// ── Razorpay ──────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "plans" | "history";

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "plans",   label: "Plans",   Icon: ZapIcon },
  { id: "history", label: "History", Icon: ReceiptIcon },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab]   = useState<Tab>("plans");
  const [collapsed, setCollapsed]   = useState(false);
  const { data: balanceData }       = useCredits();

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header — same pattern as DeskShell / DashboardHeader */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <DeskCanvas className="flex h-16 items-center gap-4">
          <ShelfLogo />
          <div className="ml-auto flex items-center gap-3">
            {balanceData && (
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                <span className="font-medium text-foreground">
                  {balanceData.balance.toLocaleString()}
                </span>{" "}
                cr remaining
              </span>
            )}
            <ThemeToggle className="rounded-full" />
            <SignOutButton />
          </div>
        </DeskCanvas>
      </header>

      {/* Body — sidebar + content */}
      <DeskCanvas as="main" className="flex flex-1 gap-0 py-0">
        {/* ── Left sidebar ─────────────────────────────────────────────── */}
        <aside
          className={cn(
            "sticky top-16 flex h-[calc(100svh-4rem)] shrink-0 flex-col border-r border-border/60 transition-[width] duration-200",
            collapsed ? "w-14" : "w-52",
          )}
        >
          {/* Back button — top of sidebar, above nav items */}
          <div className="border-b border-border/60 p-2">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className={cn(
                "flex h-9 w-full items-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                collapsed ? "justify-center" : "gap-2 px-3",
              )}
            >
              <ArrowLeftIcon className="size-4 shrink-0" />
              {!collapsed && (
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em]">
                  Back
                </span>
              )}
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex flex-1 flex-col gap-0.5 py-4">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-label={label}
                className={cn(
                  "flex h-10 items-center gap-3 px-3.5 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  activeTab === id
                    ? "bg-secondary/60 text-foreground"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && (
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.1em]">
                    {label}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Collapse toggle — bottom of sidebar */}
          <div className="border-t border-border/60 p-2">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "flex h-9 w-full items-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                collapsed ? "justify-center" : "gap-2 px-3",
              )}
            >
              {collapsed
                ? <PanelLeftOpenIcon className="size-4" />
                : <><PanelLeftCloseIcon className="size-4" /><span className="font-mono text-[0.65rem] uppercase tracking-[0.1em]">Collapse</span></>
              }
            </button>
          </div>
        </aside>

        {/* ── Content area ─────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 py-8 pl-8 pr-0">
          {/* Page title */}
          <div className="mb-8 space-y-1">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Billing
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
              {activeTab === "plans" ? "Buy Credits" : "Usage History"}
            </h1>
          </div>

          {activeTab === "plans"   && <PlansContent />}
          {activeTab === "history" && <HistoryContent />}
        </div>
      </DeskCanvas>
    </div>
  );
}

// ── Plans content ─────────────────────────────────────────────────────────────

function PlansContent() {
  const { data: plansData, isLoading } = usePlans();
  const { data: balanceData }          = useCredits();
  const { mutateAsync: createOrder }   = useCreateOrder();
  const [pending, setPending]          = useState<string | null>(null);

  const currentPlanId = balanceData?.subscription?.planId ?? "FREE";
  const plans = plansData?.plans ?? {};
  const paidPlans = Object.values(plans).filter((p) => p.id !== "FREE");

  async function handleBuy(bundle: PlanBundle, planId: string) {
    const key = `${planId}-${bundle.credits}`;
    setPending(key);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) return;

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
          // Webhook credits the wallet — balance refetches on next poll
        },
        modal: { ondismiss: () => setPending(null) },
      });

      rzp.open();
    } finally {
      setPending(null);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-8">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-4 w-32 rounded-sm" />
            <Skeleton className="h-3 w-64 rounded-sm" />
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-sm" />
              <Skeleton className="h-14 w-full rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-10">
      {paidPlans.map((plan) => (
        <PlanBlock
          key={plan.id}
          plan={plan}
          isCurrent={currentPlanId === plan.id}
          pending={pending}
          onBuy={(bundle) => handleBuy(bundle, plan.id)}
        />
      ))}

      <p className="text-xs text-muted-foreground">
        Credits never expire · All payments secured by Razorpay
      </p>
    </div>
  );
}

type PlanBlockProps = {
  plan: Plan;
  isCurrent: boolean;
  pending: string | null;
  onBuy: (bundle: PlanBundle) => void;
};

function PlanBlock({ plan, isCurrent, pending, onBuy }: PlanBlockProps) {
  const bundles: PlanBundle[] = (plan as { bundles?: PlanBundle[] }).bundles ?? [];

  return (
    <div className="space-y-4">
      {/* Plan header */}
      <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
        <div className="space-y-0.5">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
            {plan.id}
          </p>
          <h2 className="text-base font-semibold text-foreground">{plan.name}</h2>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
        {isCurrent && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-sm border border-border/60 bg-secondary px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
            <CheckIcon className="size-3" /> Current
          </span>
        )}
      </div>

      {plan.integrationsEnabled && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckIcon className="size-3.5 shrink-0 text-ring" />
          Includes integrations (Notion, Eraser and more)
        </p>
      )}

      {/* Bundles */}
      <div className="space-y-2">
        {bundles.map((bundle) => {
          const key = `${plan.id}-${bundle.credits}`;
          const isPending = pending === key;
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4 border border-border/70 bg-secondary/20 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <ZapIcon className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <span className="font-mono text-base font-semibold tabular-nums text-foreground">
                    {bundle.credits.toLocaleString()}
                  </span>
                  <span className="ml-1.5 text-sm text-muted-foreground">credits</span>
                  {bundle.monthly && (
                    <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
                      / month
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onBuy(bundle)}
                disabled={!!pending}
                className={cn(
                  "flex h-10 items-center rounded-sm bg-primary px-5 font-mono text-sm font-medium text-primary-foreground",
                  "transition-opacity hover:opacity-90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "disabled:cursor-wait disabled:opacity-60",
                )}
              >
                {isPending ? "Opening…" : `₹${bundle.priceInr}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── History content ───────────────────────────────────────────────────────────

function HistoryContent() {
  const { data, isLoading } = useLedger(100);
  const entries = data?.ledger ?? [];

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-0 divide-y divide-border/40">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-36 rounded-sm" />
              <Skeleton className="h-2.5 w-24 rounded-sm" />
            </div>
            <Skeleton className="h-3 w-16 rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex max-w-2xl flex-col items-start gap-3 py-12">
        <ReceiptIcon className="size-8 text-muted-foreground/30" />
        <p className="text-sm font-medium text-foreground">No transactions yet</p>
        <p className="text-sm text-muted-foreground">
          Credit usage will appear here after your first chat message, source upload, or artifact generation.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Column headers */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
          Operation
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
          Credits
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/40">
        {entries.map((entry) => (
          <LedgerRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

const OPERATION_LABELS: Record<string, string> = {
  CHAT_MESSAGE:        "Chat message",
  SOURCE_PROCESSING:   "Source indexed",
  ARTIFACT_GENERATION: "Artifact generated",
  CREDIT_PURCHASE:     "Credits purchased",
  SIGNUP_BONUS:        "Welcome bonus",
  REFUND:              "Refund",
};

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const isCredit = entry.credits > 0;

  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm text-foreground">
          {OPERATION_LABELS[entry.operation] ?? entry.operation}
        </p>
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
          {format(new Date(entry.createdAt), "dd MMM yyyy · HH:mm")}
          {entry.model ? ` · ${entry.model}` : ""}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 font-mono text-sm tabular-nums",
          isCredit ? "text-ring font-medium" : "text-muted-foreground",
        )}
      >
        {isCredit ? "+" : ""}
        {entry.credits.toFixed(1)}
      </span>
    </div>
  );
}
