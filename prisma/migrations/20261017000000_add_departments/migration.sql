-- CreateTable
CREATE TABLE "departments" (
    "departmentId" SERIAL NOT NULL,
    "departmentName" TEXT NOT NULL,
    "status" TEXT DEFAULT 'Y',

    CONSTRAINT "departments_pkey" PRIMARY KEY ("departmentId")
);

-- Fill departments from the ids/names the existing jobs already use, so the
-- foreign key below holds for current rows
INSERT INTO "departments" ("departmentId", "departmentName")
SELECT DISTINCT ON ("departmentId") "departmentId", COALESCE(NULLIF(TRIM("department"), ''), 'Department ' || "departmentId")
FROM "careers"
WHERE "departmentId" IS NOT NULL
ORDER BY "departmentId";

SELECT setval(pg_get_serial_sequence('departments', 'departmentId'), COALESCE((SELECT MAX("departmentId") FROM "departments"), 1), (SELECT COUNT(*) > 0 FROM "departments"));

-- AlterTable: the name now comes from the departments relation
ALTER TABLE "careers" DROP COLUMN "department";

-- CreateIndex
CREATE INDEX "careers_departmentId_idx" ON "careers"("departmentId");

-- AddForeignKey
ALTER TABLE "careers" ADD CONSTRAINT "careers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE SET NULL ON UPDATE CASCADE;
