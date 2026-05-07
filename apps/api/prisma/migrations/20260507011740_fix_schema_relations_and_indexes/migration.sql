/*
  Warnings:

  - You are about to drop the column `appliedBy` on the `Vaccination` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Clinic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Pet` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `sex` on the `Pet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Prescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `appliedById` to the `Vaccination` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Vaccination` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PetSex" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "sex",
ADD COLUMN     "sex" "PetSex" NOT NULL;

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Vaccination" DROP COLUMN "appliedBy",
ADD COLUMN     "appliedById" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "ClinicUser_userId_idx" ON "ClinicUser"("userId");

-- CreateIndex
CREATE INDEX "Consultation_recordId_idx" ON "Consultation"("recordId");

-- CreateIndex
CREATE INDEX "Consultation_clinicId_idx" ON "Consultation"("clinicId");

-- CreateIndex
CREATE INDEX "Consultation_doctorId_idx" ON "Consultation"("doctorId");

-- CreateIndex
CREATE INDEX "Pet_ownerId_idx" ON "Pet"("ownerId");

-- CreateIndex
CREATE INDEX "Prescription_consultationId_idx" ON "Prescription"("consultationId");

-- CreateIndex
CREATE INDEX "Prescription_clinicId_idx" ON "Prescription"("clinicId");

-- CreateIndex
CREATE INDEX "Vaccination_consultationId_idx" ON "Vaccination"("consultationId");

-- CreateIndex
CREATE INDEX "Vaccination_clinicId_idx" ON "Vaccination"("clinicId");

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalNote" ADD CONSTRAINT "MedicalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
