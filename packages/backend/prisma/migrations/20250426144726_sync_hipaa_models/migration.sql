/*
  Warnings:

  - You are about to drop the column `clientId` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the `Assessment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BusinessAssociateAgreement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClientProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DataAccessLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmdrSessionSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SecurityConfiguration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SessionParticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TherapistProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TreatmentPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "ClientProfile" DROP CONSTRAINT "ClientProfile_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "ClientProfile" DROP CONSTRAINT "ClientProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_uploaderId_fkey";

-- DropForeignKey
ALTER TABLE "EmdrSessionSettings" DROP CONSTRAINT "EmdrSessionSettings_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "SessionParticipant" DROP CONSTRAINT "SessionParticipant_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "SessionParticipant" DROP CONSTRAINT "SessionParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "TherapistProfile" DROP CONSTRAINT "TherapistProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "TreatmentPlan" DROP CONSTRAINT "TreatmentPlan_clientId_fkey";

-- DropIndex
DROP INDEX "Note_clientId_idx";

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "clientId",
DROP COLUMN "isPrivate";

-- DropTable
DROP TABLE "Assessment";

-- DropTable
DROP TABLE "BusinessAssociateAgreement";

-- DropTable
DROP TABLE "ClientProfile";

-- DropTable
DROP TABLE "DataAccessLog";

-- DropTable
DROP TABLE "Document";

-- DropTable
DROP TABLE "EmdrSessionSettings";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "SecurityConfiguration";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "SessionParticipant";

-- DropTable
DROP TABLE "TherapistProfile";

-- DropTable
DROP TABLE "TreatmentPlan";

-- DropEnum
DROP TYPE "AssessmentType";

-- DropEnum
DROP TYPE "BilateralType";

-- DropEnum
DROP TYPE "Direction";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "SessionRole";

-- DropEnum
DROP TYPE "SessionStatus";

-- DropEnum
DROP TYPE "SessionType";

-- DropEnum
DROP TYPE "TreatmentStatus";

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
