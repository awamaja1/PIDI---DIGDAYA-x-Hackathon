# Research: Enhanced Compliance & Governance

**Branch**: `003-enhanced-compliance-governance` | **Tanggal**: 2026-04-22
**Status**: Selesai - keputusan awal untuk fase implementasi

## R-001: Format Evidence Bundle

Decision: Gunakan JSON sebagai format utama evidence bundle, dengan struktur deterministik per `correlationId`.

Rationale:
- Konsisten dengan pola integrasi backend existing dan mudah divalidasi contract test.
- Memenuhi NFR-001 (output identik untuk input identik).
- Mempermudah konsumsi oleh dashboard internal atau tooling lanjutan.

Alternatives considered:
- Markdown/PDF sebagai format utama: ditolak karena tidak ideal untuk validasi otomatis.
- Multi-format wajib (JSON + PDF) di iterasi yang sama: ditunda agar scope tetap fokus PoC.

## R-002: Granularity Governance Summary

Decision: Governance summary disediakan pada dua mode query:
- `period=daily`
- `period=release`

Rationale:
- Daily mode membantu operasional mendeteksi degradasi kontrol lebih cepat.
- Release mode relevan untuk keputusan go/no-go Product Owner.

Alternatives considered:
- Daily-only: tidak cukup untuk kebutuhan readiness rilis.
- Release-only: tidak cukup untuk monitoring proaktif harian.

## R-003: Klasifikasi Status Kontrol

Decision: Terapkan status tiga tingkat per kontrol domain:
- `pass`: kontrol terpenuhi penuh
- `warn`: kontrol terpenuhi parsial / ada gap non-blocking
- `fail`: kontrol kritikal tidak terpenuhi

Rationale:
- Selaras dengan FR-003 dan memudahkan komunikasi lintas fungsi.
- Cukup sederhana untuk konteks hackathon namun tetap actionable.

Alternatives considered:
- Skor numerik kompleks (0-100): ditolak untuk iterasi awal karena menambah ambiguitas interpretasi.
- Biner pass/fail: ditolak karena kehilangan konteks kondisi parsial.

## R-004: Readiness Checklist Derivation

Decision: Readiness checklist diturunkan otomatis dari evidence bundle + governance summary, dengan override manual dibatasi dan diaudit.

Rationale:
- Memenuhi FR-005 dan NFR-002 (tautan evidence wajib untuk setiap item checklist).
- Mengurangi subjektivitas keputusan rilis.

Alternatives considered:
- Checklist manual penuh: ditolak karena rawan inkonsistensi.
- Checklist otomatis tanpa override: ditolak agar tetap ada ruang judgement operasional terkendali.

## R-005: Batas Data Pribadi dan Compliance Tags

Decision: Evidence bundle menggunakan whitelist field untuk mencegah over-collection data pribadi, serta menyertakan compliance tags minimum (`CR-001`..`CR-004`) per event relevan.

Rationale:
- Menjaga prinsip minimisasi data (CR-002).
- Mempermudah audit jejak kepatuhan per transaksi.

Alternatives considered:
- Menyalin payload mentah penuh ke evidence: ditolak karena risiko eksposur data.
- Compliance tags opsional: ditolak karena melemahkan keterlacakan compliance.

## R-006: Kompatibilitas dengan Pipeline Feature 002

Decision: Reuse `AuditTraceRecord` yang sudah ada sebagai source-of-truth evidence; governance layer hanya menambahkan agregasi dan evaluasi readiness.

Rationale:
- Memenuhi HA-003 (kompatibel dengan pipeline audit existing).
- Menghindari duplikasi data dan perubahan besar pada jalur transaksi inti.

Alternatives considered:
- Membangun storage governance terpisah dari nol: ditolak untuk menjaga scope dan waktu implementasi.

## R-007: Strategi Verifikasi

Decision: Verifikasi dilakukan dengan kombinasi:
1. Contract tests untuk shape endpoint governance.
2. Integration tests untuk skenario sukses, fallback, dan mixed outcomes.
3. Determinism checks untuk evidence by correlation ID.
4. Traceability checks untuk memastikan semua item checklist punya pointer ke evidence.

Rationale:
- Menutup kebutuhan FR + NFR + CR secara terukur.
- Reusable dengan harness test existing dari Feature 002.

Alternatives considered:
- Hanya snapshot manual: ditolak karena tidak repeatable.
- Hanya unit test service: ditolak karena tidak membuktikan behavior endpoint end-to-end.
