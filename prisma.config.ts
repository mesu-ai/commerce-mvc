// Prisma 7 configuration file.
// The database connection URL now lives here (no longer in schema.prisma).
// Docs: https://www.prisma.io/docs/orm/reference/prisma-config-reference
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
