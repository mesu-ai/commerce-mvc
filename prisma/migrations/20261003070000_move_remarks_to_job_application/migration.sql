-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN "remarks" TEXT;

-- Carry existing test remarks over to their application before dropping them
-- (several remarks on one application are joined in test order)
UPDATE "job_applications" AS ja
SET "remarks" = t."remarks"
FROM (
  SELECT "applicationId", string_agg("remarks", '; ' ORDER BY "testType") AS "remarks"
  FROM "job_application_tests"
  WHERE "remarks" IS NOT NULL AND "remarks" <> ''
  GROUP BY "applicationId"
) AS t
WHERE ja."applicationId" = t."applicationId";

-- AlterTable
ALTER TABLE "job_application_tests" DROP COLUMN "remarks";
