# Testing

## Core Sections (Required)

### Test Frameworks and Scripts

- Backend: Node native `node:test` with scripts in `backend-api/tests/` (contract + integration + benchmarks). Evidence: `backend-api/tests/` and `backend-api/package.json` script entries.
- AI engine: pytest or the included `ai-engine/tests` (contract checks). Evidence: `ai-engine/tests/`.

### Test Organization

- `backend-api/tests/contract/` — Contract shape validations for public API responses.
- `backend-api/tests/integration/` — End-to-end flow tests including audit trace, fallback determinism, governance endpoints.

### Benchmarks

- Governance performance benchmarks implemented in `backend-api/tests/governance-benchmarks.js`. Run via `npm run test:bench:governance`.

### Recommendations

- Add CI job to run `pnpm run test:contract` and `pnpm run test:integration` on PRs (I will add a sample workflow).

### Evidence

- `backend-api/tests/` (contract + integration + benchmarks)
