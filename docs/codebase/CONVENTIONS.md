# Coding Conventions (Repository Observations)

## Core Sections (Required)

### Naming & Structure

- JavaScript service code follows `backend-api/src/...` modular layout (routes, services, middleware).
- Python AI engine follows FastAPI structure in `ai-engine/app/`.

### Error handling

- Backend uses a custom `AppError` (see `backend-api/src/common/appError.js`) and centralized error middleware.

### Logging & Correlation

- `X-Correlation-ID` propagated via `backend-api/src/middleware/correlationId.js`.
- Audit events written to `backend-api/logs/audit-events.ndjson` (PoC append-only store).

### Tests

- Node native `node:test` is used for integration/contract tests (see `backend-api/tests/`).

### Evidence

- `backend-api/src/common/appError.js` — error pattern
- `backend-api/src/middleware/correlationId.js` — correlation propagation
