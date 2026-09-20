-- Rename role fields while preserving existing role records.
ALTER TABLE "roles" RENAME COLUMN "id" TO "roleId";
ALTER TABLE "roles" RENAME COLUMN "role" TO "roleName";

ALTER TABLE "users" ADD COLUMN "roleId" INTEGER;
ALTER TABLE "users" ADD COLUMN "roleName" TEXT;

UPDATE "users" AS u
SET "roleName" = u."role";

UPDATE "users" AS u
SET "roleId" = r."roleId"
FROM "roles" AS r
WHERE r."roleName" = u."role";

ALTER TABLE "users" DROP COLUMN "role";
