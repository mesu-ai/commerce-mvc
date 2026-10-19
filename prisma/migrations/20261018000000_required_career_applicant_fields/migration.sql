-- DropForeignKey
ALTER TABLE "careers" DROP CONSTRAINT "careers_departmentId_fkey";

-- RenameColumn (keeps existing values instead of drop + add)
ALTER TABLE "applicants" RENAME COLUMN "cgpa" TO "bachelorCgpa";

-- AlterTable
ALTER TABLE "applicants" ALTER COLUMN "bachelorCgpa" SET NOT NULL,
ADD COLUMN     "masterCgpa" DOUBLE PRECISION,
ADD COLUMN     "masterSubject" TEXT,
ADD COLUMN     "noticePeriod" INTEGER,
ALTER COLUMN "sscRegistrationNo" SET NOT NULL,
ALTER COLUMN "sscRollNo" SET NOT NULL,
ALTER COLUMN "sscGpa" SET NOT NULL,
ALTER COLUMN "hscRegistrationNo" SET NOT NULL,
ALTER COLUMN "hscRollNo" SET NOT NULL,
ALTER COLUMN "hscGpa" SET NOT NULL,
ALTER COLUMN "bachelorSubject" SET NOT NULL,
ALTER COLUMN "currentSalary" SET DATA TYPE INTEGER,
ALTER COLUMN "expectedSalary" SET NOT NULL,
ALTER COLUMN "expectedSalary" SET DATA TYPE INTEGER,
ALTER COLUMN "resume" SET NOT NULL;

-- AlterTable
ALTER TABLE "careers" ALTER COLUMN "position" SET NOT NULL,
ALTER COLUMN "vacancy" SET NOT NULL,
ALTER COLUMN "experience" SET NOT NULL,
ALTER COLUMN "salary" SET NOT NULL,
ALTER COLUMN "deadline" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "context" SET NOT NULL,
ALTER COLUMN "requirements" SET NOT NULL,
ALTER COLUMN "skills" SET NOT NULL,
ALTER COLUMN "qualifications" SET NOT NULL,
ALTER COLUMN "benefits" SET NOT NULL,
ALTER COLUMN "departmentId" SET NOT NULL,
ALTER COLUMN "slug" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "careers" ADD CONSTRAINT "careers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;
