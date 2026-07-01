# Express MVC API

E-commerce back-end API for the SaRa eMart marketplace platform, built with Express 5, TypeScript, Prisma 7, and PostgreSQL.

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

The API will be available at `http://localhost:4000/api/v1`.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `API_PREFIX` | `/api/v1` | API route prefix |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `ACCESS_TOKEN_SECRET` | — | JWT access token secret |
| `REFRESH_TOKEN_SECRET` | — | JWT refresh token secret |
| `JWT_SECRET` | — | General JWT secret (required in production) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with nodemon |
| `npm start` | Start production server from compiled JS |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run clean` | Remove `dist/` directory |
| `npm run db:up` | Start PostgreSQL via Docker Compose |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:seed` | Seed database with sample data |

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
| `GET` | `/brands` | List brands |
| `GET` | `/shops` | List shops |
| `GET` | `/sellers` | List sellers |
| `GET` | `/users` | List users |
| `GET` | `/roles` | List roles |
| `GET` | `/inventory` | Inventory data |
| `GET` | `/columns` | Column visibility settings |
| `GET` | `/variants` | Variant attributes & combinations |
| `GET` | `/warranty` | Warranty types & periods |
| `GET` | `/sizes` | Size attributes & charts |

### Health Check

```
GET /health
```

Returns server status, timestamp, and environment — no auth required.

## Project Structure

```
express-mvc-api/
├── server.ts                  # Entry point
├── prisma/
│   ├── schema.prisma          # Database schema (15 models)
│   ├── migrations/            # SQL migration history
│   └── seed.ts                # Database seeder
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── config/
│   │   ├── environment.ts     # Environment variables
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── database.ts        # Database config
│   │   └── index.ts           # Config re-exports
│   ├── data/                  # Mock/seed data files
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
│   │   └── sizes/             # Sizes
│   ├── types/                 # TypeScript type definitions
│   └── utils/
│       ├── logger.ts          # Request logger
│       └── errorHandler.ts    # Global error handler
├── package.json
└── tsconfig.json
```

## Database

The PostgreSQL database contains 15 tables managed by Prisma:

`categories`, `products`, `brands`, `sellers`, `shops`, `roles`, `users`, `column_settings`, `warranty_types`, `warranty_periods`, `size_attributes`, `size_charts`, `variant_attributes`, `variant_attribute_values`, `variant_category_combinations`

Run `npm run db:studio` to browse the data visually.

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
