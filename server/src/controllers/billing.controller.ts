import type { Request, Response } from "express";
import {
    createRazorpayOrder,
    verifyRazorpayPaymentSignature,
    verifyRazorpayWebhookSignature,
} from "../lib/razorpay.js";
import {
    getUserBalance,
    getUserLedger,
    getUserSubscription,
} from "../services/credit.service.js";
import { PLANS } from "../lib/credits/pricing.js";
import { ValidationError } from "../types/app-error.js";
import {
    createPaymentOrder,
    fulfillPaymentOrder,
    getPaymentOrders,
    recordPaymentFailure,
} from "../repository/credit.repository.js";

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

/** GET /api/billing/payments */
export async function getPayments(req: Request, res: Response): Promise<void> {
    const userId = req.session.user.id;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const payments = await getPaymentOrders(userId, limit);
    res.json({ payments });
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

    const order = await createRazorpayOrder(
        priceInr * 100, // INR → paise
        receiptId,
        {
            userId,
            credits: String(credits),
        },
    );

    // Persist as PENDING so we can track it even if the user closes the modal.
    await createPaymentOrder({
        userId,
        razorpayOrderId: order.id,
        credits,
        amountInr: priceInr,
    });

    res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        credits,
    });
}

/**
 * POST /api/billing/verify
 * Instant verification called from the client when Razorpay checkout succeeds.
 * Verifies signature HMAC-SHA256 and atomically fulfills the payment order.
 */
export async function verifyPayment(req: Request, res: Response): Promise<void> {
    const { orderId, paymentId, signature } = req.body as {
        orderId: string;
        paymentId: string;
        signature: string;
    };

    if (!orderId || !paymentId || !signature) {
        throw new ValidationError("orderId, paymentId, and signature are required");
    }

    const isValid = verifyRazorpayPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
        throw new ValidationError("Invalid payment signature");
    }

    const userId = req.session.user.id;
    const result = await fulfillPaymentOrder(userId, orderId, paymentId);

    res.json({
        success: true,
        balance: result.balance,
        alreadyProcessed: result.alreadyProcessed,
    });
}

/**
 * POST /api/billing/failed
 * Called when Razorpay modal encounters a client-side payment error.
 */
export async function reportPaymentFailure(req: Request, res: Response): Promise<void> {
    const { orderId, paymentId, reason } = req.body as {
        orderId: string;
        paymentId?: string;
        reason?: string;
    };

    if (!orderId) {
        throw new ValidationError("orderId is required");
    }

    await recordPaymentFailure(orderId, paymentId, reason);

    res.json({ success: true });
}

/**
 * POST /api/billing/webhook
 * Razorpay sends this after payment.captured or payment.failed.
 *
 * IMPORTANT: This route is registered with express.raw() middleware (see billing.routes.ts)
 * so that req.body is the raw Buffer and signature verification works correctly.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!verifyRazorpayWebhookSignature(req.body as Buffer, signature)) {
        res.status(400).json({ message: "Invalid webhook signature" });
        return;
    }

    const event = JSON.parse((req.body as Buffer).toString("utf-8")) as {
        event: string;
        payload: {
            payment: {
                entity: {
                    id: string;
                    order_id: string;
                    error_description?: string;
                    notes?: { userId?: string; credits?: string };
                };
            };
        };
    };

    const payment = event.payload.payment.entity;
    const userId = payment.notes?.userId;
    const credits = Number(payment.notes?.credits);

    // ── payment.captured → credit the wallet ─────────────────────────────────
    if (event.event === "payment.captured") {
        if (!userId || !credits || credits <= 0) {
            console.error("[Webhook] Missing userId or credits in payment notes", payment.notes);
            res.status(400).json({ message: "Missing userId or credits in payment notes" });
            return;
        }

        await fulfillPaymentOrder(userId, payment.order_id, payment.id, credits).catch((err) =>
            console.error("[Webhook] fulfillPaymentOrder failed:", err),
        );

        res.json({ received: true });
        return;
    }

    // ── payment.failed → log the failure, no credit change ───────────────────
    if (event.event === "payment.failed") {
        await recordPaymentFailure(
            payment.order_id,
            payment.id ?? null,
            payment.error_description ?? "Payment declined",
        ).catch((err) => console.error("[Webhook] recordPaymentFailure failed:", err));

        res.json({ received: true });
        return;
    }

    // All other events — acknowledge without action
    res.json({ received: true });
}

