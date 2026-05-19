# Integrations

## Core Sections (Required)

### External Systems

- **Hyperledger Besu** — Smart contract platform for tokenization (accessed via backend only). Evidence: `docker-compose.staging.yml`, `backend-api/src/services/besuGatewayService.js`.
- **AI Engine (Internal)** — FastAPI service used for pricing/optimization; integrates via REST calls to backend governance endpoints. Evidence: `ai-engine/app/services/governance_aware_pricing.py`.
- **Audit Storage** — PoC NDJSON file at `backend-api/logs/audit-events.ndjson`; production notes mention PostgreSQL for audit logs. Evidence: `DEPLOYMENT.md`, `specs/*`.

### Observations

- No direct AI -> DLT interactions (design constraint HA-001). All DLT calls are mediated by backend API.
- Correlation ID propagated end-to-end for traceability across integrations.

### Evidence

- `backend-api/src/services/besuGatewayService.js`
- `ai-engine/app/services/governance_aware_pricing.py`
- `backend-api/logs/audit-events.ndjson`
