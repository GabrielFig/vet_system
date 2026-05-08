-- Add isSuperAdmin to User
ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Create ClinicModuleType enum
CREATE TYPE "ClinicModuleType" AS ENUM ('INVENTORY', 'REPORTS');

-- Create ClinicModule table
CREATE TABLE "ClinicModule" (
  "clinicId"  TEXT NOT NULL,
  "module"    "ClinicModuleType" NOT NULL,
  "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClinicModule_pkey" PRIMARY KEY ("clinicId", "module")
);

CREATE INDEX "ClinicModule_clinicId_idx" ON "ClinicModule"("clinicId");

ALTER TABLE "ClinicModule"
  ADD CONSTRAINT "ClinicModule_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Populate modules from existing planType
INSERT INTO "ClinicModule" ("clinicId", "module")
SELECT id, 'INVENTORY'::"ClinicModuleType" FROM "Clinic" WHERE "planType" IN ('PRO', 'ENTERPRISE')
UNION ALL
SELECT id, 'REPORTS'::"ClinicModuleType"   FROM "Clinic" WHERE "planType" IN ('PRO', 'ENTERPRISE');
