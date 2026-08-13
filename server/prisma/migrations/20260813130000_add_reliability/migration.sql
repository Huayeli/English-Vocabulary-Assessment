-- AlterTable
ALTER TABLE "TestSession" ADD COLUMN "reliability" INTEGER;
ALTER TABLE "TestSession" ADD COLUMN "suspicious" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TestSession" ADD COLUMN "invalid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TestSession" ADD COLUMN "flags" TEXT;
ALTER TABLE "TestSession" ADD COLUMN "abandoned" BOOLEAN NOT NULL DEFAULT false;
