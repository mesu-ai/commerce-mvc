-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('written', 'technical', 'interview');

-- CreateEnum
CREATE TYPE "TestResult" AS ENUM ('pending', 'pass', 'fail', 'absent');

-- CreateTable
CREATE TABLE "job_application_tests" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "testType" "TestType" NOT NULL,
    "testDate" TIMESTAMP(3),
    "subjects" JSONB,
    "averageScore" DOUBLE PRECISION,
    "status" "TestResult" NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "evaluatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_application_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_application_tests_testType_status_idx" ON "job_application_tests"("testType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "job_application_tests_applicationId_testType_key" ON "job_application_tests"("applicationId", "testType");

-- AddForeignKey
ALTER TABLE "job_application_tests" ADD CONSTRAINT "job_application_tests_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("applicationId") ON DELETE CASCADE ON UPDATE CASCADE;
