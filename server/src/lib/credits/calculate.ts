import {
    MARGIN_MULTIPLIER,
    MODEL_PRICING,
    type PricedModel,
    USD_PER_CREDIT,
} from "./pricing.js";

export type TokenUsage = {
    promptTokens?: number;
    completionTokens?: number;
    /** Some AI SDK versions use inputTokens/outputTokens */
    inputTokens?: number;
    outputTokens?: number;
};

export type CreditCalculation = {
    rawCostUsd: number;
    chargedCostUsd: number;
    /** Always rounded UP to the nearest 0.1 credit — never down. */
    credits: number;
};

/**
 * Convert real OpenAI token usage into credits charged to the user.
 *
 * Rounding rule: always ceil to nearest 0.1 credit so margin is never
 * eroded by truncation at scale.
 */
export function calculateCreditsForUsage(
    model: PricedModel,
    usage: TokenUsage,
): CreditCalculation {
    const pricing = MODEL_PRICING[model];
    const prompt = usage.promptTokens ?? usage.inputTokens ?? 0;
    const completion = usage.completionTokens ?? usage.outputTokens ?? 0;
    const rawCostUsd =
        prompt * pricing.input +
        completion * pricing.output;

    const chargedCostUsd = rawCostUsd * MARGIN_MULTIPLIER;

    // ceil to nearest 0.1 → never round down
    const credits =
        Math.ceil((chargedCostUsd / USD_PER_CREDIT) * 10) / 10;

    return { rawCostUsd, chargedCostUsd, credits };
}

/**
 * Rough pre-flight estimate to gate expensive operations before calling OpenAI.
 * Uses only input tokens since output is unknown ahead of time — adds 20% buffer.
 */
export function estimateCreditsForTokens(
    model: PricedModel,
    estimatedTokens: number,
): number {
    const pricing = MODEL_PRICING[model];
    const rawCostUsd = estimatedTokens * pricing.input * 1.2; // 20% buffer
    const chargedCostUsd = rawCostUsd * MARGIN_MULTIPLIER;
    return Math.ceil((chargedCostUsd / USD_PER_CREDIT) * 10) / 10;
}
