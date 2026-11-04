CREATE SEQUENCE IF NOT EXISTS "roles_roleId_seq";

SELECT setval(
  '"roles_roleId_seq"',
  COALESCE((SELECT MAX("roleId") FROM "roles"), 0) + 1,
  false
);

ALTER SEQUENCE "roles_roleId_seq"
OWNED BY "roles"."roleId";

ALTER TABLE "roles"
ALTER COLUMN "roleId"
SET DEFAULT nextval('"roles_roleId_seq"');
