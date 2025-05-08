-- CreateTable
CREATE TABLE "ProtectedHealthInfo" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phiType" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtectedHealthInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityScan" (
    "id" TEXT NOT NULL,
    "scanType" TEXT NOT NULL,
    "startedBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "findings" JSONB,

    CONSTRAINT "SecurityScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PHIAccessAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phiToken" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wasAuthorized" BOOLEAN NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "purpose" TEXT,

    CONSTRAINT "PHIAccessAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProtectedHealthInfo_token_key" ON "ProtectedHealthInfo"("token");

-- CreateIndex
CREATE INDEX "ProtectedHealthInfo_userId_idx" ON "ProtectedHealthInfo"("userId");

-- CreateIndex
CREATE INDEX "ProtectedHealthInfo_phiType_idx" ON "ProtectedHealthInfo"("phiType");

-- CreateIndex
CREATE INDEX "SecurityScan_startedBy_idx" ON "SecurityScan"("startedBy");

-- CreateIndex
CREATE INDEX "SecurityScan_startedAt_idx" ON "SecurityScan"("startedAt");

-- CreateIndex
CREATE INDEX "SecurityScan_status_idx" ON "SecurityScan"("status");

-- CreateIndex
CREATE INDEX "PHIAccessAttempt_userId_idx" ON "PHIAccessAttempt"("userId");

-- CreateIndex
CREATE INDEX "PHIAccessAttempt_phiToken_idx" ON "PHIAccessAttempt"("phiToken");

-- CreateIndex
CREATE INDEX "PHIAccessAttempt_timestamp_idx" ON "PHIAccessAttempt"("timestamp");

-- CreateIndex
CREATE INDEX "PHIAccessAttempt_wasAuthorized_idx" ON "PHIAccessAttempt"("wasAuthorized");

-- AddForeignKey
ALTER TABLE "ProtectedHealthInfo" ADD CONSTRAINT "ProtectedHealthInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityScan" ADD CONSTRAINT "SecurityScan_startedBy_fkey" FOREIGN KEY ("startedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PHIAccessAttempt" ADD CONSTRAINT "PHIAccessAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
