import Razorpay from "razorpay";
import crypto from "crypto";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn(
        "[Razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set — payment features disabled.",
    );
}

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID ?? "",
    key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
});

/**
 * Create a Razorpay order.
 * @param amountInPaise  Amount in paise (1 INR = 100 paise)
 * @param receiptId      Unique receipt identifier (e.g. userId + timestamp)
 * @param notes          Key-value metadata stored on the order (max 15 keys, 256 chars each)
 */
export async function createRazorpayOrder(
    amountInPaise: number,
    receiptId: string,
    notes?: Record<string, string>,
) {
    return razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId.slice(0, 40), // Razorpay caps receipt at 40 chars
        notes,
    });
}

/**
 * Verify the Razorpay webhook signature.
 * Must be called before trusting any webhook payload.
 *
 * @param rawBody  The raw request body bytes — must be captured BEFORE express.json() parses it.
 * @param signature  Value of the `x-razorpay-signature` header.
 */
export function verifyRazorpayWebhookSignature(
    rawBody: Buffer | string,
    signature: string,
): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) return false;

    const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    const expectedBuf = Buffer.from(expected, "hex");
    const signatureBuf = Buffer.from(signature, "hex");

    // timingSafeEqual requires same-length buffers — mismatched length = invalid signature
    if (expectedBuf.length !== signatureBuf.length) return false;

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/**
 * Verify the Razorpay payment signature returned to the client after checkout.
 */
export function verifyRazorpayPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return false;

    const expected = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(expected, "hex"),
        Buffer.from(signature, "hex"),
    );
}
