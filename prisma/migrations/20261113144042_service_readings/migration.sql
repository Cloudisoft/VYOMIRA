-- CreateTable
CREATE TABLE "ServiceReading" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "encryptedInput" TEXT NOT NULL,
    "draw" JSONB,
    "result" JSONB,
    "language" TEXT NOT NULL DEFAULT 'en',
    "generator" TEXT,
    "error" TEXT,
    "paymentId" TEXT,
    "creditId" TEXT,
    "paidAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalmImage" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "quality" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PalmImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceReading_userId_category_createdAt_idx" ON "ServiceReading"("userId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceReading_status_idx" ON "ServiceReading"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PalmImage_readingId_side_key" ON "PalmImage"("readingId", "side");

-- AddForeignKey
ALTER TABLE "ServiceReading" ADD CONSTRAINT "ServiceReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceReading" ADD CONSTRAINT "ServiceReading_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalmImage" ADD CONSTRAINT "PalmImage_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "ServiceReading"("id") ON DELETE CASCADE ON UPDATE CASCADE;
