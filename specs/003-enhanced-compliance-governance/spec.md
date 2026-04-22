# Feature Specification: Enhanced Compliance & Governance untuk GARUDA-LINK

**Feature Branch**: `003-enhanced-compliance-governance`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: Peningkatan kontrol kepatuhan, governance, dan readiness audit untuk baseline GARUDA-LINK yang sudah berjalan.
**Changelog**: Lihat [CHANGELOG.md](../../CHANGELOG.md) untuk ringkasan rilis terbaru.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Regulator Meninjau Bukti Kepatuhan Terstruktur (Priority: P1)

Sebagai Regulator, saya ingin mendapatkan bukti kepatuhan yang konsisten dan terstruktur agar proses audit dapat dilakukan lebih cepat dan repeatable.

**Why this priority**: Auditability adalah nilai inti solusi. Tanpa paket bukti yang konsisten, validasi kepatuhan akan bergantung pada inspeksi manual ad-hoc.

**Independent Test**: Jalankan satu skenario transaksi end-to-end lalu verifikasi bahwa evidence bundle berisi trace, kontrol, dan status kepatuhan minimal yang diwajibkan.

**Acceptance Scenarios (Regulator)**:

1. **Given** transaksi tokenisasi berhasil diproses, **When** Regulator meminta evidence bundle berdasarkan `correlationId`, **Then** sistem mengembalikan paket bukti dengan metadata transaksi, jejak audit, dan status kontrol kepatuhan.
2. **Given** terjadi fallback akibat Besu unavailable, **When** Regulator meninjau evidence bundle, **Then** alasan fallback, klasifikasi kejadian, dan dampak transaksi terdokumentasi secara deterministik.

---

### User Story 2 - Tim Operasional Memantau Kesehatan Kontrol Governance (Priority: P2)

Sebagai Tim Operasional, saya ingin melihat status kontrol governance secara ringkas agar bisa mendeteksi gap sebelum audit atau demo.

**Why this priority**: Monitoring governance secara proaktif mengurangi risiko temuan saat review eksternal.

**Independent Test**: Simulasikan beberapa transaksi dengan outcome berbeda dan pastikan status kontrol governance teragregasi sesuai aturan.

**Acceptance Scenarios (Ops)**:

1. **Given** kumpulan transaksi harian tersedia, **When** Ops membuka ringkasan governance, **Then** sistem menampilkan status kontrol (pass/warn/fail) per domain (audit trace, fallback determinism, data protection).
2. **Given** ada kontrol yang gagal, **When** Ops menelusuri detail kontrol, **Then** sistem menampilkan alasan kegagalan dan daftar transaksi terdampak.

---

### User Story 3 - Product Owner Menjaga Readiness Rilis Berbasis Kepatuhan (Priority: P3)

Sebagai Product Owner, saya ingin readiness checklist rilis yang terhubung ke evidence agar keputusan go/no-go lebih objektif.

**Why this priority**: Keputusan rilis saat ini masih manual dan tersebar di dokumen berbeda.

**Independent Test**: Evaluasi satu kandidat rilis dan verifikasi bahwa checklist otomatis dapat memetakan status dari evidence yang tersedia.

**Acceptance Scenarios (PO)**:

1. **Given** kandidat rilis baru disiapkan, **When** checklist readiness dijalankan, **Then** setiap item checklist terisi status berdasarkan evidence aktual (bukan input manual bebas).
2. **Given** ada item checklist berstatus fail, **When** PO meninjau hasil, **Then** sistem memberikan tautan ke evidence sumber untuk tindakan perbaikan.

## Requirements *(mandatory)*

### Ruang Lingkup

**In Scope (Iterasi 003)**:

- Standardisasi evidence bundle kepatuhan berbasis `correlationId`.
- Ringkasan kontrol governance lintas domain (auditability, fallback determinism, data protection).
- Readiness checklist rilis berbasis evidence terukur.
- Kontrak output yang konsisten untuk konsumsi tim internal (Ops, Regulator, PO).

**Out of Scope**:

- Sertifikasi legal formal eksternal di luar ruang lingkup hackathon.
- Integrasi SIEM/observability enterprise skala produksi penuh.
- Penggantian total mekanisme audit yang sudah ada pada Feature 002.

### Functional Requirements

- **FR-001**: Sistem MUST menghasilkan evidence bundle terstruktur untuk setiap `correlationId` yang diminta.
- **FR-002**: Evidence bundle MUST memuat minimal: metadata transaksi, jejak audit, status fallback, dan compliance tags.
- **FR-003**: Sistem MUST menyediakan ringkasan governance controls per periode (mis. harian) dengan status `pass`, `warn`, atau `fail`.
- **FR-004**: Sistem MUST menyediakan detail drill-down dari kontrol yang berstatus `warn/fail`.
- **FR-005**: Sistem MUST menyediakan readiness checklist rilis yang diturunkan dari evidence aktual.
- **FR-006**: Sistem MUST mempertahankan batas arsitektur: AI engine tidak melakukan direct call ke DLT.
- **FR-007**: Seluruh output governance MUST melacak sumber evidence melalui `correlationId` atau referensi transaksi terkait.

### Non-Functional Requirements

- **NFR-001 (Konsistensi Evidence)**: Untuk input `correlationId` yang sama, evidence bundle MUST identik pada pengambilan berulang di kondisi data yang sama.
- **NFR-002 (Keterlacakan)**: 100% item checklist readiness MUST memiliki tautan ke evidence sumber.
- **NFR-003 (Kinerja)**: 95% permintaan evidence bundle MUST selesai dalam <= 3 detik pada data volume PoC.
- **NFR-004 (Reliability)**: Ringkasan governance harian MUST tetap dapat dihasilkan meskipun sebagian transaksi berada pada mode fallback.

### Compliance & Security Requirements *(mandatory)*

- **CR-001**: Spesifikasi MUST menjaga kesesuaian kontrol dengan prinsip SNAP BI yang relevan pada audit trail dan integritas proses.
- **CR-002**: Data pribadi dalam evidence MUST mengikuti prinsip minimisasi sesuai UU PDP.
- **CR-003**: Akses ke evidence bundle MUST tercatat pada audit log untuk keperluan pemeriksaan.
- **CR-004**: Item readiness yang menyangkut kontrol keamanan MUST menampilkan status yang dapat diverifikasi independen.

### Hybrid Architecture Constraints *(mandatory)*

- **HA-001**: AI module dan DLT module MUST tetap sebagai bounded context terpisah.
- **HA-002**: Seluruh operasi DLT MUST tetap melalui backend gateway.
- **HA-003**: Kontrak output governance baru MUST kompatibel dengan pipeline audit Feature 002.

## Edge Cases

- `correlationId` valid tetapi transaksi tidak memiliki tx reference (fallback case).
- Data audit parsial akibat kegagalan jaringan intermiten saat write log.
- Evidence diminta untuk rentang waktu dengan volume rendah/tinggi yang ekstrem.
- Konflik status kontrol ketika data transaksi dan audit tidak sinkron sementara.

## Success Criteria

- Evidence bundle dapat dihasilkan dan diverifikasi untuk skenario sukses dan fallback.
- Governance summary menampilkan status kontrol yang konsisten terhadap evidence sumber.
- Release readiness checklist dapat dipakai sebagai dasar keputusan go/no-go internal.

## Open Questions

- Apakah evidence bundle perlu format tunggal (JSON-only) atau juga versi human-readable (Markdown/PDF)?
- Apakah governance summary disimpan per hari, per rilis, atau keduanya?
- Batas minimum kontrol yang dianggap wajib lulus untuk keputusan go-live internal?
