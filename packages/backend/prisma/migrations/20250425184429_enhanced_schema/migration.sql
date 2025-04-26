/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ClientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `preferredContactMethod` on the `ClientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ClientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `EmdrSessionSettings` table. All the data in the column will be lost.
  - You are about to drop the column `hapticEnabled` on the `EmdrSessionSettings` table. All the data in the column will be lost.
  - You are about to drop the column `movementWidth` on the `EmdrSessionSettings` table. All the data in the column will be lost.
  - You are about to drop the column `soundEnabled` on the `EmdrSessionSettings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `EmdrSessionSettings` table. All the data in the column will be lost.
  - You are about to drop the column `visualType` on the `EmdrSessionSettings` table. All the data in the column will be lost.
  - You are about to drop the column `isEncrypted` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `noteType` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `actualEnd` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `actualStart` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledEnd` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledStart` on the `Session` table. All the data in the column will be lost.
  - The `status` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sessionType` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `availableHours` on the `TherapistProfile` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TherapistProfile` table. All the data in the column will be lost.
  - You are about to drop the column `professionalId` on the `TherapistProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TherapistProfile` table. All the data in the column will be lost.
  - You are about to drop the `ClientTherapist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Recording` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SessionParticipant` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `scheduledAt` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'CANCELED', 'STARTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('STANDARD', 'EMDR', 'ASSESSMENT', 'INTAKE');

-- CreateEnum
CREATE TYPE "SessionRole" AS ENUM ('HOST', 'PARTICIPANT', 'OBSERVER');

-- CreateEnum
CREATE TYPE "BilateralType" AS ENUM ('VISUAL', 'AUDIO', 'HAPTIC');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('HORIZONTAL', 'VERTICAL', 'DIAGONAL');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('SUDS', 'VOC', 'INITIAL_ASSESSMENT', 'PROGRESS_ASSESSMENT', 'DISCHARGE_ASSESSMENT');

-- CreateEnum
CREATE TYPE "TreatmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT', 'REMINDER', 'SYSTEM', 'MESSAGE');

-- DropForeignKey
ALTER TABLE "ClientTherapist" DROP CONSTRAINT "ClientTherapist_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ClientTherapist" DROP CONSTRAINT "ClientTherapist_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Recording" DROP CONSTRAINT "Recording_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "_SessionParticipant" DROP CONSTRAINT "_SessionParticipant_A_fkey";

-- DropForeignKey
ALTER TABLE "_SessionParticipant" DROP CONSTRAINT "_SessionParticipant_B_fkey";

-- DropIndex
DROP INDEX "Note_subjectId_idx";

-- DropIndex
DROP INDEX "TherapistProfile_professionalId_key";

-- AlterTable
ALTER TABLE "ClientProfile" DROP COLUMN "createdAt",
DROP COLUMN "preferredContactMethod",
DROP COLUMN "updatedAt",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "consentFormSigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "insuranceInfo" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "therapistId" TEXT;

-- AlterTable
ALTER TABLE "EmdrSessionSettings" DROP COLUMN "createdAt",
DROP COLUMN "hapticEnabled",
DROP COLUMN "movementWidth",
DROP COLUMN "soundEnabled",
DROP COLUMN "updatedAt",
DROP COLUMN "visualType",
ADD COLUMN     "bilateralType" "BilateralType" NOT NULL DEFAULT 'VISUAL',
ADD COLUMN     "direction" "Direction" NOT NULL DEFAULT 'HORIZONTAL',
ALTER COLUMN "speed" SET DEFAULT 20;

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "isEncrypted",
DROP COLUMN "noteType",
DROP COLUMN "subjectId",
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "actualEnd",
DROP COLUMN "actualStart",
DROP COLUMN "creatorId",
DROP COLUMN "scheduledEnd",
DROP COLUMN "scheduledStart",
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "title" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
DROP COLUMN "sessionType",
ADD COLUMN     "sessionType" "SessionType" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "TherapistProfile" DROP COLUMN "availableHours",
DROP COLUMN "createdAt",
DROP COLUMN "professionalId",
DROP COLUMN "updatedAt",
ADD COLUMN     "availability" JSONB,
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "licenseState" TEXT;

-- DropTable
DROP TABLE "ClientTherapist";

-- DropTable
DROP TABLE "Recording";

-- DropTable
DROP TABLE "_SessionParticipant";

-- CreateTable
CREATE TABLE "SessionParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SessionRole" NOT NULL DEFAULT 'PARTICIPANT',
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "data" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentPlan" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "goals" JSONB[],
    "interventions" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetEndDate" TIMESTAMP(3),
    "status" "TreatmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaderId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionParticipant_sessionId_idx" ON "SessionParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "SessionParticipant_userId_idx" ON "SessionParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionParticipant_sessionId_userId_key" ON "SessionParticipant"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "Assessment_clientId_idx" ON "Assessment"("clientId");

-- CreateIndex
CREATE INDEX "Assessment_sessionId_idx" ON "Assessment"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentPlan_clientId_key" ON "TreatmentPlan"("clientId");

-- CreateIndex
CREATE INDEX "TreatmentPlan_clientId_idx" ON "TreatmentPlan"("clientId");

-- CreateIndex
CREATE INDEX "Document_uploaderId_idx" ON "Document"("uploaderId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "ClientProfile_therapistId_idx" ON "ClientProfile"("therapistId");

-- CreateIndex
CREATE INDEX "EmdrSessionSettings_sessionId_idx" ON "EmdrSessionSettings"("sessionId");

-- CreateIndex
CREATE INDEX "Note_clientId_idx" ON "Note"("clientId");

-- CreateIndex
CREATE INDEX "TherapistProfile_licenseNumber_idx" ON "TherapistProfile"("licenseNumber");

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "TherapistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
