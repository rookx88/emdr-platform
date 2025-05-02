-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('INTAKE', 'STANDARD', 'EMDR', 'FOLLOWUP', 'EMERGENCY');

-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "appointmentDuration" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "preferredDays" TEXT[],
ADD COLUMN     "preferredTimes" TEXT[],
ADD COLUMN     "reminderPreference" TEXT,
ADD COLUMN     "sessionFrequency" TEXT;

-- AlterTable
ALTER TABLE "TherapistProfile" ADD COLUMN     "breakTime" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "calendarEmail" TEXT,
ADD COLUMN     "calendarId" TEXT,
ADD COLUMN     "cancelationPolicy" TEXT,
ADD COLUMN     "maxDailyClients" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "newClientBuffer" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "workingHours" JSONB;

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "type" "AppointmentType" NOT NULL DEFAULT 'STANDARD',
    "notes" TEXT,
    "location" TEXT,
    "clientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "isVirtual" BOOLEAN NOT NULL DEFAULT true,
    "videoSessionId" TEXT,
    "videoSessionUrl" TEXT,
    "externalCalendarEventId" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityWindow" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "specificDate" TIMESTAMP(3),
    "isException" BOOLEAN NOT NULL DEFAULT false,
    "exceptionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "Appointment_therapistId_idx" ON "Appointment"("therapistId");

-- CreateIndex
CREATE INDEX "Appointment_startTime_idx" ON "Appointment"("startTime");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "AvailabilityWindow_therapistId_idx" ON "AvailabilityWindow"("therapistId");

-- CreateIndex
CREATE INDEX "AvailabilityWindow_dayOfWeek_idx" ON "AvailabilityWindow"("dayOfWeek");

-- CreateIndex
CREATE INDEX "AvailabilityWindow_specificDate_idx" ON "AvailabilityWindow"("specificDate");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "TherapistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "TherapistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
