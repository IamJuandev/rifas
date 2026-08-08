# Control de Rifas

Small app to track raffle numbers, payments and draw dates. Next.js (App Router) + SQLite.

## Data model

- **rifa** — name and price per number.
- **sorteo** — every raffle has exactly **3 draws**; each one stores a date and the winning number.
- **ticket** — a sold number: consecutive id (`numeracion`), 4-digit number, buyer name, phone,
  and the amount due (`valor_a_pagar`, always the raffle price).

- **abono** — one deposit against a ticket: amount, date and an optional note.

The sum of a ticket's abonos is the only source of truth for how much it has paid, and a
ticket counts as paid once that sum reaches `valor_a_pagar`. There is no manual paid flag:
"Pagar saldo" records the outstanding balance as one more deposit.

Numbers are 4 digits (`0000`–`9999`) and unique per raffle. Schema migrations are versioned
through `PRAGMA user_version` and run on the first connection.

## Setup

```bash
cp .env.example .env.local   # set ADMIN_USER, ADMIN_PASSWORD and SESSION_SECRET
npm install
npm run dev                  # http://localhost:3000
```

The admin user is created the first time the database boots, using `ADMIN_USER` /
`ADMIN_PASSWORD`. Changing those values later does **not** update an existing user.

In development only, the app falls back to `admin` / `admin123` and to a fixed session
secret. Both fallbacks are refused when `NODE_ENV=production`: without `SESSION_SECRET` and
`ADMIN_PASSWORD` the app throws instead of booting with credentials that are public in this
repository. Generate the secret with `openssl rand -base64 32`.

## Deployment

The image is built from the `Dockerfile` (Node 22, multi-stage). The SQLite file lives at
`/app/data/rifas.db` — mount a persistent volume on `/app/data` or every redeploy starts
from an empty database.

Required environment variables: `SESSION_SECRET`, `ADMIN_PASSWORD`, `ADMIN_USER`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests for the domain rules (vitest) |

## Database

SQLite file at `data/rifas.db` (override with `DATABASE_PATH`). Schema is created and
migrated automatically on first connection. Back up by copying that file — stop the
server first so the WAL is checkpointed.
