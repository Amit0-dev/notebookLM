import prisma from "../lib/db.js";
import type { CreditOperationType } from "../lib/credits/pricing.js";
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
