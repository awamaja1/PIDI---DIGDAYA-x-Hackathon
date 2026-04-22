# Rencana Implementasi: Enhanced Compliance & Governance untuk GARUDA-LINK

**Branch**: `003-enhanced-compliance-governance` | **Tanggal**: 2026-04-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification dari `/specs/003-enhanced-compliance-governance/spec.md`
**Changelog**: Lihat [CHANGELOG.md](../../CHANGELOG.md) untuk ringkasan rilis terbaru.

## Ringkasan

Fitur ini menambahkan lapisan governance di atas fondasi Feature 002 melalui evidence bundle terstruktur, governance control summary, dan release readiness checklist berbasis evidence. Fokusnya adalah meningkatkan audit readiness tanpa mengubah boundary arsitektur yang sudah berjalan (AI tidak boleh direct call ke DLT).

## Technical Context

**Language/Version**: Node.js 20 (backend-api), Python 3.11 (ai-engine boundary guard), Markdown/JSON evidence artifacts  
**Primary Dependencies**: express middleware stack existing, audit logging existing, correlation-id propagation existing  
**Storage**: File/log-based audit artifacts (PoC), tanpa menambah database baru pada iterasi ini  
**Testing**: integration tests backend, deterministic fallback checks, evidence consistency checks, ai boundary checks  
**Target Platform**: Local demo environment (Windows/WSL/Linux) dengan backend-api sebagai gateway tunggal DLT  
**Project Type**: Hybrid web-service + compliance evidence layer  
**Performance Goals**: 95% request evidence bundle <= 3 detik pada volume data PoC  
**Constraints**: No direct AI->DLT call, output governance wajib traceable ke correlation ID, kompatibel dengan audit pipeline Feature 002  
**Scale/Scope**: PoC readiness untuk Regulator, Ops, dan Product Owner

## Constitution Check

*GATE: dievaluasi sebelum Phase 0 research, dievaluasi ulang setelah Phase 1 design.*

### Gate 1 - Anti-Vibe Coding Berbasis Spesifikasi

**Status**: PASS

- Requirement FR-001..FR-007, NFR-001..NFR-004, CR-001..CR-004, HA-001..HA-003 diturunkan ke rencana fase implementasi.
- Output plan ini disiapkan sebagai input task breakdown implementasi.

### Gate 2 - Kepatuhan Regulasi SNAP BI dan UU PDP

**Status**: PASS

- Evidence bundle menekankan auditability, minimisasi data pribadi, dan trace akses.
- Kontrol readiness security dipetakan agar dapat diverifikasi independen.

### Gate 3 - Arsitektur Hibrida Modular AI-DLT

**Status**: PASS

- Iterasi tidak mengubah ownership DLT: backend tetap single gateway.
- AI engine tetap bounded context terpisah.

### Gate 4 - Fokus PoC Stabil untuk Hackathon

**Status**: PASS

- Scope dibatasi pada governance layer berbasis artefak yang sudah ada.
- Non-goals eksplisit: tidak ada SIEM enterprise penuh, tidak ada re-architecture total.

### Gate Decision

Semua gate PASS. Lanjut ke Phase 0 dan Phase 1.

## Project Structure

### Documentation (fitur ini)

```text
specs/003-enhanced-compliance-governance/
├── spec.md
├── plan.md
├── research.md (next)
├── data-model.md (next)
├── quickstart.md (next)
└── tasks.md (dibuat pada tahap task generation)
```

### Source Code (target area)

```text
backend-api/
├── src/
│   ├── services/
│   │   ├── audit*                  # evidence source existing
│   │   └── governance*             # new: governance aggregation/checklist
│   ├── api/routes/
│   │   └── governance*             # new: summary/evidence endpoints
│   └── middleware/
│       └── correlationId*          # existing propagation
├── tests/
│   ├── integration*                # extend with governance scenarios
│   └── contract*                   # extend response shape checks
└── scripts/
    └── verify-*                    # extend verification for governance outputs
```

**Structure Decision**: Menambah service/route governance di backend-api dengan reuse audit pipeline existing agar perubahan tetap minimal dan terkontrol.

## Rencana Fase Implementasi

### Phase 0 - Research & Clarification

1. Tetapkan format evidence bundle final (JSON-only vs JSON+human-readable).
2. Tentukan granularity governance summary (harian, per-rilis, atau keduanya).
3. Definisikan threshold pass/warn/fail untuk setiap domain kontrol.

### Phase 1 - Design

1. Definisikan schema evidence bundle (`correlationId`, operation, status, fallback reason, compliance tags, references).
2. Definisikan schema governance summary agregat per periode.
3. Definisikan schema release readiness checklist berbasis evidence.
4. Tetapkan mapping requirement -> control -> evidence fields (traceability matrix lightweight).

### Phase 2 - Implementation

1. Tambah service `governance` di backend untuk:
   - generate evidence bundle by `correlationId`
   - aggregate control status per period
   - evaluate readiness checklist
2. Tambah endpoint governance:
   - `GET /api/v1/governance/evidence/{correlationId}`
   - `GET /api/v1/governance/summary`
   - `GET /api/v1/governance/release-readiness`
3. Integrasikan output dengan audit artifacts existing tanpa duplikasi data tidak perlu.

### Phase 3 - Validation

1. Uji evidence consistency untuk `correlationId` yang sama (idempotent read).
2. Uji fallback case tetap menghasilkan evidence yang valid.
3. Uji drill-down kontrol warn/fail menampilkan transaksi terdampak.
4. Uji readiness checklist memiliki tautan evidence untuk setiap item.

### Phase 4 - Documentation & Handover

1. Tambah quickstart validasi governance.
2. Tambah data-model ringkas untuk governance artifacts.
3. Perbarui changelog setelah implementasi selesai.

## Test Strategy

1. **Contract Tests**: validasi bentuk response endpoint governance.
2. **Integration Tests**: skenario sukses + fallback + mixed outcomes.
3. **Determinism Checks**: evidence bundle untuk input identik harus identik.
4. **Traceability Checks**: checklist item wajib punya pointer ke evidence source.

## Risks & Mitigations

- **Risk**: Data audit parsial menyebabkan summary bias.  
  **Mitigation**: tandai confidence/status incomplete pada summary.
- **Risk**: Over-collection data melanggar minimisasi.  
  **Mitigation**: whitelist field evidence dan review CR-002.
- **Risk**: Checklist menjadi manual override-heavy.  
  **Mitigation**: default derive from evidence, override dibatasi dan diaudit.

## Exit Criteria

- Endpoint governance tersedia dan lolos contract/integration tests.
- Evidence bundle valid untuk skenario sukses dan fallback.
- Governance summary dan release readiness checklist dapat digunakan sebagai dasar go/no-go internal.
- Boundary AI-DLT tetap terjaga tanpa regressions.

## Post-Design Constitution Re-check (Phase 1)

**Status**: PASS (planned)

- Gate 1: traceability requirement ke output governance terdefinisi.
- Gate 2: kontrol compliance terpetakan ke evidence field.
- Gate 3: arsitektur hybrid tetap konsisten.
- Gate 4: scope PoC terjaga, tidak melebar ke enterprise observability.
