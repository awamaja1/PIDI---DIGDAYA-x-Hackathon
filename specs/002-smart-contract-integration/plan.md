# Rencana Implementasi: Integrasi Smart Contract Besu untuk Tokenisasi GARUDA-LINK

**Branch**: `002-smart-contract-integration` | **Tanggal**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification dari `/specs/002-smart-contract-integration/spec.md`
**Changelog**: Lihat [CHANGELOG.md](../../CHANGELOG.md) untuk ringkasan rilis terbaru.

## Ringkasan

Fitur ini mengimplementasikan integrasi nyata backend gateway ke smart contract Besu untuk alur mint token, update status, dan verifikasi status token quasi-collateral, dengan fallback deterministik saat Besu tidak tersedia. Batas arsitektur wajib dijaga: AI engine tidak boleh memanggil DLT secara langsung, seluruh interaksi DLT hanya melalui backend-api.

## Technical Context

**Language/Version**: Node.js 20 (backend-api), Python 3.11 (ai-engine boundary), Solidity ABI on Hyperledger Besu QBFT  
**Primary Dependencies**: express, dotenv, middleware correlation-id/error-handler/aes256; planned integration adapter ethers.js 6  
**Storage**: Structured audit artifacts (file/log based for PoC), no new DB introduced in this feature design  
**Testing**: backend route/contract tests, fallback determinism repeat-run checks, existing ai-engine pytest remains  
**Target Platform**: Local demo environment on Windows/WSL/Linux with backend-api as gateway and Besu local endpoint  
**Project Type**: Hybrid web-service (backend gateway + ai-engine + Besu)  
**Performance Goals**: 95% request tokenize/update/verify <= 6s; successful end-to-end flow 3 times consecutively  
**Constraints**: No direct AI->DLT call, deterministic fallback for identical Besu failures, SNAP BI + UU PDP control evidence  
**Scale/Scope**: Hackathon PoC scope for Petani/Bank Mitra/Regulator token lifecycle and audit trace

## Constitution Check

*GATE: dievaluasi sebelum Phase 0 research, dievaluasi ulang setelah Phase 1 design.*

### Gate 1 - Anti-Vibe Coding Berbasis Spesifikasi

**Status**: PASS

- Requirement yang dicakup: FR-001..FR-009, NFR-001..NFR-005, CR-001..CR-005, HA-001..HA-003.
- Traceability disiapkan pada artefak: plan, research, data-model, contracts, quickstart.
- Siap diturunkan ke task IDs pada `/speckit.tasks`.

### Gate 2 - Kepatuhan Regulasi SNAP BI dan UU PDP

**Status**: PASS

- Kontrol direncanakan: autentikasi/otorisasi API, integritas pesan, audit log, AES-256 baseline protection.
- Bukti verifikasi ditetapkan dalam quickstart dan contract-level acceptance checks.

### Gate 3 - Arsitektur Hibrida Modular AI-DLT

**Status**: PASS

- Backend-api menjadi satu-satunya owner operasi DLT (mint/update/read).
- AI engine tetap bounded context terpisah, tanpa akses langsung ke Besu.
- Kontrak antarmuka didokumentasikan pada folder `contracts/`.

### Gate 4 - Fokus PoC Stabil untuk Hackathon

**Status**: PASS

- Scope dibatasi pada flow inti tokenisasi, update status, verifikasi status, audit trace.
- Fallback deterministik dipertahankan sebagai jalur degradasi resmi.
- Non-goals dijaga: tanpa direct AI->DLT, tanpa produksi Besu multi-org, tanpa HSM enterprise.

### Gate Decision

Semua gate PASS. Lanjut ke Phase 0 dan Phase 1.

## Project Structure

### Documentation (fitur ini)

```text
specs/002-smart-contract-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── backend-gateway-contract.yaml
│   └── besu-gateway-contract.md
└── tasks.md (dibuat oleh /speckit.tasks)
```

### Source Code (repository root)

```text
backend-api/
├── server.js
├── src/
│   ├── app.js
│   ├── api/routes/
│   │   ├── index.js
│   │   ├── health.js
│   │   └── mock.js
│   ├── middleware/
│   │   ├── correlationId.js
│   │   ├── aes256Dummy.js
│   │   └── errorHandler.js
│   └── mock/
│       ├── mockServer.js
│       └── data/
└── scripts/

ai-engine/
├── app/
│   ├── main.py
│   ├── routers/
│   ├── schemas/
│   └── services/
└── tests/
```

**Structure Decision**: Tetap memakai struktur existing multi-module. Integrasi DLT ditempatkan di backend-api agar boundary AI-DLT tetap patuh konstitusi.

## Alur Integrasi (Backend Gateway Only)

1. Client mengirim request tokenisasi/update/verifikasi ke backend-api dengan `X-Correlation-ID`.
2. Backend memvalidasi payload dan memastikan correlation ID tersedia.
3. Backend melakukan health check adapter Besu.
4. Jika Besu tersedia: backend mengeksekusi ABI calls `mint`, `updateStatus`, `getTokenStatus`.
5. Jika Besu tidak tersedia: backend mengembalikan fallback deterministik dengan schema dan error code konsisten.
6. Backend menulis audit artifacts minimum (waktu, aktor, operasi, status, correlation ID, tx/fallback reason).
7. Response dikembalikan ke client, tanpa AI engine melakukan call ke Besu.

## Strategi Implementasi

1. Tambah service adapter Besu di backend-api untuk operasi kontrak dan klasifikasi error.
2. Definisikan route kontrak gateway untuk tokenize, update status, verify status, dan audit trace.
3. Terapkan deterministic fallback policy pada semua operasi DLT saat Besu down/timeout/ABI mismatch.
4. Pastikan correlation ID dipropagasikan end-to-end ke response dan audit.
5. Tambah test skenario Besu up/down untuk membuktikan determinisme dan traceability.
6. Jalankan validasi 3x end-to-end run sebagai bukti stabilitas PoC.

## Post-Design Constitution Re-check (Phase 1)

**Status**: PASS

- Gate 1: PASS, traceability tetap lengkap dari requirement ke artefak desain.
- Gate 2: PASS, evidence compliance SNAP BI/UU PDP tersedia pada quickstart dan contracts.
- Gate 3: PASS, boundary AI-DLT tetap terjaga (backend-only DLT access).
- Gate 4: PASS, desain mempertahankan scope PoC stabil dan fallback deterministik.

## Complexity Tracking

Tidak ada pelanggaran konstitusi yang memerlukan justifikasi kompleksitas.
