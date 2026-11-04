-- DropForeignKey
ALTER TABLE "applicants" DROP CONSTRAINT "applicants_universityId_fkey";

-- DropIndex
DROP INDEX "applicants_universityId_idx";

-- Rename rather than drop so existing applicants keep their university
ALTER TABLE "applicants" RENAME COLUMN "universityId" TO "bachelorUniversityId";

-- AlterTable
ALTER TABLE "applicants" ADD COLUMN "masterUniversityId" INTEGER;

-- CreateIndex
CREATE INDEX "applicants_bachelorUniversityId_idx" ON "applicants"("bachelorUniversityId");

-- CreateIndex
CREATE INDEX "applicants_masterUniversityId_idx" ON "applicants"("masterUniversityId");

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_bachelorUniversityId_fkey" FOREIGN KEY ("bachelorUniversityId") REFERENCES "universities"("universityId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_masterUniversityId_fkey" FOREIGN KEY ("masterUniversityId") REFERENCES "universities"("universityId") ON DELETE SET NULL ON UPDATE CASCADE;

-- Keep saved column settings in step with src/data/column.ts
UPDATE "column_settings"
SET "value" = 'bachelorUniversityName', "label" = 'Bachelor University'
WHERE "value" = 'universityName';
