# Research: Integrasi Smart Contract Besu via Backend Gateway

**Branch**: `002-smart-contract-integration` | **Tanggal**: 2026-03-20
**Status**: Selesai - seluruh NEEDS CLARIFICATION pada Technical Context telah diselesaikan

## R-001: Pola Integrasi Besu dari Backend Gateway

Decision: Backend-api menjadi satu-satunya adaptor ke Besu melalui lapisan service `besuGatewayService` dengan ABI-based calls untuk `mint`, `updateStatus`, dan `getTokenStatus`.

Rationale:
- Memenuhi HA-002/HA-003 dengan boundary tegas AI vs DLT.
- Menjaga single ownership untuk error handling, fallback, dan audit.
- Cocok dengan struktur existing `backend-api` yang sudah menjadi API gateway.

Alternatives considered:
- Direct call dari ai-engine ke Besu: ditolak karena melanggar HA-002.
- Frontend langsung ke JSON-RPC Besu: ditolak karena melanggar kontrol keamanan dan audit.

## R-002: Deterministic Fallback Policy saat Besu Unavailable

Decision: Terapkan fallback deterministik per jenis operasi DLT dengan pasangan `status code + error_code + payload shape` yang tetap untuk kegagalan identik.

Rationale:
- Memenuhi FR-005 dan NFR-002.
- Menjaga stabilitas demo hackathon dan memudahkan verifikasi otomatis.
- Konsisten dengan pola mock deterministic yang sudah ada pada `backend-api/src/mock`.

Alternatives considered:
- Retry asinkron otomatis dengan queue: ditunda, di luar scope iterasi.
- Error acak berdasarkan source exception: ditolak karena tidak deterministik.

## R-003: Smart Contract Interface Strategy

Decision: Gunakan kontrak operasi yang eksplisit:
- `GarudaLinkTokenization.mintToken(...)`
- `HarvestTokenRegistry.updateStatus(...)`
- `HarvestTokenRegistry.getTokenStatus(...)`

Semua panggilan dilakukan melalui gateway adapter; validasi ABI mismatch menjadi preflight check sebelum eksekusi.

Rationale:
- Selaras FR-002, FR-003, FR-004.
- Menangani edge case ABI/address mismatch secara aman dan auditable.

Alternatives considered:
- Dynamic method routing tanpa whitelist function: ditolak karena risiko keamanan.
- Menyatukan semua operasi dalam satu endpoint generic `invoke`: ditolak karena menyulitkan audit dan kontrak test.

## R-004: Auditability dan Correlation ID End-to-End

Decision: Standarisasi `X-Correlation-ID` menggunakan format existing `GARUDA-<uuid>` dan wajib ada di:
- Request headers
- Backend response body/header
- Audit artifacts untuk success/fallback
- Metadata transaksi kontrak (jika call sukses)

Rationale:
- Memenuhi FR-007, FR-008, NFR-003.
- Sudah kompatibel dengan middleware existing `correlationIdMiddleware`.

Alternatives considered:
- Correlation ID opsional: ditolak karena melanggar requirement audit.
- Menggunakan random trace ID berbeda antar modul: ditolak karena memutus trace chain.

## R-005: Compliance Controls untuk SNAP BI dan UU PDP

Decision: Gunakan kontrol minimum PoC berikut:
- SNAP BI: autentikasi/otorisasi gateway, integritas payload untuk endpoint write, error schema terstandar.
- UU PDP: minimisasi field pribadi, proteksi at-rest AES-256 baseline (existing middleware/policy), dan akses audit berjejak.

Rationale:
- Memenuhi CR-001..CR-005 tanpa menambah kompleksitas di luar scope hackathon.
- Menyediakan evidence points yang bisa diuji independen.

Alternatives considered:
- Implementasi enterprise-grade key management penuh (HSM/KMS): ditunda karena out of scope.
- Meniadakan audit artifacts untuk fallback: ditolak karena melanggar FR-008/CR-004.

## R-006: Integration Testing Strategy

Decision: Uji kontrak dan integrasi difokuskan pada empat skenario deterministik:
1. Mint token sukses saat Besu up.
2. Update status sukses saat Besu up.
3. Verifikasi status sukses saat Besu up.
4. Ketiga operasi di atas kembali fallback konsisten saat Besu down.

Rationale:
- Langsung memverifikasi FR-002..FR-005 + NFR-001..NFR-003.
- Siap diturunkan ke task implementasi dan pipeline demo validation.

Alternatives considered:
- Hanya uji unit tanpa integration path: ditolak karena tidak membuktikan objective fitur.
- Hanya uji sukses tanpa mode fallback: ditolak karena tidak memenuhi requirement determinisme fallback.

## Ringkasan Resolusi NEEDS CLARIFICATION

- Integrator DLT owner: backend-api only.
- Fallback policy: deterministic per operation/error class.
- Interface contracts: endpoint gateway + contract operasi Besu didokumentasikan.
- Audit evidence: wajib untuk success dan fallback.
- Compatibility dengan mock policy existing: dipertahankan.