-- Add the replacement columns before removing the legacy department value.
ALTER TABLE "users"
ADD COLUMN "departmentId" INTEGER,
ADD COLUMN "departmentName" TEXT;

-- Existing data stores department IDs as text. Preserve those IDs and resolve
-- names from the departments table where possible.
UPDATE "users" AS u
SET "departmentId" = CASE
  WHEN u."department" ~ '^[0-9]+$' THEN u."department"::INTEGER
  ELSE NULL
END,
"departmentName" = d."departmentName"
FROM "departments" AS d
WHERE d."departmentId" = CASE
  WHEN u."department" ~ '^[0-9]+$' THEN u."department"::INTEGER
  ELSE NULL
END;

-- Do not silently convert invalid legacy values. The migration must stop if
-- any existing user cannot be assigned a department ID.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "users" WHERE "departmentId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot migrate users: department must contain a numeric department ID';
  END IF;
END $$;

ALTER TABLE "users"
ALTER COLUMN "departmentId" SET NOT NULL,
DROP COLUMN "department";
