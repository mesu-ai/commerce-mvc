-- AlterTable
-- Convert the existing text deadlines (e.g. "2026-01-28T23:59") in place
-- instead of dropping the column; blank values become NULL
ALTER TABLE "careers"
ALTER COLUMN "deadline" TYPE TIMESTAMP(3)
USING NULLIF(TRIM("deadline"), '')::TIMESTAMP(3);
