# Bliq

Remote fleet control — a small service and two web dashboards that let a pool
of remote operators sign in, pick a vehicle from the fleet, and operate it,
with hard guarantees that no two operators ever hold the same vehicle at the
same time.

- **Backend** (`apps/backend`): NestJS + MongoDB. Vehicle & operator CRUD,
  transactional takeover / release, WebSocket real-time updates.
- **Operator dashboard** (`apps/operator-dashboard`): React + Vite. Operators
  sign in, take over vehicles, release them. Live via WebSocket by default,
  falls back to HTTP polling automatically.
- **Admin dashboard** (`apps/admin-dashboard`): React + Vite. Add vehicles,
  toggle connectivity, delete. Polling only — kept intentionally simple.

## Table of contents

1. [Quick start](#quick-start)
2. [Repository layout](#repository-layout)
3. [Architecture](#architecture)
4. [Concurrency & consistency](#concurrency--consistency)
5. [API reference](#api-reference)
6. [Real-time updates](#real-time-updates)
7. [Testing](#testing)
8. [Observability](#observability)
9. [Contribution workflow](#contribution-workflow)
10. [Assumptions & optional paths taken](#assumptions--optional-paths-taken)
11. [Evolution notes](#evolution-notes)

## Quick start

Prerequisites: **Node 22**, **Docker** with Compose v2 (for MongoDB).

```bash
# Once, on a fresh clone:
npm run install:all

# Every time you want to work:
npm run dev
```

`npm run dev` starts the whole stack in one shot:

1. `docker compose up -d --wait` boots MongoDB as a single-node replica set
   and blocks until the healthcheck reports healthy (transactions require a
   replica set — the compose healthcheck also runs `rs.initiate()` on first
   start, so no manual step is needed).
2. `concurrently` launches three dev servers side by side:
   - **backend** on `http://localhost:3000`
   - **operator dashboard** on `http://localhost:5173`
   - **admin dashboard** on `http://localhost:5174`

Ctrl+C stops all three. Mongo keeps running — use `npm run docker:down` to
shut it down, or `npm run docker:reset` to wipe the volume and restart fresh
(re-seeds operators on the next boot).

Once running:

- Open the **operator dashboard** at `:5173`, pick a seeded operator, and use
  the fleet. It defaults to WebSocket mode with a live event log.
- Open the **admin dashboard** at `:5174` to add vehicles and toggle their
  connectivity.
- Open the **Swagger UI** at `:3000/docs` for the full API reference with
  live examples (dev-only — disabled when `NODE_ENV=production`).

## Repository layout

```
bliq/
├── apps/
│   ├── backend/                 NestJS API + WebSocket gateway
│   ├── operator-dashboard/      Vite + React, operator UI
│   └── admin-dashboard/         Vite + React, admin UI
├── docker-compose.yml           Mongo replica set with self-initiating healthcheck
├── package.json                 root scripts + dev tooling (husky, lint-staged, commitlint)
├── .github/                     CI workflow, PR template, CODEOWNERS, branch protection recipe
├── .husky/                      pre-commit (prettier), commit-msg (commitlint)
└── README.md
```

### Backend layers

```
apps/backend/src/
├── domain/                  Entities, rule predicates, repository & service abstracts,
│                            typed DomainError hierarchy. Pure TypeScript, no framework.
├── data-access/             Mongoose schemas, mappers, repository implementations,
│                            change-stream watcher.
├── services/                Cross-aggregate implementations that need infra
│                            (currently: MongoFleetAssignmentService with transactions).
├── apis/                    Controllers, DTOs, feature modules, WebSocket gateway,
│                            exception filter, interceptor, metrics providers.
└── main.ts                  Global pipes, filter, interceptor, Swagger (dev-only), CORS.
```

Dependency direction is inward-only: `apis → services → domain ← data-access`.
`domain` imports from nothing. `data-access` and `services` import from
`domain` (for entities, rules, contracts). `apis` imports from all three.

## Architecture

### Vehicle & operator entities

- **Vehicle** — `{ id, name, connectivityStatus: 'online' | 'offline', assignedOperatorId: string | null }`.
- **Operator** — `{ id, name, currentVehicleId: string | null }`.

`assignedOperatorId` on the vehicle and `currentVehicleId` on the operator are
deliberately denormalised — the same relationship expressed twice. This makes
the "at most one vehicle per operator" invariant enforceable with a single
guarded write on the operator document, and lets both the UI and the API
answer "who is driving what" in one document read. Keeping the two in sync is
the concurrency problem, and it is solved by wrapping both writes in a single
MongoDB transaction (see next section).

### Domain rules

Business rules live as pure functions in `domain/*/rules.ts` — one source of
truth, reusable from the service layer, the exception filter, and tests:

- `canBeAssigned(vehicle)` — vehicle is online AND unassigned
- `canGoOffline(vehicle)` — vehicle is unassigned
- `canClaimVehicle(operator)` — operator holds no vehicle
- `isHolding(operator, vehicleId)` — operator currently holds this vehicle

### Domain errors → HTTP

Domain-level errors are typed and carry two stable fields:

- `code` (`VEHICLE_OFFLINE`, `VEHICLE_ALREADY_ASSIGNED`,
  `OPERATOR_ALREADY_HAS_VEHICLE`, `VEHICLE_NOT_HELD_BY_OPERATOR`,
  `VEHICLE_NOT_FOUND`, `OPERATOR_NOT_FOUND`)
- `kind` (`'not-found' | 'conflict' | 'invalid' | 'unauthorized' | 'forbidden'`)

A global `DomainExceptionFilter` maps `kind` to HTTP status via a small closed
table and returns `{ statusCode, code, message }`. Adding a new domain error
never touches the filter — the mapping is by category, not per-code. The
filter guards on `host.getType()` so a future non-HTTP transport (WebSocket
handlers, RPC) doesn't get an accidental HTTP response applied to it.

The frontend switches on `code` (not on English message text) to render
specific rejection reasons in toasts.

## Concurrency & consistency

Three invariants have to hold under any sequence of concurrent requests:

1. A vehicle is assigned to at most one operator at any time.
2. An operator holds at most one vehicle at any time.
3. A vehicle cannot be offline while assigned.

### Where the guarantees live

- **HTTP layer**: `ValidationPipe` + DTOs + the `X-Operator-Id` header
  extraction reject malformed input before it reaches business logic. First
  line of defence.
- **Persistence layer (the interesting one)**: `MongoFleetAssignmentService`
  opens a MongoDB `ClientSession`, wraps read + rule check + write in
  `session.withTransaction`. Both reads happen with `.session(session)` so
  they observe the same snapshot. Rule predicates from `domain/*/rules.ts`
  are consulted on the snapshot. Both writes happen inside the transaction.
- **Connectivity toggle**: single-document atomic guard —
  `findOneAndUpdate({ _id, assignedOperatorId: null }, { … })`. If a race is
  lost the caller re-reads and produces a precise error.

### How races are resolved

Two racing takeovers both target the **same operator document** (both want to
set `operator.currentVehicleId`). MongoDB detects the write conflict and
`withTransaction` retries the loser automatically. On retry, the loser's
fresh read observes the winner's committed state; the rule check now fails;
the transaction aborts cleanly with a typed `DomainError`. No partial writes,
no silent lost update.

The same mechanism handles the mirror race: one operator trying to take two
different vehicles at once conflicts on themselves.

### Consistency model

- **Within a takeover / release**: strongly consistent across the vehicle
  and operator documents. Either both writes commit or neither.
- **From the client's perspective**: eventually consistent. WebSocket
  subscribers receive `vehicle.changed` events within tens of milliseconds
  of the write commit; polling clients see it within 5 seconds. Any client
  acting on stale UI is safely rejected by the backend with a domain error
  code the client can display.

The two concurrency scenarios that couldn't have been unit-tested with fakes
are covered by real-Mongo integration tests — see [Testing](#testing).

## API reference

Full Swagger UI at [`/docs`](http://localhost:3000/docs) in dev.

### Vehicles CRUD

| Method | Path                              | Body                     | Response |
| ------ | --------------------------------- | ------------------------ | -------- |
| GET    | `/vehicles`                       | —                        | `Vehicle[]` |
| POST   | `/vehicles`                       | `{ name }`               | `Vehicle` |
| GET    | `/vehicles/:id`                   | —                        | `Vehicle` |
| PATCH  | `/vehicles/:id`                   | `{ name? }`              | `Vehicle` |
| DELETE | `/vehicles/:id`                   | —                        | `204` |
| PATCH  | `/vehicles/:id/connectivity`      | `{ status: 'online' \| 'offline' }` | `Vehicle` |

### Operators (read-only, seeded on boot)

| Method | Path                | Response |
| ------ | ------------------- | -------- |
| GET    | `/operators`        | `Operator[]` |
| GET    | `/operators/:id`    | `Operator` |

### Fleet management (takeover / release)

Both endpoints require an `X-Operator-Id: <objectId>` header identifying the
acting operator (a stand-in for auth — see [Assumptions](#assumptions--optional-paths-taken)).

| Method | Path                              | Headers            | Body           | Response |
| ------ | --------------------------------- | ------------------ | -------------- | -------- |
| POST   | `/fleet-management/takeover`      | `X-Operator-Id`    | `{ vehicleId }` | `Vehicle` |
| POST   | `/fleet-management/release`       | `X-Operator-Id`    | `{ vehicleId }` | `Vehicle` |

### Error response shape

Every domain rule violation returns a JSON body with a stable machine code:

```json
{
  "statusCode": 409,
  "code": "VEHICLE_ALREADY_ASSIGNED",
  "message": "Another operator is holding this vehicle"
}
```

Both frontends switch on `code` to render specific rejection reasons.

## Real-time updates

The operator dashboard subscribes to a WebSocket namespace `/realtime` and
receives:

- `vehicles.snapshot` (on connect): current full list
- `vehicle.changed` (broadcast): `{ kind: 'created'|'updated'|'deleted', vehicleId, vehicle }`

On the server:

1. `VehicleChangeStreamWatcher` in `data-access/vehicles/` opens a MongoDB
   change stream on the vehicles collection when the first WebSocket client
   connects, and stops it when the last one disconnects. No idle Mongo
   cursor when no one is watching.
2. Each raw Mongo event is translated to a domain `VehicleChangedEvent` and
   emitted on the app-wide `EventEmitter2`.
3. `VehiclesGateway` in `apis/vehicles/` subscribes with
   `@OnEvent('vehicle.changed')` and broadcasts to every socket in `/realtime`.

### Frontend fallback

The operator dashboard defaults to WebSocket. If the initial connect fails
(or all reconnect attempts are exhausted mid-session), it falls back to
5-second HTTP polling and shows an error toast with the underlying reason.
Users can retry WebSocket by clicking the toggle in the header.

## Testing

- **Backend**: `npm --prefix apps/backend test`

Three suites, ~15 seconds total against `mongodb-memory-server`.

- `vehicle.rules.spec.ts` / `operator.rules.spec.ts` — pure unit tests for
  the rule predicates. No mocks, no framework, no DB.
- `mongo-fleet-assignment.service.spec.ts` — integration test against a real
  single-node MongoDB replica set (via `mongodb-memory-server`). Covers:
  - Full takeover decision table (happy path + every rule violation)
  - Every failure path also asserts the DB state was **not** mutated
    (atomicity is the invariant being tested)
  - Release happy path + non-holder rejection
  - **Two concurrency tests**:
    - Two operators race for the same vehicle → exactly one wins, loser
      receives `VehicleAlreadyAssignedError`, loser's `currentVehicleId`
      remains unchanged.
    - One operator races to take two different vehicles → exactly one wins,
      loser receives `OperatorAlreadyHasVehicleError`, loser vehicle stays
      unassigned.

The two concurrency tests prove both sides of the "at most one" invariant
under real contention — the only tests here that couldn't have been done
with fakes.

Controllers, DTOs, and CRUD are not directly unit-tested — they'd either
repeat framework behaviour (class-validator, Nest routing) or verify a
delegation that's obviously correct from the code. Coverage-driven tests are
deliberately avoided.

## Observability

- **Nest `Logger`** with structured levels: `LOG` for normal operations,
  `WARN` for expected-but-noteworthy events (slow HTTP requests, domain
  rule rejections), `ERROR` for unexpected failures with stack traces.
- **`LoggingInterceptor`** wraps every HTTP request with method, URL,
  status/code, and duration. Requests over 500 ms are logged at `WARN`.
- **Change stream watcher and WebSocket gateway** log their own connect /
  disconnect lifecycle events with client id and current count.

See [Evolution notes](#evolution-notes) for the next steps (Prometheus
scrape endpoint, distributed traces, log shipping).

## Contribution workflow

The repo is set up as if a small team is collaborating on it.

- Feature branches, PR-only merges. `main` is protected — CI must be green
  and a Code Owner must approve before merging.
- Commit messages follow **Conventional Commits** with a repo-specific scope
  allowlist (`backend | operator-dashboard | admin-dashboard | repo | ci | docs`),
  enforced locally by a husky `commit-msg` hook and in CI on every PR.
- Local `pre-commit` hook runs Prettier on staged files via `lint-staged`.
- CI runs on every PR only (not on push to `main`): backend typecheck +
  lint + tests, frontend typecheck + build, commit range linting.
- See [`.github/BRANCH_PROTECTION.md`](.github/BRANCH_PROTECTION.md) for the
  one-time GitHub UI settings that turn the ruleset above into hard gates.

## Assumptions & optional paths taken

The prompt allows a few explicit choices — this is what I took:

- **Database**: MongoDB (single-node replica set locally, required for the
  multi-document transactions the fleet-management flow uses).
- **Operators**: seeded on startup via `OperatorsSeed` (`OnApplicationBootstrap`).
  Four fixed operators — no CRUD API. Rationale: keep the surface focused on
  the actual challenge — the assignment lifecycle.
- **Auth**: the prompt allows using an operator id in the request to identify
  who is acting. Implemented as an `X-Operator-Id` HTTP header (not the
  request body), extracted by a custom `@OperatorId()` parameter decorator.
  Rationale: when JWT auth lands, only the decorator body swaps to
  `request.user.operatorId` — controllers and downstream code stay identical.
- **Frontend**: two separate Vite + React apps, one per audience (operators
  and admins). Rationale: different mental model, different eventual auth
  scope, different deploy artefacts. Sharing infra between them is easy;
  merging them would be a lie about who they serve.
- **Real-time**: MongoDB change streams + `@nestjs/event-emitter` +
  socket.io. Change streams as the source of truth means the fan-out is
  captured for every write regardless of who wrote it (service, admin,
  another instance), and horizontal scaling is straightforward — each
  instance runs its own stream, each broadcasts to its own clients.
- **Docker orchestration**: one `docker-compose.yml` at the repo root
  running Mongo. `--wait` on healthcheck means `npm run dev` never races
  the backend against an unready DB.
- **Repository-wide tooling**: root-level husky + lint-staged + commitlint,
  `@commitlint/config-conventional`, GitHub Actions CI on PRs only, PR
  template, CODEOWNERS, documented branch protection recipe.
- **Not implemented**: real auth, response DTOs (controllers return the
  domain entity directly — its shape is flat and already API-appropriate),
  pagination on `GET /vehicles`, structured JSON logs.

## Evolution notes

As the fleet grows, these are the next things I would add, roughly in
priority order.

### Authentication and authorisation

- Move from the `X-Operator-Id` header to a JWT bearer token issued by an
  identity provider. The `@OperatorId()` decorator becomes a one-liner
  reading `request.user.operatorId` — controllers unchanged. Add a
  `JwtAuthGuard` (global with `@Public()` opt-out) and role-based guards
  for admin endpoints. WebSocket handshakes carry the token in
  `socket.handshake.auth.token` and are validated at connection time.

### Consistency & concurrency hardening

- **Partial unique index** on `operators.currentVehicleId` and
  `vehicles.assignedOperatorId` (`partialFilterExpression: { $type: 'objectId' }`) —
  DB-level defence in depth against a hypothetical bug in the rule check.
- **Idempotency keys** on takeover / release so a retried request after a
  network blip is safely no-op instead of racing.
- **Optimistic locking** via a `__v` field on the vehicle if external
  services start writing directly to Mongo.

### Real-time & scaling

- **Socket.io Redis adapter** with sticky-session LB routing once there is
  more than one Nest instance — every instance still runs its own change
  stream, but broadcasts propagate cluster-wide via Redis.
- **Dedicated broadcaster tier** at ~10+ instances: 2–3 instances own the
  change stream and publish to Redis, gateway instances stay thin.
- **Change stream resume tokens** persisted (Redis or Mongo) so a watcher
  restart doesn't drop events between crash and reconnect.
- **Server-side sequence numbers** on WebSocket messages so clients can
  detect gaps and refetch snapshots.

### Observability

- **Prometheus `/metrics` endpoint** (via `@willsoto/nestjs-prometheus`) —
  Node runtime metrics, an `http_request_duration_seconds` histogram, a
  `fleet_assignment_operations_total{operation, outcome}` counter keyed by
  the domain error code, and a `fleet_websocket_connections` gauge from
  the gateway.
- **Structured JSON logs** via Pino → Promtail → Loki for cross-instance
  search; correlation ids via `AsyncLocalStorage`.
- **OpenTelemetry traces** once there is a service boundary worth tracing
  (a dedicated WebSocket tier, an ingestion pipeline).
- **Grafana** dashboards for latency percentiles, takeover success rate by
  outcome code, and live WebSocket count.

### API surface

- **Response DTOs** with a derived `status: 'offline' | 'available' | 'in_use'`
  field so the frontend renders from a single field instead of computing
  from `(connectivityStatus, assignedOperatorId)`.
- **Pagination + filtering** on `GET /vehicles` once the fleet grows past
  a screenful (`?limit`, `?cursor`, `?status`, `?region`).
- **Audit log**: an append-only `assignments` collection recording every
  takeover, release, and connectivity change with actor + timestamp.

### Automation & quality

- **SonarCloud** or **Semgrep** on PRs for code smells and security
  hotspots — mentioned as "for a team of >1", skipped in the take-home to
  avoid adding a service the reviewer would have to spin up.
- **Dependabot** for automated dependency updates.
- **CodeQL** on PRs (free GitHub Actions security scanning).
- **eslint-plugin-boundaries** to programmatically enforce the layer rules
  (`data-access` cannot import from `apis`, etc.) — makes the layering
  discussion structurally enforced rather than convention.
- **HTTP end-to-end test** through the whole stack proving the `code` field
  surfaces to the client for each domain error.
