-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CAPTURED', 'FAILED');

-- CreateTable
CREATE TABLE "payment_order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "credits" DOUBLE PRECISION NOT NULL,
    "amountInr" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "capturedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_order_razorpayOrderId_key" ON "payment_order"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "payment_order_userId_idx" ON "payment_order"("userId");

-- CreateIndex
CREATE INDEX "payment_order_userId_createdAt_idx" ON "payment_order"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
