# GARUDA-LINK Living Spec Memory

Last Updated: 2026-03-20
Source Branch Baseline: main
Reference Merge: PR #1 (`001-define-garuda-link-baseline` -> `main`)

## Purpose
Dokumen ini adalah baseline spesifikasi hidup (living spec) setelah merge ke `main`.
Untuk perubahan berikutnya, source code pada `main` dianggap ground truth, lalu spec diperbarui sebagai delta agar tidak terjadi spec drift.

## Ground Truth (Current System on main)

### Implemented (Verified)
- AI Engine FastAPI skeleton aktif dengan endpoint:
  - `GET /health`
  - `POST /predict/price`
  - `POST /optimize/route`
- Kontrak schema Pydantic tersedia untuk request/response AI:
  - validasi `correlation_id` pattern: `^GARUDA-[0-9a-f-]{36}$`
  - model prediksi harga, optimasi rute, error data quality
- Stub deterministik aktif untuk AI Layer (PoC mode):
  - forecast stub (`XGBoost-LSTM` metadata + output deterministik)
  - route optimization stub (`GA`/`GA+PPO+GNN` metadata + output deterministik)
- Test kontrak API AI berjalan dan lulus (6 test):
  - deterministic responses
  - missing/invalid correlation handling
  - insufficient history data quality error handling
- CI workflow untuk AI Engine aktif di GitHub Actions:
  - install dependency
  - run unittest dari module root `ai-engine`

### Scope Exclusion (Intentional)
- Perubahan dokumen biner (`docs/*`) tidak termasuk dalam PR implementasi AI layer.
- Perubahan dokumen proposal dapat dipertahankan lokal-only sesuai kebutuhan pengguna.

## Traceability Snapshot (Plan/Tasks -> Code)

### Completed in merged iteration
- T008: hardened mock verification script (backend)
- T009: bootstrap FastAPI AI service
- T010: schema contracts implementation
- T011: deterministic forecast stub
- T012: deterministic route stub
- T013: inference routers
- (T014 equivalent): deterministic contract tests implemented as `test_api_contracts.py`

### Not yet completed from broader plan
- Blockchain task phase (T015+)
- Frontend dashboard task phase (T021+)
- Full model implementation beyond deterministic stubs

## Compliance Position (Current)
- Anti-vibe coding: enforced at PoC scope via contract-driven implementation and tests.
- AI-DLT boundary: currently respected (AI service internal, no direct blockchain RPC call in AI layer).
- Security controls SNAP BI/UU PDP: designed to be enforced at backend gateway boundary; not fully implemented in AI layer itself.

## Spec Drift Guardrails (Operational)
For every future merge to `main`:
1. Identify delta between merged code and active spec artifacts.
2. Update this file (`.specify/memory/spec.md`) with:
   - implemented features
   - deferred items
   - compliance-impact notes
3. Ensure 2-way binding:
   - code change references requirement/contract
   - spec reflects real behavior already shipped

## Next Iteration Protocol (Recommended)
Untuk fitur lanjutan (contoh: smart contract Hyperledger Besu nyata):
1. Buat branch fitur baru, misal `002-smart-contract-integration`.
2. Jalankan siklus SDD penuh:
   - `/speckit.specify`
   - `/speckit.plan`
   - `/speckit.tasks`
   - `/speckit.implement`
3. Setelah merge, update dokumen ini sebagai post-merge delta memory.

## Small Fix / Bugfix Protocol
Untuk bugfix atau perubahan kecil:
1. Perbaiki kode langsung sesuai kebutuhan.
2. Setelah fix stabil, perbarui dokumen ini ringkas:
   - apa berubah
   - dampak kontrak/API
   - dampak test/compliance
3. Hindari membuat spec baru besar jika perubahan tidak menambah scope fitur.

## Notes on Tooling
Jika command komunitas seperti `/speckit.archive.run` tersedia di environment, gunakan untuk otomatisasi konsolidasi delta.
Jika tidak tersedia, pembaruan manual file ini menjadi sumber memori proyek yang sah.
