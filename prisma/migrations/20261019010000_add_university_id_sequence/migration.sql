CREATE SEQUENCE IF NOT EXISTS "universities_universityId_seq";

SELECT setval(
  '"universities_universityId_seq"',
  COALESCE((SELECT MAX("universityId") FROM "universities"), 0) + 1,
  false
);

ALTER SEQUENCE "universities_universityId_seq"
OWNED BY "universities"."universityId";

ALTER TABLE "universities"
ALTER COLUMN "universityId"
SET DEFAULT nextval('"universities_universityId_seq"');
