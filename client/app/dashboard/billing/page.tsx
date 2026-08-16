"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ZapIcon,
  ReceiptIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  CheckIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeskCanvas } from "@/components/layout/fixed-column";
import { ShelfLogo } from "@/components/brand/shelf-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePlans,
  useCreateOrder,
  useCredits,
  useLedger,
  usePayments,
  useVerifyPayment,
  useReportPaymentFailure,
} from "@/hooks/use-credits";
import { billingKeys } from "@/lib/api/billing";
import type { Plan, PlanBundle, LedgerEntry, PaymentOrder } from "@/lib/api/billing";
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

// ── Sidebar tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "plans", label: "Plans", Icon: ZapIcon },
  { id: "history", label: "History", Icon: ReceiptIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<TabId>("plans");
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { data: balanceData } = useCredits();

  return (
    <div className="flex min-h-[100svh] flex-col bg-background">
      {/* Top navbar */}
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
          {/* Back button */}
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
          <nav className="flex flex-1 flex-col gap-0.5 py-4 px-2">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex h-10 w-full items-center rounded-sm text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  activeTab === id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                  collapsed ? "justify-center px-0" : "gap-3 px-4",
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
          </nav>

          {/* Collapse / Expand toggle button */}
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
              {collapsed ? (
                <PanelLeftOpenIcon className="size-4 shrink-0" />
              ) : (
                <>
                  <PanelLeftCloseIcon className="size-4 shrink-0" />
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em]">
                    Collapse
                  </span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ── Main content area ────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 py-8 pl-8 pr-0">
          {/* Page title */}
          <div className="mb-8 space-y-1">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Billing
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
              {activeTab === "plans" ? "Buy Credits" : "History & Payments"}
            </h1>
          </div>

          {activeTab === "plans" && <PlansContent />}
          {activeTab === "history" && <HistoryContent />}
        </div>
      </DeskCanvas>
    </div>
  );
}

// ── Plans content ─────────────────────────────────────────────────────────────

function PlansContent() {
  const { data: plansData, isLoading, isError } = usePlans();
  const { data: balanceData } = useCredits();
  const { mutateAsync: createOrder } = useCreateOrder();
  const verifyPaymentMutation = useVerifyPayment();
  const reportFailureMutation = useReportPaymentFailure();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  const currentPlanId = balanceData?.subscription?.planId ?? "FREE";
  const plans = plansData?.plans ?? {};
  const paidPlans = Object.values(plans).filter((p) => p.id !== "FREE");

  async function handleBuy(bundle: PlanBundle, planId: string) {
    const key = `${planId}-${bundle.credits}`;
    setPending(key);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPending(null);
        return;
      }

      const order = await createOrder({
        priceInr: bundle.priceInr,
        credits: bundle.credits,
      });

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "ShelfLM",
        description: bundle.label,
        theme: { color: "#1a1c2e" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPaymentMutation.mutateAsync({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            await queryClient.invalidateQueries({ queryKey: billingKeys.all });
          } catch (err) {
            console.error("Payment verification failed:", err);
          } finally {
            setPending(null);
          }
        },
        modal: {
          ondismiss: () => setPending(null),
        },
      });

      // Track failed attempts
      rzp.on(
        "payment.failed",
        (response: {
          error?: {
            description?: string;
            reason?: string;
            metadata?: { order_id?: string; payment_id?: string };
          };
        }) => {
          reportFailureMutation.mutate({
            orderId: order.orderId,
            paymentId: response?.error?.metadata?.payment_id,
            reason:
              response?.error?.description ||
              response?.error?.reason ||
              "Payment declined",
          });
          setPending(null);
        },
      );

      rzp.open();
    } catch {
      setPending(null);
    }
  }

  if (isLoading) {
    return (
      <div className="grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-5 border border-border/70 p-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 rounded-sm" />
              <Skeleton className="h-5 w-24 rounded-sm" />
              <Skeleton className="h-3 w-48 rounded-sm" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-14 w-full rounded-sm" />
              <Skeleton className="h-14 w-full rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || paidPlans.length === 0) {
    return (
      <div className="flex max-w-sm flex-col gap-3 border border-destructive/20 bg-destructive/5 px-6 py-5">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-destructive">
          Could not load plans
        </p>
        <p className="text-sm text-muted-foreground">
          The server may be offline. Start your backend and refresh the page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="self-start font-mono text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {paidPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isCurrent={currentPlanId === plan.id}
            pending={pending}
            onBuy={(bundle) => handleBuy(bundle, plan.id)}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Credits never expire · Payments secured by Razorpay · 1 credit = ₹0.83
      </p>
    </div>
  );
}

// ── Pricing card ──────────────────────────────────────────────────────────────

type PricingCardProps = {
  plan: Plan;
  isCurrent: boolean;
  pending: string | null;
  onBuy: (bundle: PlanBundle) => void;
};

const PLAN_FEATURES: Record<string, string[]> = {
  STARTER: [
    "Credits never expire",
    "All AI models (GPT-4o)",
    "Unlimited workspaces",
    "Source processing & chat",
  ],
  PRO: [
    "Everything in Starter",
    "Notion integration",
    "Eraser integration",
    "Priority processing",
    "15,000 credits monthly",
  ],
};

function PricingCard({ plan, isCurrent, pending, onBuy }: PricingCardProps) {
  const isPro = plan.id === "PRO";
  const bundles = (plan as { bundles?: PlanBundle[] }).bundles ?? [];
  const features = PLAN_FEATURES[plan.id] ?? [];

  return (
    <div
      className={cn(
        "relative flex flex-col border",
        isPro
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/70 bg-secondary/20 text-foreground",
      )}
    >
      <div
        className={cn(
          "space-y-1 border-b px-6 py-5",
          isPro ? "border-primary-foreground/10" : "border-border/60",
        )}
      >
        <p
          className={cn(
            "font-mono text-[0.65rem] uppercase tracking-[0.14em]",
            isPro ? "text-primary-foreground/60" : "text-muted-foreground",
          )}
        >
          {plan.id}
        </p>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">{plan.name}</h2>
          {isCurrent && (
            <span
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.1em]",
                isPro
                  ? "border-primary-foreground/20 text-primary-foreground/70"
                  : "border-border/60 bg-secondary text-muted-foreground",
              )}
            >
              <CheckIcon className="size-2.5" /> Active
            </span>
          )}
        </div>

        <p
          className={cn(
            "text-sm",
            isPro ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {plan.description}
        </p>
      </div>

      <div
        className={cn(
          "divide-y",
          isPro ? "divide-primary-foreground/10" : "divide-border/50",
        )}
      >
        {bundles.map((bundle) => {
          const key = `${plan.id}-${bundle.credits}`;
          const isPending = pending === key;

          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 px-6 py-4"
            >
              <div>
                <span
                  className={cn(
                    "font-mono text-xl font-bold tabular-nums leading-none",
                    isPro ? "text-primary-foreground" : "text-foreground",
                  )}
                >
                  {bundle.credits.toLocaleString()}
                </span>
                <span
                  className={cn(
                    "ml-1.5 text-sm",
                    isPro ? "text-primary-foreground/60" : "text-muted-foreground",
                  )}
                >
                  {bundle.monthly ? "cr / mo" : "credits"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onBuy(bundle)}
                disabled={!!pending}
                className={cn(
                  "flex h-10 shrink-0 items-center rounded-sm px-4 font-mono text-sm font-semibold",
                  "transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  "disabled:cursor-wait disabled:opacity-50",
                  isPro
                    ? "bg-primary-foreground text-primary focus-visible:ring-primary-foreground focus-visible:ring-offset-primary"
                    : "bg-primary text-primary-foreground focus-visible:ring-ring focus-visible:ring-offset-background",
                )}
              >
                {isPending ? "Opening…" : `₹${bundle.priceInr}`}
              </button>
            </div>
          );
        })}
      </div>

      {features.length > 0 && (
        <div
          className={cn(
            "mt-auto border-t px-6 py-5",
            isPro ? "border-primary-foreground/10" : "border-border/60",
          )}
        >
          <ul className="space-y-2">
            {features.map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-sm">
                <CheckIcon
                  className={cn(
                    "size-3.5 shrink-0",
                    isPro ? "text-primary-foreground/70" : "text-ring",
                  )}
                />
                <span
                  className={
                    isPro
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }
                >
                  {feat}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── History content ───────────────────────────────────────────────────────────

type HistoryView = "usage" | "payments";

function HistoryContent() {
  const [view, setView] = useState<HistoryView>("usage");
  const { data: ledgerData, isLoading: ledgerLoading } = useLedger(100);
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments(100);

  const ledgerEntries = ledgerData?.ledger ?? [];
  const paymentOrders = paymentsData?.payments ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Sub-view toggle */}
      <div className="inline-flex rounded-sm border border-border/60 bg-secondary/30 p-0.5">
        <button
          type="button"
          onClick={() => setView("usage")}
          className={cn(
            "flex items-center gap-2 rounded-sm px-3 py-1.5 font-mono text-xs font-medium transition-colors",
            view === "usage"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ReceiptIcon className="size-3.5" />
          Credit Usage
        </button>
        <button
          type="button"
          onClick={() => setView("payments")}
          className={cn(
            "flex items-center gap-2 rounded-sm px-3 py-1.5 font-mono text-xs font-medium transition-colors",
            view === "payments"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <CreditCardIcon className="size-3.5" />
          Payment Transactions
        </button>
      </div>

      {view === "usage" ? (
        <LedgerSection entries={ledgerEntries} isLoading={ledgerLoading} />
      ) : (
        <PaymentsSection payments={paymentOrders} isLoading={paymentsLoading} />
      )}
    </div>
  );
}

// ── Credit Ledger Table ───────────────────────────────────────────────────────

function LedgerSection({
  entries,
  isLoading,
}: {
  entries: LedgerEntry[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-0 divide-y divide-border/40">
        {Array.from({ length: 6 }).map((_, i) => (
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
      <div className="flex flex-col items-start gap-3 py-12">
        <ReceiptIcon className="size-8 text-muted-foreground/30" />
        <p className="text-sm font-medium text-foreground">No usage records yet</p>
        <p className="text-sm text-muted-foreground">
          Credit deductions will appear here when you send chat messages, process sources, or generate artifacts.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
          Operation
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
          Credits
        </span>
      </div>

      <div className="divide-y divide-border/40">
        {entries.map((entry) => (
          <LedgerRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

const OPERATION_LABELS: Record<string, string> = {
  CHAT_MESSAGE: "Chat message",
  SOURCE_PROCESSING: "Source indexed",
  ARTIFACT_GENERATION: "Artifact generated",
  CREDIT_PURCHASE: "Credits purchased",
  SIGNUP_BONUS: "Welcome bonus",
  REFUND: "Refund",
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
          isCredit ? "font-medium text-ring" : "text-muted-foreground",
        )}
      >
        {isCredit ? "+" : ""}
        {entry.credits.toFixed(1)}
      </span>
    </div>
  );
}

// ── Payment Orders Table ──────────────────────────────────────────────────────

function PaymentsSection({
  payments,
  isLoading,
}: {
  payments: PaymentOrder[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-0 divide-y divide-border/40">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-40 rounded-sm" />
              <Skeleton className="h-2.5 w-28 rounded-sm" />
            </div>
            <Skeleton className="h-4 w-20 rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 py-12">
        <CreditCardIcon className="size-8 text-muted-foreground/30" />
        <p className="text-sm font-medium text-foreground">No payment history</p>
        <p className="text-sm text-muted-foreground">
          When you purchase credits, both successful and failed payment attempts will be recorded here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
          Order & Amount
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
          Status
        </span>
      </div>

      <div className="divide-y divide-border/40">
        {payments.map((payment) => (
          <PaymentOrderRow key={payment.id} payment={payment} />
        ))}
      </div>
    </div>
  );
}

function PaymentOrderRow({ payment }: { payment: PaymentOrder }) {
  const isCaptured = payment.status === "CAPTURED";
  const isFailed = payment.status === "FAILED";
  const isPending = payment.status === "PENDING";

  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            ₹{payment.amountInr}
          </span>
          <span className="text-xs text-muted-foreground">
            ({payment.credits.toLocaleString()} credits)
          </span>
        </div>

        <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
          {format(new Date(payment.createdAt), "dd MMM yyyy · HH:mm")}
          {payment.razorpayPaymentId ? ` · ${payment.razorpayPaymentId}` : ""}
        </p>

        {isFailed && payment.failureReason && (
          <p className="font-mono text-[0.65rem] text-destructive">
            Reason: {payment.failureReason}
          </p>
        )}
      </div>

      <div className="shrink-0">
        {isCaptured && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-ring/30 bg-ring/10 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-ring">
            <CheckIcon className="size-3" />
            Success
          </span>
        )}
        {isFailed && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-destructive/30 bg-destructive/10 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-destructive">
            <XCircleIcon className="size-3" />
            Failed
          </span>
        )}
        {isPending && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-border/70 bg-secondary/50 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
            <ClockIcon className="size-3" />
            Pending
          </span>
        )}
      </div>
    </div>
  );
}

