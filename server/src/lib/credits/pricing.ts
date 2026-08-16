/**
 * Central pricing config for the credit system.
 *
 * 1 credit = $0.01 USD (retail price paid by user)
 * All AI operations are charged at 5× the raw OpenAI cost.
 *
 * UPDATE these constants if OpenAI changes its pricing.
 */

export const MODEL_PRICING = {
    "gpt-4o": {
        /** USD per input token */
        input: 2.50 / 1_000_000,
        /** USD per output token */
        output: 10.00 / 1_000_000,
    },
    "gpt-4o-mini": {
        input: 0.15 / 1_000_000,
        output: 0.60 / 1_000_000,
    },
    "text-embedding-3-small": {
        input: 0.02 / 1_000_000,
        output: 0, // embeddings have no output tokens
    },
} as const;

export type PricedModel = keyof typeof MODEL_PRICING;

/** Revenue margin multiplier applied on top of raw OpenAI cost. */
export const MARGIN_MULTIPLIER = 5;

/** Retail price of one credit in USD. */
export const USD_PER_CREDIT = 0.01;

/**
 * Free credits awarded to every new user on signup.
 * 500 credits ≈ $5 worth ≈ ~80-100 average chat messages with gpt-4o.
 */
export const SIGNUP_BONUS_CREDITS = 500;

/** Operation type identifiers used in CreditLedger rows. */
export const CreditOperation = {
    CHAT_MESSAGE: "CHAT_MESSAGE",
    SOURCE_PROCESSING: "SOURCE_PROCESSING",
    ARTIFACT_GENERATION: "ARTIFACT_GENERATION",
    CREDIT_PURCHASE: "CREDIT_PURCHASE",
    SIGNUP_BONUS: "SIGNUP_BONUS",
    REFUND: "REFUND",
    PAYMENT_FAILED: "PAYMENT_FAILED",
} as const;

export type CreditOperationType = typeof CreditOperation[keyof typeof CreditOperation];

/**
 * Plan definitions used by the billing API.
 * Prices are in INR paise (Razorpay unit: 1 INR = 100 paise).
 */
export const PLANS = {
    FREE: {
        id: "FREE",
        name: "Free",
        description: "Get started with 500 free credits",
        credits: 0,
        priceInr: 0,
        integrationsEnabled: false,
    },
    STARTER: {
        id: "STARTER",
        name: "Starter",
        description: "Buy credits — no subscription needed",
        bundles: [
            { credits: 2500, priceInr: 199, label: "2,500 credits" },
            { credits: 7000, priceInr: 499, label: "7,000 credits" },
        ],
        integrationsEnabled: false,
    },
    PRO: {
        id: "PRO",
        name: "Pro",
        description: "More credits + integrations (Notion, Eraser, and more)",
        bundles: [
            { credits: 15000, priceInr: 999, label: "15,000 credits/mo", monthly: true },
        ],
        integrationsEnabled: true,
    },
} as const;
