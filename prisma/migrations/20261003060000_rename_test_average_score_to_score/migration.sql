-- Rename in place (Prisma would generate DROP + ADD and lose the data)
ALTER TABLE "job_application_tests" RENAME COLUMN "averageScore" TO "score";
