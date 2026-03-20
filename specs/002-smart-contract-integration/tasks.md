# Tasks: Smart Contract Integration via Backend Gateway

**Input**: Design documents from `/specs/002-smart-contract-integration/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required for this feature because `spec.md` defines independent test criteria, deterministic fallback behavior, and audit traceability targets.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare runtime dependencies, configuration, and test harness for Besu gateway work.

- [ ] T001 Add Besu integration dependency `ethers` in `backend-api/package.json`; DoD: `npm install` resolves and lockfile is updated without removing existing scripts.
- [ ] T002 Create gateway environment template in `backend-api/.env.example`; DoD: includes `BESU_RPC_URL`, contract addresses, ABI file paths, and fallback timeout keys.
- [ ] T003 [P] Add API integration test scripts in `backend-api/package.json`; DoD: scripts `test:contract` and `test:integration` point to runnable test entry files.
- [ ] T004 [P] Create test directory scaffold `backend-api/tests/contract/.gitkeep` and `backend-api/tests/integration/.gitkeep`; DoD: both folders exist and are tracked.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared gateway foundation that blocks all user stories until complete.

**CRITICAL**: No user story implementation starts before this phase is done.

- [ ] T005 Create Besu configuration loader in `backend-api/src/config/besu.js`; DoD: validates required env vars and exports typed runtime config object.
- [ ] T006 [P] Create ABI loader utilities in `backend-api/src/services/besu/abiLoader.js`; DoD: ABI JSON is loaded from configured path and contract interface validation errors are explicit.
- [ ] T007 Implement deterministic failure classifier in `backend-api/src/services/besu/failureClassifier.js`; DoD: maps `CONNECTION_ERROR|TIMEOUT|ABI_MISMATCH|UNKNOWN` to stable HTTP/error code policy.
- [ ] T008 [P] Implement fallback response builder in `backend-api/src/services/fallback/deterministicFallback.js`; DoD: identical failure class and operation always produce identical payload shape and status.
- [ ] T009 Implement audit artifact writer in `backend-api/src/services/audit/auditStore.js`; DoD: writes `eventTime, actor, operation, status, correlationId, txReference, fallbackReason` for each gateway attempt.
- [ ] T010 [P] Extend route registration in `backend-api/src/api/routes/index.js`; DoD: mounts new `tokens` and `audit` routers under `/api/v1` without breaking health route.
- [ ] T011 Add shared gateway service façade in `backend-api/src/services/besuGatewayService.js`; DoD: exposes `tokenize`, `updateStatus`, `verifyStatus` methods using config, classifier, fallback, and audit writer.
- [ ] T012 [P] Add AI-DLT boundary guard test in `ai-engine/tests/test_no_direct_dlt_calls.py`; DoD: test fails if ai-engine imports `web3`, `ethers`, or Besu JSON-RPC endpoints directly.

**Checkpoint**: Foundational gateway, deterministic fallback core, audit core, and AI-DLT boundary guard are ready.

---

## Phase 3: User Story 1 - Petani Tokenisasi Panen ke Besu (Priority: P1) 🎯 MVP

**Goal**: Petani can submit tokenization and receive either on-chain success or deterministic fallback through backend gateway.

**Independent Test**: Submit valid tokenize request and verify success path (Besu up) and deterministic fallback path (Besu down) with consistent correlation ID propagation.

### Tests for User Story 1

- [ ] T013 [P] [US1] Add contract test for `POST /api/v1/tokens/tokenize` in `backend-api/tests/contract/tokenize.contract.test.js`; DoD: validates request/response schema from `contracts/backend-gateway-contract.yaml` for 200 and 503.
- [ ] T014 [P] [US1] Add integration success test for tokenize flow in `backend-api/tests/integration/tokenize.success.test.js`; DoD: asserts `status=SUCCESS`, `txReference` present, and response `correlationId` equals header.
- [ ] T015 [P] [US1] Add deterministic fallback repeat-run test in `backend-api/tests/integration/tokenize.fallback.deterministic.test.js`; DoD: three identical Besu-down requests produce same HTTP status, `errorCode`, and payload shape.
- [ ] T016 [US1] Add correlation audit trace assertion test for tokenize in `backend-api/tests/integration/tokenize.audit-trace.test.js`; DoD: verifies audit artifact contains same correlation ID and tokenization operation record.

### Implementation for User Story 1

- [ ] T017 [P] [US1] Create tokenize request validator in `backend-api/src/api/validators/tokenizeRequest.js`; DoD: enforces `batchId`, `commodityCode`, `harvestQuantityKg`, and `referenceValueIdr` constraints.
- [ ] T018 [US1] Implement Besu mint operation in `backend-api/src/services/besu/mintToken.js`; DoD: calls `GarudaLinkTokenization.mintToken(...)` and returns `txReference` + `tokenId` on success.
- [ ] T019 [US1] Implement tokenize controller in `backend-api/src/api/routes/tokens.js`; DoD: handles `POST /tokens/tokenize`, calls gateway service, and returns deterministic fallback when Besu unavailable.
- [ ] T020 [US1] Integrate tokenize audit writing in `backend-api/src/services/besuGatewayService.js`; DoD: success and fallback both persist required audit fields.

**Checkpoint**: US1 is independently demoable as MVP.

---

## Phase 4: User Story 2 - Bank Mitra Update dan Verifikasi Status Token (Priority: P2)

**Goal**: Bank can update token lifecycle state and verify on-chain status through backend gateway.

**Independent Test**: With an existing token, update status then verify returned status is consistent with contract read, including deterministic fallback behavior for Besu failure.

### Tests for User Story 2

- [ ] T021 [P] [US2] Add contract test for `PATCH /api/v1/tokens/{tokenId}/status` in `backend-api/tests/contract/update-status.contract.test.js`; DoD: validates 200, 404, and 503 response shapes against contract.
- [ ] T022 [P] [US2] Add contract test for `GET /api/v1/tokens/{tokenId}/verify` in `backend-api/tests/contract/verify-status.contract.test.js`; DoD: validates 200 and 503 response shapes against contract.
- [ ] T023 [P] [US2] Add integration success test for update and verify flow in `backend-api/tests/integration/update-verify.success.test.js`; DoD: confirms backend status equals on-chain status for same token.
- [ ] T024 [US2] Add deterministic fallback test for update and verify operations in `backend-api/tests/integration/update-verify.fallback.deterministic.test.js`; DoD: repeated identical failure class yields stable status and payload shape.

### Implementation for User Story 2

- [ ] T025 [P] [US2] Create update status validator in `backend-api/src/api/validators/updateStatusRequest.js`; DoD: enforces `newStatus` enum and `reason` required.
- [ ] T026 [US2] Implement registry update operation in `backend-api/src/services/besu/updateTokenStatus.js`; DoD: maps domain errors `TOKEN_NOT_FOUND` and `INVALID_STATUS_TRANSITION` consistently.
- [ ] T027 [US2] Implement registry read operation in `backend-api/src/services/besu/getTokenStatus.js`; DoD: returns deterministic verification payload with token status fields.
- [ ] T028 [US2] Extend token routes in `backend-api/src/api/routes/tokens.js`; DoD: adds `PATCH /tokens/:tokenId/status` and `GET /tokens/:tokenId/verify` using gateway service and error policy.
- [ ] T029 [US2] Extend gateway service orchestration in `backend-api/src/services/besuGatewayService.js`; DoD: both operations write audit records with consistent correlation ID.

**Checkpoint**: US2 is independently testable after US1 foundation.

---

## Phase 5: User Story 3 - Regulator Audit Jejak End-to-End (Priority: P3)

**Goal**: Regulator can retrieve correlation-id based audit traces covering success and fallback decisions.

**Independent Test**: Query one correlation ID and verify complete event chain from request to contract/fallback metadata is returned consistently.

### Tests for User Story 3

- [ ] T030 [P] [US3] Add contract test for `GET /api/v1/audit/traces/{correlationId}` in `backend-api/tests/contract/audit-trace.contract.test.js`; DoD: response matches `AuditTraceResponse` schema in contract.
- [ ] T031 [P] [US3] Add integration test for end-to-end trace retrieval in `backend-api/tests/integration/audit-trace.success.test.js`; DoD: events include tokenization/update/verify operations linked by same correlation ID.
- [ ] T032 [US3] Add fallback incident trace test in `backend-api/tests/integration/audit-trace.fallback.test.js`; DoD: trace includes deterministic fallback reason and operation impact fields.

### Implementation for User Story 3

- [ ] T033 [P] [US3] Implement audit query service in `backend-api/src/services/audit/getTraceByCorrelationId.js`; DoD: returns ordered events by `eventTime` and supports empty-result handling.
- [ ] T034 [US3] Implement audit trace route in `backend-api/src/api/routes/audit.js`; DoD: exposes `GET /audit/traces/:correlationId` with correlation pattern validation.
- [ ] T035 [US3] Update route registration for audit endpoint in `backend-api/src/api/routes/index.js`; DoD: route is reachable under `/api/v1/audit/traces/:correlationId`.
- [ ] T036 [US3] Add compliance tags mapping in `backend-api/src/services/audit/auditStore.js`; DoD: persisted records include relevant CR tags (`CR-001`, `CR-004`, `CR-005`) when applicable.

**Checkpoint**: US3 audit review is independently demoable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Stabilize performance, evidence, and implementation readiness across all stories.

- [ ] T037 [P] Add deterministic fallback regression script in `backend-api/scripts/verify-fallback-determinism.ps1`; DoD: executes repeated Besu-down calls and prints pass/fail for status/code/payload-shape equality.
- [ ] T038 [P] Add correlation-id audit trail verification script in `backend-api/scripts/verify-correlation-audit.ps1`; DoD: validates one correlation ID maps to full event chain across operations.
- [ ] T039 Update quickstart execution evidence section in `specs/002-smart-contract-integration/quickstart.md`; DoD: documents exact commands and expected outputs for SC-001..SC-004 and PSC-001..PSC-003.
- [ ] T040 Add architecture boundary evidence note in `specs/002-smart-contract-integration/research.md`; DoD: records concrete proof steps showing no direct AI->DLT path in runtime and tests.
- [ ] T041 Run end-to-end PoC stability checklist update in `specs/002-smart-contract-integration/checklists/requirements.md`; DoD: marks pass/fail evidence links for 3 consecutive successful runs and deterministic fallback checks.

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 -> required before Phase 2.
- Phase 2 -> blocks all user story phases.
- Phase 3 (US1) -> MVP priority and prerequisite for realistic US2/US3 demo data.
- Phase 4 (US2) -> depends on Phase 2, can begin after US1 service contracts are stable.
- Phase 5 (US3) -> depends on Phase 2 and benefits from US1/US2 traces.
- Phase 6 -> depends on completion of targeted user stories.

### User Story Dependencies

- US1 (P1): starts immediately after Phase 2.
- US2 (P2): depends on foundational gateway and token routes from US1 for end-to-end token lifecycle context.
- US3 (P3): depends on foundational audit store and completed trace-producing flows from US1/US2.

### Critical Path

- T001 -> T005 -> T007 -> T008 -> T009 -> T011 -> T018 -> T019 -> T020 -> T026 -> T028 -> T029 -> T033 -> T034 -> T037 -> T041

---

## Parallel Opportunities

### US1 Parallel Example

- Run in parallel: T013, T014, T015 (separate test files).
- Run in parallel: T017 and T018 (validator and service operation in different files).

### US2 Parallel Example

- Run in parallel: T021 and T022 (independent contract tests).
- Run in parallel: T025 and T027 (validator and read operation in different files).

### US3 Parallel Example

- Run in parallel: T030 and T031 (contract vs integration tests).
- Run in parallel: T033 and T036 (query service and audit tagging enhancement touch different modules).

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) and execute T013-T016 tests.
3. Demo tokenization success + deterministic fallback with audit trace.

### Incremental Delivery

1. Add US2 update/verify flows and validate consistency.
2. Add US3 regulator audit endpoint and fallback trace evidence.
3. Finish Phase 6 scripts/checklists for hackathon readiness.

### Notes

- `[P]` means safe parallelization with different files and no unfinished dependencies.
- Every task includes a concrete file path and objective Definition of Done.
- Architecture constitution is preserved: no direct AI->DLT call is introduced; DLT ownership remains in backend gateway.
