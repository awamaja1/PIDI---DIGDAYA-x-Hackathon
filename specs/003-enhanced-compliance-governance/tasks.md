# Tasks: Enhanced Compliance & Governance

**Input**: Design documents from `/specs/003-enhanced-compliance-governance/`  
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`

**Tests**: Required for this feature because `spec.md` defines independent test criteria for evidence determinism, governance summary accuracy, and release readiness traceability.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Menyiapkan fondasi endpoint governance dan baseline testing.

- [ ] T001 Add governance route scaffold in `backend-api/src/api/routes/governance.js`; DoD: route file exists and exports router instance.
- [ ] T002 [P] Register governance router in `backend-api/src/api/routes/index.js`; DoD: `/api/v1/governance` path mounted without breaking existing routes.
- [ ] T003 [P] Create governance service directory in `backend-api/src/services/governance/`; DoD: folder and index export ready for service wiring.
- [ ] T004 Create governance test scaffolding in `backend-api/tests/contract/governance.contract.test.js` and `backend-api/tests/integration/governance.integration.test.js`; DoD: tests runnable with placeholder assertions.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Bangun komponen inti evidence, summary, dan checklist derivation.

**CRITICAL**: No user story implementation starts before this phase is done.

- [ ] T005 Implement evidence bundle builder in `backend-api/src/services/governance/buildEvidenceBundle.js`; DoD: builds deterministic JSON payload from `correlationId` using existing audit source.
- [ ] T006 [P] Implement governance status classifier in `backend-api/src/services/governance/classifyControlStatus.js`; DoD: maps domain results into `pass|warn|fail` consistently.
- [ ] T007 [P] Implement evidence field whitelist filter in `backend-api/src/services/governance/minimizeEvidenceFields.js`; DoD: strips non-whitelisted sensitive fields to enforce CR-002.
- [ ] T008 Implement summary aggregator in `backend-api/src/services/governance/buildGovernanceSummary.js`; DoD: supports `period=daily` and `period=release` with `overall_status` derived from domain worst-case.
- [ ] T009 [P] Implement readiness checklist evaluator in `backend-api/src/services/governance/evaluateReleaseReadiness.js`; DoD: derives checklist items from evidence and summary with mandatory `evidence_ref`.
- [ ] T010 Implement governance service façade in `backend-api/src/services/governance/index.js`; DoD: exposes `getEvidenceBundle`, `getSummary`, and `getReleaseReadiness` methods.

**Checkpoint**: Core governance logic is available and reusable across all user stories.

---

## Phase 3: User Story 1 - Regulator Meninjau Evidence Bundle (Priority: P1) 🎯 MVP

**Goal**: Regulator dapat mengambil evidence bundle terstruktur berdasarkan `correlationId` untuk skenario sukses maupun fallback.

**Independent Test**: Retrieve evidence bundle for one successful and one fallback transaction; verify deterministic structure, required fields, and compliance tags.

### Tests for User Story 1

- [ ] T011 [P] [US1] Add contract test for `GET /api/v1/governance/evidence/{correlationId}` in `backend-api/tests/contract/governance-evidence.contract.test.js`; DoD: response shape validates required fields for success and fallback.
- [ ] T012 [P] [US1] Add integration test for evidence success case in `backend-api/tests/integration/governance-evidence.success.test.js`; DoD: contains transaction metadata, audit trace, and compliance tags.
- [ ] T013 [US1] Add integration test for evidence fallback case in `backend-api/tests/integration/governance-evidence.fallback.test.js`; DoD: includes fallback reason and deterministic context fields.
- [ ] T014 [US1] Add determinism test for repeated evidence query in `backend-api/tests/integration/governance-evidence.determinism.test.js`; DoD: same `correlationId` returns identical payload across repeated reads.

### Implementation for User Story 1

- [ ] T015 [P] [US1] Implement evidence endpoint handler in `backend-api/src/api/routes/governance.js`; DoD: `GET /evidence/:correlationId` returns deterministic bundle or not-found domain response.
- [ ] T016 [US1] Add correlation ID validator in `backend-api/src/api/validators/correlationId.js`; DoD: enforces `GARUDA-<uuid>` format for governance queries.
- [ ] T017 [US1] Integrate compliance tags enrichment in `backend-api/src/services/governance/buildEvidenceBundle.js`; DoD: tags include relevant `CR-*` indicators when available.

**Checkpoint**: US1 independently demoable as MVP.

---

## Phase 4: User Story 2 - Ops Melihat Governance Summary (Priority: P2)

**Goal**: Ops dapat melihat ringkasan kontrol governance harian/per-rilis dengan drill-down masalah.

**Independent Test**: Query summary for `period=daily` and `period=release`; verify domain statuses and affected transaction references.

### Tests for User Story 2

- [ ] T018 [P] [US2] Add contract test for `GET /api/v1/governance/summary` in `backend-api/tests/contract/governance-summary.contract.test.js`; DoD: validates `period`, `overall_status`, and `control_domains` schema.
- [ ] T019 [P] [US2] Add integration test for daily summary in `backend-api/tests/integration/governance-summary.daily.test.js`; DoD: returns aggregated statuses with evidence coverage.
- [ ] T020 [US2] Add integration test for release summary in `backend-api/tests/integration/governance-summary.release.test.js`; DoD: supports release key and consistent domain status derivation.
- [ ] T021 [US2] Add integration test for warn/fail drill-down in `backend-api/tests/integration/governance-summary.drilldown.test.js`; DoD: includes `affected_correlations` and `evidence_refs` for warn/fail domains.

### Implementation for User Story 2

- [ ] T022 [P] [US2] Implement summary endpoint handler in `backend-api/src/api/routes/governance.js`; DoD: `GET /summary` accepts `period` and optional `key` query params.
- [ ] T023 [US2] Extend summary aggregator logic in `backend-api/src/services/governance/buildGovernanceSummary.js`; DoD: applies threshold rules and confidence handling for partial audit data.
- [ ] T024 [US2] Add domain mapping utility in `backend-api/src/services/governance/mapControlDomains.js`; DoD: computes statuses for `AUDIT_TRACE`, `FALLBACK_DETERMINISM`, `DATA_PROTECTION`, `SECURITY_READINESS`.

**Checkpoint**: US2 independently testable after US1.

---

## Phase 5: User Story 3 - PO Menjalankan Release Readiness (Priority: P3)

**Goal**: PO dapat mengambil readiness checklist berbasis evidence untuk keputusan go/no-go.

**Independent Test**: Generate checklist for one release candidate and verify each item has evidence reference and computed status.

### Tests for User Story 3

- [ ] T025 [P] [US3] Add contract test for `GET /api/v1/governance/release-readiness` in `backend-api/tests/contract/governance-readiness.contract.test.js`; DoD: validates checklist item fields and decision enum.
- [ ] T026 [P] [US3] Add integration test for readiness derivation in `backend-api/tests/integration/governance-readiness.derivation.test.js`; DoD: checklist statuses derive from evidence and summary, not manual input.
- [ ] T027 [US3] Add integration test for fail-critical decision logic in `backend-api/tests/integration/governance-readiness.decision.test.js`; DoD: critical fail forces `NO_GO`.
- [ ] T028 [US3] Add integration test for override traceability in `backend-api/tests/integration/governance-readiness.override.test.js`; DoD: override includes actor, reason, timestamp, and original evidence trace.

### Implementation for User Story 3

- [ ] T029 [P] [US3] Implement readiness endpoint handler in `backend-api/src/api/routes/governance.js`; DoD: `GET /release-readiness` accepts release candidate key.
- [ ] T030 [US3] Implement checklist item generator in `backend-api/src/services/governance/evaluateReleaseReadiness.js`; DoD: every item includes mandatory `evidence_ref`.
- [ ] T031 [US3] Implement decision rules utility in `backend-api/src/services/governance/decideGoNoGo.js`; DoD: returns `GO|CONDITIONAL_GO|NO_GO` based on checklist severities and statuses.

**Checkpoint**: US3 independently testable after US1+US2 core logic.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Stabilize quality, observability, and documentation for handover readiness.

- [ ] T032 [P] Add governance verification script in `backend-api/scripts/verify-governance-evidence.ps1`; DoD: checks deterministic evidence and required fields for sample `correlationId`.
- [ ] T033 [P] Add governance summary verification script in `backend-api/scripts/verify-governance-summary.ps1`; DoD: validates domain status completeness and worst-case overall status derivation.
- [ ] T034 Update quickstart docs in `specs/003-enhanced-compliance-governance/quickstart.md`; DoD: includes run commands and expected outputs for US1-US3 validations.
- [ ] T035 Add requirement checklist in `specs/003-enhanced-compliance-governance/checklists/requirements.md`; DoD: maps FR/NFR/CR/HA to concrete test evidence links.
- [ ] T036 Run architecture boundary regression test in `ai-engine/tests/test_no_direct_dlt_calls.py`; DoD: confirms Feature 003 introduces no AI->DLT direct dependency.

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 -> required before Phase 2.
- Phase 2 -> blocks all user story phases.
- Phase 3 (US1) -> MVP priority.
- Phase 4 (US2) -> depends on Phase 2 and benefits from US1 evidence primitives.
- Phase 5 (US3) -> depends on Phase 2 and summary logic from US2.
- Phase 6 -> depends on completion of targeted user stories.

### User Story Dependencies

- US1 (P1): starts immediately after Phase 2.
- US2 (P2): depends on core evidence model and summary aggregator.
- US3 (P3): depends on evidence and summary outputs to derive checklist decisions.

### Critical Path

- T001 -> T005 -> T007 -> T008 -> T010 -> T015 -> T017 -> T022 -> T023 -> T029 -> T030 -> T031 -> T032 -> T035

---

## Parallel Opportunities

### US1 Parallel Example

- Run in parallel: T011, T012, T013 (independent test files).
- Run in parallel: T015 and T016 (route handler and validator touch different files).

### US2 Parallel Example

- Run in parallel: T018 and T019 (contract and integration tests).
- Run in parallel: T022 and T024 (endpoint handler and domain mapping utility).

### US3 Parallel Example

- Run in parallel: T025 and T026 (contract and derivation integration tests).
- Run in parallel: T029 and T031 (route endpoint and decision utility).

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) and run T011-T014.
3. Demo deterministic evidence retrieval for success + fallback scenarios.

### Incremental Delivery

1. Add US2 governance summary and drill-down.
2. Add US3 release readiness with decision rules.
3. Complete Phase 6 scripts and docs for handover readiness.

### Notes

- `[P]` means safe parallelization with different files and no unfinished dependencies.
- Every task includes concrete path and definition of done.
- Architecture boundary remains unchanged: no direct AI->DLT path is introduced.
