-- AlterTable
-- Test status starts as NULL (not evaluated) instead of 'pending'
ALTER TABLE "job_application_tests" ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" DROP NOT NULL;

UPDATE "job_application_tests" SET "status" = NULL WHERE "status" = 'pending';

-- AlterEnum
-- Postgres can't drop an enum value, so the type is recreated without 'pending'
CREATE TYPE "TestResult_new" AS ENUM ('pass', 'fail', 'absent');
ALTER TABLE "job_application_tests"
ALTER COLUMN "status" TYPE "TestResult_new"
USING "status"::text::"TestResult_new";
DROP TYPE "TestResult";
ALTER TYPE "TestResult_new" RENAME TO "TestResult";
