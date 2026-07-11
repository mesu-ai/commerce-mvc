# Express MVC API

E-commerce back-end API for the eMart marketplace platform, built with Express 5, TypeScript, Prisma 7, and PostgreSQL.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **ORM:** Prisma 7 (`@prisma/adapter-pg` driver adapter)
- **Database:** PostgreSQL
- **Auth:** JWT (access token + httpOnly refresh token cookie)

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker (for PostgreSQL) or a running PostgreSQL instance
- npm

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets

# Start PostgreSQL via Docker
npm run db:up

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with sample data
npm run db:seed

# Start the dev server
npm run dev
```

The API will be available at `http://localhost:<PORT>/api/v1` (`PORT` defaults to `4000` if unset — see [Environment Variables](#environment-variables)).

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Server port (`.env.example` ships with `3000` — override to taste) |
| `NODE_ENV` | `development` | Environment |
| `API_PREFIX` | `/api/v1` | API route prefix |
| `DATABASE_URL` | — | PostgreSQL connection string (consumed directly by Prisma — see below) |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | — | Same connection, split into parts for `src/config/environment.ts`. Keep these in sync with `DATABASE_URL` |
| `ACCESS_TOKEN_SECRET` | — | JWT access token secret |
| `REFRESH_TOKEN_SECRET` | — | JWT refresh token secret |
| `JWT_SECRET` | — | General JWT secret (required in production) |
| `JWT_EXPIRES_IN` | `24h` | Expiry for the general JWT |

## Prisma Setup & Configuration

This project uses **Prisma 7**, which changed two things from older Prisma versions that matter here: the connection config moved out of `schema.prisma` and into a dedicated config file, and a **driver adapter** is now mandatory (there is no default built-in connector anymore).

### The moving parts

| File | Role |
|---|---|
| `prisma/schema.prisma` | Model definitions only — no `url` in the `datasource` block anymore |
| `prisma.config.ts` | Where the schema path, migrations path, and `DATABASE_URL` are wired together |
| `src/config/prisma.ts` | The single shared `PrismaClient` instance used by every route |
| `prisma/seed.ts` | Bulk-loads `src/data/*.ts` mock arrays into the real tables |
| `prisma/migrations/` | Auto-generated SQL migration history (never hand-edit these) |

`prisma.config.ts`:

```ts
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
```

`schema.prisma`'s datasource block only declares the provider now:

```prisma
datasource db {
  provider = "postgresql"
}
```

### Day-to-day commands

```bash
npx prisma generate            # regenerate the typed client after any schema change
npx prisma migrate dev --name <change-name>   # create + apply a migration in dev
npx prisma migrate deploy      # apply pending migrations in prod/CI (no prompts, no drift checks)
npx prisma studio               # visual DB browser at localhost:5555
npx prisma format               # normalize schema.prisma formatting
```

(`npm run db:migrate` and `npm run db:generate` wrap the first two for convenience — see [Scripts](#scripts).)

**Whenever you touch `schema.prisma`, you must run `npx prisma generate` again** — the generated client (`node_modules/@prisma/client`) is what gives you `prisma.blogPost`, `prisma.outlet`, etc., and it's a snapshot that goes stale the moment the schema changes. Forgetting this step is the #1 cause of "Property 'x' does not exist on type PrismaClient" errors, including in editor tooltips that haven't reloaded yet.

## Connecting Prisma to PostgreSQL

### Local development (recommended path)

1. **Start Postgres.** `docker-compose.yml` spins up a disposable Postgres 16 container with a named volume so data survives restarts:
   ```bash
   npm run db:up      # docker compose up -d
   npm run db:down    # docker compose down (add -v to also wipe the volume)
   ```
2. **Point `DATABASE_URL` at it.** The connection string format is:
   ```
   postgresql://<user>:<password>@<host>:<port>/<database>?schema=public
   ```
   The default in `.env.example` matches the docker-compose service exactly:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/express_mvc_db?schema=public"
   ```
   If you point this at an external/managed Postgres instead (Neon, Supabase, RDS, etc.), just swap the string — nothing else in the app needs to change.
3. **Wire it through the driver adapter.** Prisma 7 requires an explicit adapter; this repo uses `@prisma/adapter-pg` (the plain `pg` driver) in `src/config/prisma.ts`:
   ```ts
   import { PrismaPg } from "@prisma/adapter-pg";
   import { PrismaClient } from "@prisma/client";

   const connectionString = process.env.DATABASE_URL;
   if (!connectionString) {
     throw new Error("DATABASE_URL is not set in the environment (.env)");
   }

   const adapter = new PrismaPg({ connectionString });
   export const prisma = new PrismaClient({ adapter });
   ```
   Import `prisma` from this module everywhere — never instantiate a second `PrismaClient`. One shared instance means one connection pool.
4. **Verify the connection:**
   ```bash
   npx prisma db pull --print   # introspects the live DB and prints what Prisma sees, without writing anything
   ```
   If this fails, the problem is the connection string or the container, not your schema.

### Production / best practices

- **Use `migrate deploy`, not `migrate dev`, in CI/CD.** `migrate dev` is interactive, can prompt to reset the database on drift, and is meant for local iteration only. `migrate deploy` just applies whatever migrations aren't yet applied — safe for pipelines.
- **Enable SSL** on the connection string when the database isn't on localhost: append `?sslmode=require` (most managed Postgres providers require this and will refuse plain TCP).
- **Pool connections externally in serverless environments.** A raw `pg` adapter opens real TCP connections; if you deploy to something that scales out horizontally per-request (Lambda, Vercel functions), put PgBouncer or Prisma Accelerate in front of Postgres so you don't exhaust the database's connection limit. For a long-running Node server (this app's default deployment model), the built-in pool from `@prisma/adapter-pg` is sufficient on its own.
- **Never commit real credentials.** `.env` is for local secrets only; production secrets belong in your host's secret manager (and `DATABASE_URL` there should point at the production database, obviously never the docker-compose one).
- **Run `prisma generate` as part of your build step**, not just locally — a fresh `npm ci` in CI won't have a generated client until you do.
- **Migrations are additive and linear.** Don't edit a migration file that's already been applied anywhere (including your own local DB) — create a new migration instead, the same way you would with any other database.

## Migrating Local Mock Data to PostgreSQL

Large parts of this API started out serving static in-memory arrays from `src/data/*.ts` (leftover from before the Postgres migration). Bringing one of those resources onto Postgres follows the same repeatable recipe every time — this is exactly how `blogCategory`/`blogPost` and `outlet` were migrated:

1. **Inspect the mock data shape.** Look at `src/data/<resource>.ts` and note every field that actually appears across records (mock JSON often has `null`s or commented-out fields — only model what's really there). Nested arrays/objects (e.g. `contacts: [{ contact: "..." }]`) become `Json` columns rather than relations, to keep the API response shape identical to the mock data.

2. **Add a model to `prisma/schema.prisma`.** Use the natural ID from the mock data as `@id` (e.g. `outletId`) instead of a surrogate key, so existing frontend code referencing those IDs keeps working. Map the table to a snake_case name with `@@map(...)`:
   ```prisma
   model Outlet {
     outletId          Int     @id
     outletName        String
     address           String?
     ...
     contacts          Json?

     @@map("outlets")
   }
   ```

3. **Create and apply the migration:**
   ```bash
   npx prisma migrate dev --name add_outlet
   ```
   This writes a new folder under `prisma/migrations/` with the raw SQL, and applies it to your local database.

4. **Regenerate the Prisma client** so TypeScript knows about the new model:
   ```bash
   npx prisma generate
   ```

5. **Register the data in `prisma/seed.ts`** — import the mock array and reseed it through the shared helper:
   ```ts
   import { outlets } from "../src/data/outlet";
   // ...
   await reseed("outlets", prisma.outlet, outlets);
   ```
   `reseed()` clears the table (`deleteMany`) and bulk-inserts in batches of 1000 (`createMany`), since Postgres caps the number of bound parameters per query — this matters once a table has thousands of rows (e.g. `variant_category_combinations` has ~8,700).

6. **Run the seed:**
   ```bash
   npm run db:seed
   ```

7. **Point the route at Prisma instead of the in-memory array.** Replace direct array access/filtering in `src/routes/<resource>/<resource>.ts` with `prisma.<model>.findMany` / `.count` / `.findUnique`, keeping the same pagination and filtering contract the frontend already expects (see any route file for the shared pattern: `keyword` search via `contains`/`insensitive`, `status` exact match, `currentPage`/`itemsPerPage` → `skip`/`take`).

8. **Mount the route** in `src/routes/index.ts` if it's a new resource (import + `router.use("/<path>", ...)` + add it to the root `/` endpoint listing).

9. **Verify:**
   ```bash
   npx tsc --noEmit          # confirms the Prisma types line up with route code
   npm run db:seed           # confirms the data actually loads without constraint errors
   ```
   Then hit the endpoint — a `401 Unauthorized` (rather than `404`/`500`) confirms the route is wired correctly and the Prisma client didn't crash on load; a valid `Bearer` token confirms the data itself.

10. **Leave the original `src/data/<resource>.ts` file in place.** `prisma/seed.ts` treats it as the seed source of truth — deleting it breaks reseeding. Only remove it once you've moved to a different seeding strategy (e.g. a DB dump or export script).

## Database

The PostgreSQL database currently has **21 tables**, all managed by Prisma migrations:

`categories`, `products`, `content_category`, `content_post`, `brands`, `sellers`, `shops`, `roles`, `users`, `column_settings`, `warranty_types`, `warranty_periods`, `size_attributes`, `size_charts`, `variant_attributes`, `variant_attribute_values`, `variant_category_combinations`, `blog_categories`, `blog_posts`, `outlets`, `redis_cache`

Run `npm run db:studio` to browse the data visually.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with nodemon |
| `npm start` | Start production server from compiled JS |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run clean` | Remove `dist/` directory |
| `npm run db:up` | Start PostgreSQL via Docker Compose |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run db:migrate` | Run Prisma migrations (`prisma migrate dev`) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:seed` | Seed database with sample data from `src/data/*.ts` |

## API Endpoints

All endpoints are prefixed with `/api/v1`. Most routes require a `Bearer` access token in the `Authorization` header.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Login with username & password |
| `POST` | `/auth/refresh` | Refresh access token using cookie |
| `POST` | `/auth/logout` | Clear refresh token cookie |

### Resources

| Method | Path | Description |
|---|---|---|
| `GET` | `/products` | List products (paginated, filterable) |
| `GET` | `/products/:id` | Get single product |
| `GET` | `/categories` | List categories |
| `GET` | `/categories/tree` | Category tree |
| `GET` | `/categories/suggestions` | Category name suggestions |
| `GET` | `/brands` | List brands (paginated, filterable) |
| `GET` | `/brands/:id` | Get single brand |
| `GET` | `/shops` | List shops |
| `GET` | `/sellers` | List sellers |
| `GET` | `/sellers/shops/banks` | Bank list for seller shops |
| `GET` | `/users` | List users |
| `GET` | `/roles` | List roles |
| `GET` | `/inventory` | Inventory data |
| `GET` | `/columns` | Column visibility settings |
| `GET` | `/variants` | Variant attributes & combinations |
| `GET` | `/warranty` | Warranty types & periods |
| `GET` | `/sizes` | Size attributes & charts |
| `GET` | `/contents/categories` | List content categories (paginated, filterable) |
| `GET` | `/contents/posts` | List content posts (paginated, filterable) |
| `GET` | `/contents/posts/:postId` | Get single content post |
| `GET` | `/cache/redis` | List Redis cache entries (paginated, filterable) |
| `GET` | `/blogs/categories` | List blog categories (paginated, filterable) |
| `GET` | `/blogs/posts` | List blog posts (paginated, filterable) |
| `GET` | `/blogs/posts/:postId` | Get single blog post |
| `GET` | `/outlets` | List outlets (paginated, filterable) |
| `GET` | `/outlets/:id` | Get single outlet |

### Health Check

```
GET /health
```

Returns server status, timestamp, and environment — no auth required.

## Project Structure

```
express-mvc-api/
├── server.ts                  # Entry point
├── docker-compose.yml         # Local PostgreSQL container
├── prisma.config.ts           # Prisma 7 config (schema path, migrations path, DATABASE_URL)
├── prisma/
│   ├── schema.prisma          # Database schema (21 models)
│   ├── migrations/            # SQL migration history
│   └── seed.ts                # Database seeder (loads src/data/*.ts into Postgres)
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── config/
│   │   ├── environment.ts     # Environment variables
│   │   ├── prisma.ts          # Prisma client singleton (driver adapter wiring)
│   │   ├── database.ts        # Legacy mock-mode database config
│   │   └── index.ts           # Config re-exports
│   ├── data/                  # Mock/seed data files (source of truth for db:seed)
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT verification
│   │   └── middleware.ts       # General middleware
│   ├── routes/
│   │   ├── index.ts           # Route registry
│   │   ├── auth/              # Authentication
│   │   ├── products/          # Products
│   │   ├── categories/        # Categories
│   │   ├── brands/            # Brands
│   │   ├── shops/             # Shops
│   │   ├── sellers/           # Sellers
│   │   ├── users/             # Users
│   │   ├── roles/             # Roles
│   │   ├── inventory/         # Inventory
│   │   ├── columns/           # Column settings
│   │   ├── variants/          # Variants
│   │   ├── warranty/          # Warranty
│   │   ├── sizes/             # Sizes
│   │   ├── contents/          # Content categories & posts
│   │   ├── cache/             # Redis cache introspection
│   │   ├── blogs/             # Blog categories & posts
│   │   └── outlets/           # Store outlets
│   ├── types/                 # TypeScript type definitions
│   └── utils/
│       ├── logger.ts          # Request logger
│       └── errorHandler.ts    # Global error handler
├── package.json
└── tsconfig.json
```

## Authentication

The API uses a dual-token JWT strategy:

1. **Access Token** (15 min) — sent in the `Authorization: Bearer <token>` header
2. **Refresh Token** (7 days) — stored as an httpOnly cookie

Login flow:

```
POST /api/v1/auth/login   →  returns accessToken + sets refreshToken cookie
POST /api/v1/auth/refresh  →  returns new accessToken (reads cookie)
POST /api/v1/auth/logout   →  clears refreshToken cookie
```

## CORS

CORS is configured for `http://localhost:3010` with credentials enabled, matching the frontend development server.
