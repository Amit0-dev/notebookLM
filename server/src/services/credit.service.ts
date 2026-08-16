import {
    calculateCreditsForUsage,
    type TokenUsage,
} from "../lib/credits/calculate.js";
import {
    CreditOperation,
    SIGNUP_BONUS_CREDITS,
    type PricedModel,
    type CreditOperationType,
} from "../lib/credits/pricing.js";
import {
    creditWallet,
    deductWallet,
    getOrCreateSubscription,
    getOrCreateWallet,
    getWalletBalance,
    getWalletLedger,
    updateSubscriptionPlan,
} from "../repository/credit.repository.js";

/** Return the current balance for a user (creates wallet if missing). */
export async function getUserBalance(userId: string) {
    await getOrCreateWallet(userId);
    return getWalletBalance(userId);
}

/**
 * Award the signup bonus to a new user.
 * Idempotent — if the wallet already has the bonus logged, it's a no-op
 * because better-auth fires the hook only once on user creation.
 */
export async function awardSignupBonus(userId: string) {
    return creditWallet(userId, {
        operation: CreditOperation.SIGNUP_BONUS,
        credits: SIGNUP_BONUS_CREDITS,
        metadata: { reason: "Welcome bonus for new account" },
    });
}

/**
 * Deduct credits for an AI operation based on actual token usage.
 * Calculates credits via pricing engine, logs full breakdown to ledger.
 *
 * @param userId      The user whose wallet is debited
 * @param operation   Which operation type (CHAT_MESSAGE, ARTIFACT_GENERATION, etc.)
 * @param model       The OpenAI model used (must be in MODEL_PRICING)
 * @param usage       Actual prompt + completion token counts from the AI SDK
 * @param metadata    Optional extra context (conversationId, artifactId, sourceId…)
 */
export async function deductForOperation(
    userId: string,
    operation: string,
    model: PricedModel,
    usage: TokenUsage,
    metadata?: Record<string, unknown>,
) {
    const calc = calculateCreditsForUsage(model, usage);

    // If credits rounds to 0 (e.g. tiny embedding), skip the deduction
    if (calc.credits <= 0) return;

    return deductWallet(userId, {
        operation: operation as CreditOperationType,
        credits: calc.credits,
        model,
        promptTokens: usage.promptTokens ?? usage.inputTokens ?? 0,
        completionTokens: usage.completionTokens ?? usage.outputTokens ?? 0,
        rawCostUsd: calc.rawCostUsd,
        chargedCostUsd: calc.chargedCostUsd,
        metadata,
    });
}

/**
 * Fulfill a credit purchase after Razorpay payment is verified.
 * Called from the billing webhook handler.
 */
export async function purchaseCredits(
    userId: string,
    creditsAmount: number,
    razorpayOrderId: string,
    razorpayPaymentId: string,
) {
    return creditWallet(userId, {
        operation: CreditOperation.CREDIT_PURCHASE,
        credits: creditsAmount,
        metadata: { razorpayOrderId, razorpayPaymentId },
    });
}

/** Get the user's subscription (creates FREE tier if missing). */
export async function getUserSubscription(userId: string) {
    return getOrCreateSubscription(userId);
}

/** Upgrade plan after a successful subscription payment. */
export async function upgradePlan(
    userId: string,
    planId: "STARTER" | "PRO",
    razorpayCustomerId?: string,
    razorpaySubId?: string,
    currentPeriodEnd?: Date,
) {
    return updateSubscriptionPlan(userId, {
        planId,
        razorpayCustomerId,
        razorpaySubId,
        currentPeriodEnd,
    });
}

/** Return paginated ledger history for a user. */
export async function getUserLedger(userId: string, limit = 50) {
    return getWalletLedger(userId, limit);
}
