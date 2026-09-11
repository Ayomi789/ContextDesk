# ContextDesk Setup

## Prereqs

- Node.js 24+ and npm 10+
- A Postgres database (Neon free tier works: `npx create-db`)
- ~2 GB free disk for `node_modules` (installs fail with ENOSPC otherwise)

## First run

```bash
# 1. Install (from the repo root; wires the api + shared-types workspaces)
npm install

# 2. Env
cp .env.example apps/api/.env
# then fill in DATABASE_URL and JWT_SECRET (long random string).
# FRONTEND_URL defaults to http://localhost:5515,http://localhost:5173.

# 3. Migrate + seed
cd apps/api
npx prisma migrate dev
npm run seed   # idempotent; SEED_DEMO=0 skips demo data

# 4. Dev server (http://localhost:5011)
npm run dev
```

## Everyday commands

| Where | Command | What |
|---|---|---|
| root | `npm run dev` | API in watch mode |
| root | `npm run build` | Build API to `apps/api/dist` |
| root | `npm test` | Vitest unit tests (11 tests, no DB writes) |
| root | `npm run seed` | Idempotent seed |
| `apps/api` | `npm run typecheck` | `tsc --noEmit` |
| `apps/api` | `npm start` | Run the built server |

CI (`.github/workflows/ci.yml`) runs shared-types build, typecheck,
tests, API build, and `prisma validate` on push/PR to `main`.

## Frontend (agon build)

The maintained frontend lives outside this repo. Point it at the API:

- API base URL: `http://localhost:5011/api/v1`
- Auth header: `Bearer <token>` from `POST /auth/login`
- Dev port: 5515 (already in the default `FRONTEND_URL` allowlist)

## Bootstrap the first ADMIN

`POST /auth/register` always creates `AGENT` users. Promote one directly:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

or run the seed with admin env:

```bash
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='...' npm run seed
```

Admins can `DELETE` tickets/contacts/accounts and `PATCH /users/:id/role`.
Everything else is open to any authenticated agent.

## Deploy (Render)

Push to GitHub, then Render → New → Blueprint → this repo
(`render.yaml` builds the Dockerfile, runs migrations, and
health-checks `/api/v1/health`). Fill the prompted env vars —
`DATABASE_URL` (Neon), `FRONTEND_URL` (your deployed frontend origin),
plus the NVIDIA/SMTP/Google keys. Free tier sleeps when idle.

## Docker (local)

```bash
docker build -t contextdesk-api .
docker run -p 5011:5011 -e DATABASE_URL=... -e JWT_SECRET=... contextdesk-api
```

Set `FRONTEND_URL` to your real origin(s) in production. The image is
build- and boot-tested (health + DB-backed login path verified).
Gotcha: keep `.env` values **unquoted** — Node dotenv strips quotes but
`docker run --env-file` passes them through literally, which breaks
`DATABASE_URL` validation.
