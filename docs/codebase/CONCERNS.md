# Concerns and Technical Debt

## Core Sections (Required)

### High-Risk Areas

- **Audit data completeness:** Evidence endpoints depend on actual transaction audit traces; fresh environments show `EVIDENCE_NOT_FOUND` behavior. Evidence: `STAGING-DEPLOYMENT-VERIFICATION.md` and integration tests.
- **No root manifest:** No `package.json` at repo root; manifests exist in subfolders (backend-api). This may affect monorepo tools and root-level CI assumptions.
- **Large binary docs:** Large PDF files in `docs/proposal` inflate repository size; consider storing externally or using Git LFS if necessary.

### Improvement Opportunities

- Add root-level CI that runs unit/integration tests for each service and a security scan (prompt-injection patterns).
- Consider migrating audit store from NDJSON to Postgres for production readiness as documented.

### Evidence

- `docs/STAGING-DEPLOYMENT-VERIFICATION.md`
- `backend-api/logs/audit-events.ndjson`
- `docs/proposal/*.pdf`
