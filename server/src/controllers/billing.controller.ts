import type { Request, Response } from "express";
import { createRazorpayOrder, verifyRazorpayWebhookSignature } from "../lib/razorpay.js";
import {
    getUserBalance,
    getUserLedger,
    getUserSubscription,
    purchaseCredits,
} from "../services/credit.service.js";
import { PLANS } from "../lib/credits/pricing.js";
import { ValidationError } from "../types/app-error.js";

/** GET /api/billing/balance */
export async function getBalance(req: Request, res: Response): Promise<void> {
    const userId = req.session.user.id;
    const [balance, subscription] = await Promise.all([
        getUserBalance(userId),
        getUserSubscription(userId),
    ]);
    res.json({ balance, subscription });
}

/** GET /api/billing/ledger */
export async function getLedger(req: Request, res: Response): Promise<void> {
    const userId = req.session.user.id;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const ledger = await getUserLedger(userId, limit);
    res.json({ ledger });
}

/** GET /api/billing/plans */
export async function getPlans(_req: Request, res: Response): Promise<void> {
    res.json({ plans: PLANS });
}

/** POST /api/billing/order */
export async function createOrder(req: Request, res: Response): Promise<void> {
    const { priceInr, credits } = req.body as { priceInr: number; credits: number };

    if (!priceInr || !credits || priceInr <= 0 || credits <= 0) {
        throw new ValidationError("priceInr and credits are required and must be positive");
    }

    const userId = req.session.user.id;
    const receiptId = `${userId.slice(0, 20)}_${Date.now()}`;

    // BUG FIX: Store userId and credits as notes on the Razorpay order.
    // The webhook uses these to identify which user to credit and how many credits to add.
    const order = await createRazorpayOrder(
        priceInr * 100, // INR → paise
        receiptId,
        {
            userId,
            credits: String(credits),
        },
    );

    res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        credits,
    });
}

/**
 * POST /api/billing/webhook
 * Razorpay sends this after a successful payment.
 *
 * IMPORTANT: This route is registered with express.raw() middleware (see billing.routes.ts)
 * so that req.body is the raw Buffer and signature verification works correctly.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers["x-razorpay-signature"] as string;

    // BUG FIX: Use req.body directly (it's a Buffer from express.raw middleware).
    // Never use JSON.stringify here — it produces different bytes from Razorpay's raw signature input.
    if (!verifyRazorpayWebhookSignature(req.body as Buffer, signature)) {
        res.status(400).json({ message: "Invalid webhook signature" });
        return;
    }

    // Parse the body now that signature is verified
    const event = JSON.parse((req.body as Buffer).toString("utf-8")) as {
        event: string;
        payload: {
            payment: {
                entity: {
                    id: string;
                    order_id: string;
                    notes?: { userId?: string; credits?: string };
                };
            };
        };
    };

    if (event.event !== "payment.captured") {
        res.json({ received: true });
        return;
    }

    const payment = event.payload.payment.entity;
    const userId = payment.notes?.userId;
    const credits = Number(payment.notes?.credits);

    if (!userId || !credits || credits <= 0) {
        console.error("[Webhook] Missing userId or credits in payment notes", payment.notes);
        res.status(400).json({ message: "Missing userId or credits in payment notes" });
        return;
    }

    await purchaseCredits(userId, credits, payment.order_id, payment.id);

    res.json({ received: true });
}
