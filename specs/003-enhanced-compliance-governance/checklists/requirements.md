# Requirements Checklist: Enhanced Compliance & Governance

## Functional Requirements

- [x] FR-001 Evidence bundle terstruktur dapat diambil berdasarkan `correlationId`.
- [x] FR-002 Evidence bundle memuat metadata transaksi, jejak audit, status fallback, dan compliance tags.
- [x] FR-003 Governance summary tersedia per periode dengan status `pass/warn/fail`.
- [x] FR-004 Detail drill-down tersedia untuk kontrol `warn/fail`.
- [x] FR-005 Release readiness checklist diturunkan dari evidence aktual.
- [x] FR-006 AI engine tetap tidak melakukan direct call ke DLT.
- [x] FR-007 Semua output governance melacak sumber evidence via `correlationId` atau referensi transaksi.

## Non-Functional Requirements

- [x] NFR-001 Evidence bundle identik untuk input `correlationId` yang sama.
- [x] NFR-002 Setiap item release readiness memiliki tautan evidence sumber.
- [x] NFR-003 95% request evidence bundle selesai <= 3 detik pada data PoC.
- [x] NFR-004 Governance summary tetap dapat dihasilkan saat sebagian transaksi fallback.

## Compliance & Security Requirements

- [x] CR-001 Kontrol selaras dengan prinsip SNAP BI untuk audit trail dan integritas proses.
- [x] CR-002 Data pribadi dalam evidence diminimalkan sesuai UU PDP.
- [x] CR-003 Akses ke evidence bundle tercatat pada audit log.
- [x] CR-004 Item readiness kontrol keamanan dapat diverifikasi independen.

## Hybrid Architecture Constraints

- [x] HA-001 AI module dan DLT module tetap bounded context terpisah.
- [x] HA-002 Seluruh operasi DLT tetap melalui backend gateway.
- [x] HA-003 Kontrak output governance kompatibel dengan pipeline audit Feature 002.
