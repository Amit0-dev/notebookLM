import { Router, raw } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import {
    createOrder,
    getBalance,
    getLedger,
    getPayments,
    getPlans,
    handleWebhook,
    reportPaymentFailure,
    verifyPayment,
} from "../controllers/billing.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export const billingRoutes = Router();

// Public — no auth required for plans list
billingRoutes.get("/plans", asyncHandler(getPlans));

// Webhook — Razorpay signs this, no session auth.
// express.raw() captures the body as a Buffer BEFORE express.json() touches it.
// Signature verification (HMAC-SHA256) requires the exact raw bytes Razorpay sent.
billingRoutes.post(
    "/webhook",
    raw({ type: "application/json" }),
    asyncHandler(handleWebhook),
);

// Authenticated billing routes
billingRoutes.use(requireAuth);
billingRoutes.get("/balance", asyncHandler(getBalance));
billingRoutes.get("/ledger", asyncHandler(getLedger));
billingRoutes.get("/payments", asyncHandler(getPayments));
billingRoutes.post("/order", asyncHandler(createOrder));
billingRoutes.post("/verify", asyncHandler(verifyPayment));
billingRoutes.post("/failed", asyncHandler(reportPaymentFailure));

