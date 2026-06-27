// Single shared PrismaClient instance for the whole app.
// Prisma 7 requires a driver adapter — we use the PostgreSQL (`pg`) adapter.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in the environment (.env)");
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
