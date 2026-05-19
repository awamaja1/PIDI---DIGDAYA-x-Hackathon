# Architecture Overview

## Core Sections (Required)

### Layers and Boundaries

- **API Layer (backend-api)**: Express-based HTTP API that owns DLT interactions and writes audit artifacts.
- **DLT Layer (Besu)**: Hyperledger Besu used for smart contract operations; accessed only via backend API.
- **AI Layer (ai-engine)**: FastAPI service for AI models; communicates with backend via REST for governance context (no direct DLT calls).
- **Audit Store**: File-based NDJSON (`backend-api/logs/audit-events.ndjson`) for PoC; PostgreSQL mentioned in docs for production.

### Data Flow (high-level)

1. Client → Backend API (`/api/v1/tokens/*`) includes `X-Correlation-ID`.
2. Backend orchestrates tokenization, writes audit events to audit store.
3. Governance services read audit store to build evidence bundles and summaries.
4. AI engine requests governance context from backend via REST; AI does not call DLT directly.

### Resiliency & Fallback

- Besu unavailability triggers deterministic fallback path in gateway service; fallback reason is recorded in audit trace.
- Health checks present in `docker-compose.staging.yml` for staging orchestration.

### Evidence

- `backend-api/src/services/besuGatewayService.js`
- `backend-api/src/services/audit/auditStore.js`
- `backend-api/src/services/governance/*`
