-- CreateTable
CREATE TABLE "applicants" (
    "applicantId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "divisionId" INTEGER NOT NULL,
    "portfolioLink" TEXT,
    "sscRegistrationNo" TEXT,
    "sscRollNo" TEXT,
    "sscGpa" DOUBLE PRECISION,
    "hscRegistrationNo" TEXT,
    "hscRollNo" TEXT,
    "hscGpa" DOUBLE PRECISION,
    "universityId" INTEGER NOT NULL,
    "bachelorSubject" TEXT,
    "cgpa" DOUBLE PRECISION,
    "currentSalary" DOUBLE PRECISION,
    "expectedSalary" DOUBLE PRECISION,
    "experience" INTEGER,
    "resume" TEXT,
    "coverLetter" TEXT,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("applicantId")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "applicationId" SERIAL NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT,
    "appliedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "universities" (
    "universityId" INTEGER NOT NULL,
    "universityName" TEXT NOT NULL,
    "isActive" TEXT,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("universityId")
);

-- CreateIndex
CREATE INDEX "applicants_universityId_idx" ON "applicants"("universityId");

-- CreateIndex
CREATE INDEX "job_applications_jobId_stage_status_idx" ON "job_applications"("jobId", "stage", "status");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_applicantId_jobId_key" ON "job_applications"("applicantId", "jobId");

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("universityId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "careers"("jobId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("applicantId") ON DELETE RESTRICT ON UPDATE CASCADE;
