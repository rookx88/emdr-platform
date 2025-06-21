-- CreateTable
CREATE TABLE "InsuranceVerification" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "verifiedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "deductibleRemaining" INTEGER,
    "copay" INTEGER,
    "coinsurance" INTEGER,
    "allowedVisits" INTEGER,
    "telehealthCovered" BOOLEAN,
    "preAuthRequired" BOOLEAN,
    "rawResponse" JSONB,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InsuranceVerification_clientId_idx" ON "InsuranceVerification"("clientId");

-- CreateIndex
CREATE INDEX "InsuranceVerification_verifiedBy_idx" ON "InsuranceVerification"("verifiedBy");

-- CreateIndex
CREATE INDEX "InsuranceVerification_createdAt_idx" ON "InsuranceVerification"("createdAt");

-- AddForeignKey
ALTER TABLE "InsuranceVerification" ADD CONSTRAINT "InsuranceVerification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceVerification" ADD CONSTRAINT "InsuranceVerification_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
