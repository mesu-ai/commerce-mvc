-- CreateTable
CREATE TABLE "career_otps" (
    "otpId" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "sscRegistrationNo" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "tokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_otps_pkey" PRIMARY KEY ("otpId")
);

-- CreateIndex
CREATE UNIQUE INDEX "career_otps_tokenHash_key" ON "career_otps"("tokenHash");

-- CreateIndex
CREATE INDEX "career_otps_jobId_email_idx" ON "career_otps"("jobId", "email");

-- AddForeignKey
ALTER TABLE "career_otps" ADD CONSTRAINT "career_otps_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "careers"("jobId") ON DELETE CASCADE ON UPDATE CASCADE;
