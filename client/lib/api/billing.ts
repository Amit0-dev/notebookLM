import { api } from "@/lib/api/client";

// ── Types ──────────────────────────────────────────────────────────────────

export type Subscription = {
  planId: "FREE" | "STARTER" | "PRO";
  razorpayCustomerId: string | null;
  currentPeriodEnd: string | null;
};

export type BalanceResponse = {
  balance: number;
  subscription: Subscription;
};

export type LedgerEntry = {
  id: string;
  operation: string;
  credits: number;
  balanceAfter: number;
  model: string | null;
  promptTokens: number;
  completionTokens: number;
  rawCostUsd: number;
  chargedCostUsd: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type LedgerResponse = {
  ledger: LedgerEntry[];
};

export type PlanBundle = {
  credits: number;
  priceInr: number;
  label: string;
  monthly?: boolean;
};

export type Plan = {
  id: string;
  name: string;
  description: string;
  integrationsEnabled: boolean;
  credits?: number;
  priceInr?: number;
  bundles?: PlanBundle[];
};

export type PlansResponse = {
  plans: Record<string, Plan>;
};

export type CreateOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  credits: number;
};

// ── Query keys ──────────────────────────────────────────────────────────────

export const billingKeys = {
  all: ["billing"] as const,
  balance: () => [...billingKeys.all, "balance"] as const,
  ledger: (limit?: number) => [...billingKeys.all, "ledger", limit] as const,
  plans: () => [...billingKeys.all, "plans"] as const,
};

// ── API functions ────────────────────────────────────────────────────────────

export async function getBalance(): Promise<BalanceResponse> {
  return api<BalanceResponse>("/api/billing/balance");
}

export async function getLedger(limit = 50): Promise<LedgerResponse> {
  return api<LedgerResponse>(`/api/billing/ledger?limit=${limit}`);
}

export async function getPlans(): Promise<PlansResponse> {
  return api<PlansResponse>("/api/billing/plans");
}

export async function createOrder(
  priceInr: number,
  credits: number,
): Promise<CreateOrderResponse> {
  return api<CreateOrderResponse>("/api/billing/order", {
    method: "POST",
    body: { priceInr, credits },
  });
}
