# Period Tracker — Backend API

A standalone **Node.js + TypeScript + Express** REST API for the Period Tracker application.
It is the **only** component that talks to PostgreSQL (through Prisma). The frontend is a
separate codebase that consumes this API over HTTP.

> Health data is sensitive. This service hashes passwords with bcrypt, authenticates with
> short‑lived JWT access tokens plus rotating refresh tokens stored as hashes, enforces
> per‑record ownership checks, and deliberately never logs period/symptom/mood/notes data.

---

## Requirements

- Node.js 18+ (20 LTS recommended)
- PostgreSQL 14+
- npm

## 1. PostgreSQL setup

Create a database and a user:

```sql
CREATE DATABASE period_tracker;
CREATE USER period_tracker WITH ENCRYPTED PASSWORD 'period_tracker';
GRANT ALL PRIVILEGES ON DATABASE period_tracker TO period_tracker;
```

(Or use Docker: `docker run --name pt-postgres -e POSTGRES_PASSWORD=period_tracker -e POSTGRES_USER=period_tracker -e POSTGRES_DB=period_tracker -p 5432:5432 -d postgres:16`)

## 2. Installation

```bash
cd period-tracker-backend
npm install
cp .env.example .env
```

## 3. Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `5000`) |
| `NODE_ENV` | `development` \| `test` \| `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing secret for access tokens |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `15m`) |
| `REFRESH_TOKEN_SECRET` | Signing secret for refresh tokens |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime (e.g. `7d`) |
| `FRONTEND_URL` | Allowed CORS origin + base URL used in reset links |
| `COOKIE_SECURE` | `true` to force the `Secure` flag on the refresh cookie |
| `RESET_TOKEN_EXPIRES_IN_MINUTES` | Password‑reset token lifetime |

The process **fails fast** on startup if any required variable is missing or invalid.
Never commit a real `.env`.

## 4. Prisma setup & migrations

```bash
npm run prisma:generate     # generate the typed client
npm run prisma:migrate      # create/apply migrations (dev)
npm run seed                # optional: demo accounts + synthetic history
```

For production deploys use `npm run prisma:deploy` (`prisma migrate deploy`).

**Demo accounts** created by the seed (synthetic data only):

- `demo@periodtracker.dev` / `Password123`
- `ava@periodtracker.dev` / `Password123`

## 5. Running locally

```bash
npm run dev      # tsx watch, http://localhost:5000/api
```

```bash
npm run build && npm start   # compiled production build
```

Health check: `GET http://localhost:5000/api/health`

## 6. Running tests

```bash
npm test
```

Tests use Jest with a deep‑mocked Prisma client (`jest-mock-extended`) — **no database is
required**. Coverage includes: password hashing, auth middleware, registration/login
(including invalid credentials and "no hash in response"), period CRUD + ownership
authorization, validation schemas, cycle statistics and prediction calculations.

## 7. API documentation

- Swagger UI: `http://localhost:5000/api/docs`
- Raw spec: `http://localhost:5000/api/docs.json`

### Response envelope

```jsonc
// success
{ "success": true, "data": { }, "message": "Operation completed successfully" }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [] } }
```

### Endpoint summary

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `/login`, `/logout`, `/refresh`, `/forgot-password`, `/reset-password`; `GET /api/auth/me` |
| Users | `GET/PATCH/DELETE /api/users/me`, `PATCH /api/users/me/password` |
| Periods | `GET/POST /api/periods`, `GET/PATCH/DELETE /api/periods/:id` |
| Symptoms | `GET/POST /api/symptoms`, `PATCH/DELETE /api/symptoms/:id` |
| Moods | `GET/POST /api/moods`, `PATCH/DELETE /api/moods/:id` |
| Cycles | `GET /api/cycles`, `/api/cycles/statistics`, `/api/cycles/summary` |
| Predictions | `GET /api/predictions`, `/next-period`, `/fertile-window`, `/calendar` |
| Reminders | `GET/PATCH /api/reminders` |

---

## Architecture & decisions

```
src/
├── config/        env validation (zod), Prisma client, logger
├── controllers/   thin HTTP layer — parse req, call service, format response
├── services/      business logic + the ONLY database access
├── routes/        express routers, one per resource, wired in routes/index.ts
├── middleware/    requireAuth, zod validation, centralised error handler
├── validators/    zod request schemas (shared shapes with the frontend)
├── utils/         jwt, bcrypt, date math, api envelope, cookies
├── docs/          OpenAPI document
├── app.ts         express app assembly (helmet, cors, rate-limit, routes)
└── server.ts      bootstrap: connect DB, listen, graceful shutdown
```

- **Auth model.** Access token (JWT, 15m) returned in the response body and sent by the
  client as `Authorization: Bearer`. Refresh token (JWT, 7d) set as an `httpOnly`,
  `SameSite` cookie scoped to `/api/auth`, and stored **hashed** in the `Session` table so
  it can be revoked. `/api/auth/refresh` rotates the refresh token. Changing or resetting
  a password revokes all sessions.
- **Ownership.** Every `:id` route loads the record and compares `userId` before returning
  or mutating it. A record owned by another user returns `404` (not `403`) so existence is
  not leaked.
- **Predictions** live entirely in `services/prediction.service.ts` and are configurable
  via `PREDICTION_CONFIG` (cycle/period defaults, luteal phase length, fertile‑window
  offsets, confidence thresholds). They are returned with a `confidence` level and a
  disclaimer; the frontend never computes predictions.
- **Privacy.** The logger never receives request bodies. Errors return generic messages;
  stack traces are logged internally only and never in production.
- **Email & notifications** are behind `EmailProvider` / `NotificationDispatcher`
  abstractions. In development the password‑reset link is printed to the backend console.
  Swap in SES/SendGrid/APNs/Twilio without touching callers.
