# CUNEX Poll — backend

NestJS 12 (ESM) · PostgreSQL 16+ · Redis · Kysely · BullMQ · zod

- Architecture: [docs/CUNEX-Poll-Architecture.pdf](docs/CUNEX-Poll-Architecture.pdf)
- API: [docs/api-endpoints.md](docs/api-endpoints.md)
- Schema: [db/migrations/](db/migrations/)

## Run locally

Requires Node ≥ 22.12, pnpm, Docker.

```bash
cp .env.example .env
pnpm install
pnpm db:up          # Postgres 18 (port 55432) + Redis 8 via docker compose
pnpm db:migrate     # applies db/migrations/*.sql
pnpm start:dev      # API on :3000  (health: /healthz, /readyz)
pnpm start:worker   # background worker, separate terminal
```

CUNEX runs in **mock** mode until we have credentials (`CUNEX_MODE=mock`):

- Open `http://localhost:3000/api/v1/auth/cunex/login?mockUser=med-2566` to log in as a fixture student.
- Or `POST /api/v1/auth/dev/login` with `{"role":"admin"}` (the test-accounts popup; disabled in production).
- Fixtures: [src/modules/cunex/mock-cunex.client.ts](src/modules/cunex/mock-cunex.client.ts).

Switch to `CUNEX_MODE=live` and fill in the `CUNEX_*` values once the CUNEX team sends them.

## Changing the schema

1. Add `db/migrations/NNNN_description.sql` (never edit an applied migration).
2. `pnpm db:migrate`
3. `pnpm db:codegen` regenerates `src/infra/database/db.d.ts` from the live database. Commit it.

## Layout

```
src/
  main.ts / worker.ts        two entry points, one codebase
  config/env.ts              zod-validated environment
  common/                    problem+json errors, Origin (CSRF) guard
  infra/                     database (Kysely), redis, logging (pino)
  modules/<feature>/         auth, polls, ballots, results, admin, …
```

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm test:e2e       # needs pnpm db:up; uses a separate pollcunex_test DB and Redis DB 15
```
