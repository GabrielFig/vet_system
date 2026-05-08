-- CreateTable Client
CREATE TABLE "Client" (
    "id"        TEXT NOT NULL,
    "clinicId"  TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName"  TEXT NOT NULL,
    "phone"     TEXT,
    "email"     TEXT,
    "notes"     TEXT,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Client_clinicId_idx" ON "Client"("clinicId");
CREATE INDEX "Client_clinicId_lastName_idx" ON "Client"("clinicId", "lastName");

-- Add clientId to Pet (nullable first so we can migrate existing rows)
ALTER TABLE "Pet" ADD COLUMN "clientId" TEXT;

-- Migrate existing pets: create a Client record from the User (owner)
-- and point the pet to that client. We use the first clinic of the owner
-- as the clinicId for the client.
INSERT INTO "Client" ("id", "clinicId", "firstName", "lastName", "phone", "email", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    COALESCE(
        (SELECT cu."clinicId" FROM "ClinicUser" cu WHERE cu."userId" = u."id" LIMIT 1),
        '00000000-0000-0000-0000-000000000000'
    ),
    u."firstName",
    u."lastName",
    u."phone",
    u."email",
    NOW(),
    NOW()
FROM "User" u
WHERE u."id" IN (SELECT DISTINCT "ownerId" FROM "Pet");

-- Point each pet to its newly created client
UPDATE "Pet" p
SET "clientId" = c."id"
FROM "Client" c
JOIN "User" u ON u."firstName" = c."firstName" AND u."lastName" = c."lastName" AND u."email" = c."email"
WHERE p."ownerId" = u."id";

-- Make clientId required
ALTER TABLE "Pet" ALTER COLUMN "clientId" SET NOT NULL;

-- Add FK constraint
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Pet_clientId_idx" ON "Pet"("clientId");

-- Drop old ownerId FK and column
ALTER TABLE "Pet" DROP CONSTRAINT IF EXISTS "Pet_ownerId_fkey";
DROP INDEX IF EXISTS "Pet_ownerId_idx";
ALTER TABLE "Pet" DROP COLUMN "ownerId";

-- Remove OWNER from Role enum (rename enum, remove value, rename back)
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR');
ALTER TABLE "ClinicUser" ALTER COLUMN "role" TYPE "Role" USING (
    CASE "role"::text
        WHEN 'OWNER' THEN 'ADMIN'
        ELSE "role"::text
    END
)::"Role";
DROP TYPE "Role_old";
