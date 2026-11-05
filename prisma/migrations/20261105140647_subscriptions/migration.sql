-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "amountMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mandateRef" TEXT,
ADD COLUMN     "nextChargeAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SubscriptionCharge" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "txnid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "preDebitAt" TIMESTAMP(3),
    "attemptedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCharge_txnid_key" ON "SubscriptionCharge"("txnid");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCharge_subscriptionId_periodStart_key" ON "SubscriptionCharge"("subscriptionId", "periodStart");

-- CreateIndex
CREATE INDEX "Subscription_status_nextChargeAt_idx" ON "Subscription"("status", "nextChargeAt");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- AddForeignKey
ALTER TABLE "SubscriptionCharge" ADD CONSTRAINT "SubscriptionCharge_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
