import prisma from "../lib/db.js";
import { CreditOperation, type CreditOperationType } from "../lib/credits/pricing.js";
import { InsufficientCreditsError } from "../types/app-error.js";

export type LedgerEntryInput = {
    operation: CreditOperationType;
    credits: number; // positive = credit, negative = debit
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    rawCostUsd?: number;
    chargedCostUsd?: number;
    metadata?: Record<string, unknown>;
};

/**
 * Get (or lazily create) the credit wallet for a user.
 * Safe to call multiple times — uses upsert under the hood.
 */
export async function getOrCreateWallet(userId: string) {
    return prisma.creditWallet.upsert({
        where: { userId },
        update: {},
        create: { userId, balance: 0 },
    });
}

/** Return the current credit balance for a user. */
export async function getWalletBalance(userId: string): Promise<number> {
    const wallet = await getOrCreateWallet(userId);
    return wallet.balance;
}

/**
 * Credit (add) credits to a user's wallet atomically.
 * Used for signup bonus and payment fulfillment.
 */
export async function creditWallet(
    userId: string,
    entry: LedgerEntryInput,
): Promise<{ balance: number }> {
    if (entry.credits <= 0) {
        throw new Error("creditWallet requires a positive credit amount");
    }

    const result = await prisma.$transaction(async (tx) => {
        const wallet = await tx.creditWallet.upsert({
            where: { userId },
            update: { balance: { increment: entry.credits } },
            create: { userId, balance: entry.credits },
        });

        await tx.creditLedger.create({
            data: {
                userId,
                walletId: wallet.id,
                operation: entry.operation,
                credits: entry.credits,
                balanceAfter: wallet.balance,
                model: entry.model ?? null,
                promptTokens: entry.promptTokens ?? 0,
                completionTokens: entry.completionTokens ?? 0,
                rawCostUsd: entry.rawCostUsd ?? 0,
                chargedCostUsd: entry.chargedCostUsd ?? 0,
                metadata: entry.metadata as never ?? null,
            },
        });

        return { balance: wallet.balance };
    });

    return result;
}

/**
 * Deduct (subtract) credits from a user's wallet atomically.
 * Throws InsufficientCreditsError if balance would go below 0.
 */
export async function deductWallet(
    userId: string,
    entry: LedgerEntryInput,
): Promise<{ balance: number }> {
    if (entry.credits <= 0) {
        throw new Error("deductWallet requires a positive deduction amount");
    }

    const result = await prisma.$transaction(async (tx) => {
        // SELECT FOR UPDATE locks the wallet row for the duration of this transaction.
        // This prevents two concurrent requests from both reading the same balance
        // and both passing the check (classic double-spend race condition).
        const rows = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
            SELECT id, balance FROM credit_wallet WHERE "userId" = ${userId} FOR UPDATE
        `;

        const wallet = rows[0];

        if (!wallet || wallet.balance < entry.credits) {
            throw new InsufficientCreditsError();
        }

        const newBalance = wallet.balance - entry.credits;

        await tx.creditWallet.update({
            where: { userId },
            data: { balance: newBalance },
        });

        await tx.creditLedger.create({
            data: {
                userId,
                walletId: wallet.id,
                operation: entry.operation,
                credits: -entry.credits, // stored as negative for debits
                balanceAfter: newBalance,
                model: entry.model ?? null,
                promptTokens: entry.promptTokens ?? 0,
                completionTokens: entry.completionTokens ?? 0,
                rawCostUsd: entry.rawCostUsd ?? 0,
                chargedCostUsd: entry.chargedCostUsd ?? 0,
                metadata: entry.metadata as never ?? null,
            },
        });

        return { balance: newBalance };
    });

    return result;
}

/** Fetch paginated ledger history for a user (newest first). */
export async function getWalletLedger(userId: string, limit = 50) {
    return prisma.creditLedger.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

/** Get or lazily create a subscription record for a user. */
export async function getOrCreateSubscription(userId: string) {
    return prisma.subscription.upsert({
        where: { userId },
        update: {},
        create: { userId, planId: "FREE" },
    });
}

/** Upgrade a user's subscription plan. */
export async function updateSubscriptionPlan(
    userId: string,
    data: {
        planId: "FREE" | "STARTER" | "PRO";
        razorpayCustomerId?: string;
        razorpaySubId?: string;
        currentPeriodEnd?: Date;
    },
) {
    return prisma.subscription.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data },
    });
}

// ── PaymentOrder ──────────────────────────────────────────────────────────────

/** Create a PENDING payment order record when the Razorpay order is created. */
export async function createPaymentOrder(data: {
    userId: string;
    razorpayOrderId: string;
    credits: number;
    amountInr: number;
}) {
    return prisma.paymentOrder.upsert({
        where: { razorpayOrderId: data.razorpayOrderId },
        update: {}, // idempotent — don't overwrite if already exists
        create: {
            userId: data.userId,
            razorpayOrderId: data.razorpayOrderId,
            credits: data.credits,
            amountInr: data.amountInr,
            status: "PENDING",
        },
    });
}

/**
 * Atomically fulfill a payment order and credit wallet.
 * Strictly idempotent: if already CAPTURED, does not re-credit.
 */
export async function fulfillPaymentOrder(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    creditsAmount?: number,
) {
    return prisma.$transaction(async (tx) => {
        const order = await tx.paymentOrder.findUnique({
            where: { razorpayOrderId },
        });

        if (order && order.status === "CAPTURED") {
            const wallet = await tx.creditWallet.findUnique({ where: { userId } });
            return { balance: wallet?.balance ?? 0, alreadyProcessed: true };
        }

        const credits = creditsAmount ?? order?.credits ?? 0;
        if (credits <= 0) {
            throw new Error("Invalid credits amount for payment fulfillment");
        }

        if (order) {
            await tx.paymentOrder.update({
                where: { razorpayOrderId },
                data: {
                    status: "CAPTURED",
                    razorpayPaymentId,
                    capturedAt: new Date(),
                },
            });
        }

        const wallet = await tx.creditWallet.upsert({
            where: { userId },
            update: { balance: { increment: credits } },
            create: { userId, balance: credits },
        });

        await tx.creditLedger.create({
            data: {
                userId,
                walletId: wallet.id,
                operation: CreditOperation.CREDIT_PURCHASE,
                credits,
                balanceAfter: wallet.balance,
                promptTokens: 0,
                completionTokens: 0,
                rawCostUsd: 0,
                chargedCostUsd: 0,
                metadata: { razorpayOrderId, razorpayPaymentId },
            },
        });

        return { balance: wallet.balance, alreadyProcessed: false };
    });
}

/** Mark a payment order as FAILED with optional error description. */
export async function recordPaymentFailure(
    razorpayOrderId: string,
    razorpayPaymentId?: string | null,
    reason?: string,
) {
    const order = await prisma.paymentOrder.findUnique({
        where: { razorpayOrderId },
    });

    if (!order) return null;
    if (order.status === "CAPTURED") {
        return order; // Don't overwrite captured order
    }

    return prisma.paymentOrder.update({
        where: { razorpayOrderId },
        data: {
            status: "FAILED",
            razorpayPaymentId: razorpayPaymentId ?? order.razorpayPaymentId,
            failureReason: reason ?? "Payment failed",
            failedAt: new Date(),
        },
    });
}

/** Get payment order history for a user (newest first). */
export async function getPaymentOrders(userId: string, limit = 50) {
    return prisma.paymentOrder.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

