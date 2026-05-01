# Requirements Checklist: Enhanced Compliance & Governance

## Functional Requirements

- [ ] FR-001 Evidence bundle terstruktur dapat diambil berdasarkan `correlationId`.
- [ ] FR-002 Evidence bundle memuat metadata transaksi, jejak audit, status fallback, dan compliance tags.
- [ ] FR-003 Governance summary tersedia per periode dengan status `pass/warn/fail`.
- [ ] FR-004 Detail drill-down tersedia untuk kontrol `warn/fail`.
- [ ] FR-005 Release readiness checklist diturunkan dari evidence aktual.
- [ ] FR-006 AI engine tetap tidak melakukan direct call ke DLT.
- [ ] FR-007 Semua output governance melacak sumber evidence via `correlationId` atau referensi transaksi.

## Non-Functional Requirements

- [ ] NFR-001 Evidence bundle identik untuk input `correlationId` yang sama.
- [ ] NFR-002 Setiap item release readiness memiliki tautan evidence sumber.
- [ ] NFR-003 95% request evidence bundle selesai <= 3 detik pada data PoC.
- [ ] NFR-004 Governance summary tetap dapat dihasilkan saat sebagian transaksi fallback.

## Compliance & Security Requirements

- [ ] CR-001 Kontrol selaras dengan prinsip SNAP BI untuk audit trail dan integritas proses.
- [ ] CR-002 Data pribadi dalam evidence diminimalkan sesuai UU PDP.
- [ ] CR-003 Akses ke evidence bundle tercatat pada audit log.
- [ ] CR-004 Item readiness kontrol keamanan dapat diverifikasi independen.

## Hybrid Architecture Constraints

- [ ] HA-001 AI module dan DLT module tetap bounded context terpisah.
- [ ] HA-002 Seluruh operasi DLT tetap melalui backend gateway.
- [ ] HA-003 Kontrak output governance kompatibel dengan pipeline audit Feature 002.
