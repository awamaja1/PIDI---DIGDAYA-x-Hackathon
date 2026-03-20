# Data Model: Smart Contract Integration via Backend Gateway

**Branch**: `002-smart-contract-integration` | **Tanggal**: 2026-03-20
**Referensi**: FR-001..FR-009, NFR-001..NFR-005, CR-001..CR-005, HA-001..HA-003

## Entitas Utama

## 1. TokenizationRequest

Deskripsi: Representasi pengajuan tokenisasi dari Petani melalui backend gateway.

Fields:
- `request_id` (string, required, unique)
- `actor_role` (enum: `PETANI`, required)
- `batch_id` (string, required, unique per aset panen)
- `commodity_code` (string, required)
- `harvest_quantity_kg` (number, required, > 0)
- `reference_value_idr` (number, required, > 0)
- `correlation_id` (string, required, format `GARUDA-<uuid>`)
- `submitted_at` (datetime, required)

Validation rules:
- Reject jika data minimum tidak lengkap (FR-001).
- Reject jika `batch_id` sudah pernah ditokenisasi.
- Auto-generate correlation ID jika header kosong, tetap simpan hasil generate.

## 2. TokenLifecycleRecord

Deskripsi: Snapshot lifecycle token quasi-collateral lintas backend dan on-chain.

Fields:
- `token_id` (string, required, unique)
- `contract_name` (enum: `GarudaLinkTokenization`, `HarvestTokenRegistry`)
- `onchain_status` (enum: `MINTED`, `PENDING_VERIFICATION`, `VERIFIED`, `COLLATERALIZED`, `REJECTED`, `RELEASED`)
- `backend_status` (enum mirror `onchain_status` + `FALLBACK_DEGRADED`)
- `tx_reference` (string, nullable)
- `last_operation` (enum: `MINT`, `UPDATE_STATUS`, `VERIFY_STATUS`)
- `correlation_id` (string, required)
- `updated_at` (datetime, required)

Validation rules:
- Pada jalur sukses Besu, `backend_status` harus konsisten dengan `onchain_status` (NFR-005).
- Pada fallback, `tx_reference` boleh null namun `fallback_reason` wajib dicatat di audit.

## 3. BesuServiceState

Deskripsi: Status layanan Besu untuk menentukan mode normal/fallback.

Fields:
- `state` (enum: `UP`, `DOWN`, `DEGRADED`)
- `checked_at` (datetime, required)
- `failure_class` (enum: `CONNECTION_ERROR`, `TIMEOUT`, `ABI_MISMATCH`, `UNKNOWN`, nullable)
- `health_probe_id` (string, required)

Validation rules:
- Failure class yang sama harus memicu payload fallback yang sama (NFR-002).

## 4. AuditTraceRecord

Deskripsi: Artefak audit minimum untuk regulator dan troubleshooting operasional.

Fields:
- `audit_id` (string, required, unique)
- `correlation_id` (string, required, indexed)
- `actor_role` (enum: `PETANI`, `BANK_MITRA`, `REGULATOR`, `SYSTEM`)
- `operation` (enum: `TOKENIZE`, `UPDATE_STATUS`, `VERIFY_STATUS`, `FALLBACK`)
- `status` (enum: `SUCCESS`, `FAILED`, `FALLBACK`)
- `event_time` (datetime, required)
- `tx_reference` (string, nullable)
- `fallback_reason` (string, nullable)
- `compliance_tags` (array string, optional; contoh: `CR-001`, `CR-004`)

Validation rules:
- Wajib ada untuk setiap operasi DLT, termasuk fallback (FR-008, CR-004).
- `fallback_reason` wajib saat status `FALLBACK`.

## 5. StatusUpdateCommand

Deskripsi: Perintah dari Bank Mitra untuk update status token.

Fields:
- `command_id` (string, required)
- `token_id` (string, required)
- `new_status` (enum: `VERIFIED`, `COLLATERALIZED`, `REJECTED`, `RELEASED`)
- `reason` (string, required)
- `actor_role` (enum: `BANK_MITRA`, required)
- `correlation_id` (string, required)
- `requested_at` (datetime, required)

Validation rules:
- Token harus ada sebelum update (edge case token belum ada -> domain error).
- Transisi status harus valid berdasarkan state machine.

## Relasi Antar Entitas

- `TokenizationRequest` 1..1 menghasilkan `TokenLifecycleRecord` saat mint berhasil/fallback.
- `StatusUpdateCommand` 1..1 memperbarui `TokenLifecycleRecord`.
- Semua entitas operasional menulis satu atau lebih `AuditTraceRecord` berdasarkan `correlation_id`.
- `BesuServiceState` mempengaruhi keputusan jalur `TokenizationRequest` dan `StatusUpdateCommand`.

## State Transitions

State machine token (jalur normal):

1. `REQUEST_ACCEPTED` -> `MINTED`
2. `MINTED` -> `PENDING_VERIFICATION`
3. `PENDING_VERIFICATION` -> `VERIFIED` atau `REJECTED`
4. `VERIFIED` -> `COLLATERALIZED`
5. `COLLATERALIZED` -> `RELEASED`

State machine token (jalur fallback):

1. Operasi DLT diminta saat `BesuServiceState=DOWN`
2. `backend_status=FALLBACK_DEGRADED`
3. Audit mencatat reason deterministik dan correlation ID
4. Request berikutnya kembali ke jalur normal jika Besu pulih

## Mapping Requirement ke Model

- FR-001, FR-002: `TokenizationRequest`, `TokenLifecycleRecord`
- FR-003, FR-004: `StatusUpdateCommand`, `TokenLifecycleRecord`
- FR-005, NFR-002: `BesuServiceState`, fallback path di `TokenLifecycleRecord`
- FR-007, NFR-003: `correlation_id` wajib pada semua entitas
- FR-008, CR-004: `AuditTraceRecord`
- CR-001..CR-003: `compliance_tags` dan validasi kontrol keamanan pada command/request
- HA-001..HA-003: relasi operasi DLT hanya melalui model command/request backend gateway