# Feature Specification: Integrasi Smart Contract Besu untuk Tokenisasi GARUDA-LINK

**Feature Branch**: `002-smart-contract-integration`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "Integrasi alur smart contract Besu untuk tokenisasi GarudaLink dengan fallback deterministik dan jejak audit correlation ID"
**Changelog**: Lihat [CHANGELOG.md](../../CHANGELOG.md) untuk ringkasan rilis terbaru.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Petani Mengajukan Tokenisasi Panen ke Besu (Priority: P1)

Sebagai Petani, saya ingin mengajukan tokenisasi aset panen agar status tokenisasi tercatat pada smart contract aktual dan dapat dipakai sebagai dasar proses pembiayaan.

**Why this priority**: Ini adalah alur nilai utama PoC; tanpa tokenisasi on-chain aktual, use case pembiayaan berbasis quasi-collateral tidak dapat dibuktikan.

**Independent Test**: Dapat diuji mandiri dengan satu permintaan tokenisasi dari data panen valid sampai terbentuk status transaksi yang dapat diverifikasi ulang melalui gateway backend.

**Acceptance Scenarios (Petani)**:

1. **Given** jaringan Besu QBFT aktif dan kontrak tokenisasi telah terdaftar, **When** Petani mengirim permintaan tokenisasi panen valid, **Then** backend memproses mint melalui ABI kontrak dan mengembalikan status sukses dengan referensi transaksi serta correlation ID yang sama dengan request awal.
2. **Given** jaringan Besu tidak tersedia, **When** Petani mengirim permintaan tokenisasi, **Then** sistem masuk mode degradasi terkontrol, mengembalikan status fallback deterministik, dan tetap mencatat jejak audit lengkap dengan correlation ID.

---

### User Story 2 - Bank Mitra Memperbarui dan Memverifikasi Status Token (Priority: P2)

Sebagai Bank Mitra, saya ingin memperbarui status token quasi-collateral dan memverifikasi status on-chain agar keputusan pembiayaan dapat dipertanggungjawabkan.

**Why this priority**: Proses pembiayaan memerlukan status token yang konsisten, sehingga update dan verifikasi status menjadi kontrol bisnis inti setelah tokenisasi dilakukan.

**Independent Test**: Dapat diuji mandiri dengan satu token terdaftar, lalu Bank Mitra melakukan update status dan verifikasi hasil baca ulang dari on-chain melalui endpoint backend.

**Acceptance Scenarios (Bank Mitra)**:

1. **Given** token panen telah tercatat pada kontrak, **When** Bank Mitra mengirim perintah update status pembiayaan, **Then** backend mengeksekusi update status on-chain sesuai ABI, menyimpan hasil, dan mengembalikan status terbaru yang konsisten.
2. **Given** update status telah berhasil diproses, **When** Bank Mitra meminta verifikasi status token, **Then** sistem menampilkan status token yang sama antara catatan backend dan hasil pembacaan kontrak.

---

### User Story 3 - Regulator Melakukan Audit Jejak End-to-End (Priority: P3)

Sebagai Regulator, saya ingin menelusuri aliran transaksi dari request hingga event kontrak agar konsistensi audit dapat diverifikasi sesuai kontrol kepatuhan.

**Why this priority**: Nilai pembeda solusi ada pada akuntabilitas lintas modul; audit trace konsisten menjadi syarat demonstrasi kepatuhan dan governance.

**Independent Test**: Dapat diuji mandiri dengan memilih satu correlation ID dan menelusuri semua event yang terkait pada gateway backend serta hasil eksekusi ke jaringan Besu.

**Acceptance Scenarios (Regulator)**:

1. **Given** terdapat transaksi tokenisasi atau update status yang sudah diproses, **When** Regulator meminta jejak audit berbasis correlation ID, **Then** sistem menampilkan rantai jejak konsisten dari request, keputusan backend, hingga referensi transaksi kontrak.
2. **Given** terjadi fallback karena Besu tidak tersedia, **When** Regulator meninjau jejak insiden, **Then** catatan audit menunjukkan alasan fallback, waktu kejadian, status layanan, dan dampak transaksi secara deterministik.

### Edge Cases

- Jaringan Besu QBFT aktif tetapi node leader berganti saat transaksi berlangsung; sistem harus memberi hasil akhir deterministik (sukses/fallback) tanpa status ambigu.
- ABI kontrak tidak cocok dengan alamat kontrak yang dikonfigurasi; sistem harus menolak eksekusi write/read dan mencatat alasan validasi kontrak.
- Correlation ID tidak dikirim dari klien; sistem harus membuat ID baru sesuai format standar dan mempropagasikannya ke seluruh log proses.
- Permintaan update status datang untuk token yang belum ada di registry; sistem harus mengembalikan respons domain error yang konsisten dan tidak melakukan perubahan data.
- Besu pulih setelah periode fallback; sistem harus kembali ke mode normal pada request berikutnya tanpa membutuhkan intervensi manual non-dokumentasi.

## Requirements *(mandatory)*

### Ruang Lingkup

**In Scope (PoC Iterasi Smart Contract)**:

- Integrasi nyata backend ke kontrak `GarudaLinkTokenization` dan `HarvestTokenRegistry` pada jaringan lokal Besu QBFT.
- Orkestrasi backend untuk mint token dan update status token menggunakan ABI kontrak.
- Verifikasi status token melalui pembacaan kontrak on-chain via backend gateway.
- Strategi fallback deterministik saat Besu tidak tersedia dengan mode degradasi terkontrol.
- Propagasi correlation ID end-to-end pada request, proses backend, dan jejak audit transaksi.
- Pemetaan kontrol kepatuhan relevan SNAP BI dan UU PDP untuk alur tokenisasi PoC.

**Out of Scope (Tetap di Luar Iterasi Ini)**:

- Integrasi jaringan Besu produksi atau multi-organisasi lintas lingkungan.
- Otomasi manajemen kunci produksi/HSM dan operasional keamanan tingkat enterprise penuh.
- Integrasi langsung AI engine ke jaringan DLT tanpa gateway backend.
- Finalisasi legal produk pembiayaan komersial di luar demonstrasi PoC hackathon.

### Functional Requirements

- **FR-001**: Sistem MUST menerima permintaan tokenisasi panen dari aktor bisnis dan memvalidasi data minimum sebelum proses on-chain.
- **FR-002**: Backend gateway MUST mengeksekusi operasi mint token melalui ABI `GarudaLinkTokenization` pada Besu QBFT ketika jaringan tersedia.
- **FR-003**: Backend gateway MUST mengeksekusi operasi update status token melalui ABI `HarvestTokenRegistry` berdasarkan keputusan proses pembiayaan.
- **FR-004**: Sistem MUST menyediakan endpoint verifikasi status token yang membaca status aktual dari kontrak dan menyajikannya dalam respons yang konsisten.
- **FR-005**: Ketika Besu tidak tersedia, sistem MUST mengaktifkan mode fallback deterministik dengan hasil respons yang konsisten untuk kondisi kegagalan yang sama.
- **FR-006**: Sistem MUST mempertahankan batas arsitektur: modul AI tidak boleh melakukan panggilan langsung ke DLT; seluruh interaksi DLT hanya melalui backend gateway.
- **FR-007**: Setiap request MUST memiliki correlation ID unik yang dipropagasikan ke seluruh layanan terkait dan dicantumkan di log audit.
- **FR-008**: Sistem MUST menyimpan artefak audit minimum untuk setiap transaksi: waktu, aktor, operasi, status, correlation ID, dan referensi transaksi kontrak jika tersedia.
- **FR-009**: Sistem MUST menyediakan status proses yang dapat diverifikasi independen untuk tiga aktor: Petani, Bank Mitra, dan Regulator.

### Non-Functional Requirements

- **NFR-001 (Keandalan PoC)**: Alur tokenisasi hingga verifikasi status MUST berhasil end-to-end minimal 3 kali berturut-turut dalam lingkungan yang sama saat Besu tersedia.
- **NFR-002 (Determinisme Respons)**: Untuk jenis kegagalan Besu yang sama, sistem MUST mengembalikan kode status dan payload error yang sama pada 100% pengujian berulang.
- **NFR-003 (Keterlacakan Audit)**: 100% transaksi uji MUST dapat ditelusuri menggunakan correlation ID dari request awal hingga hasil proses backend.
- **NFR-004 (Kinerja Interaktif PoC)**: 95% permintaan tokenisasi, update status, dan verifikasi status MUST selesai dalam <= 6 detik per request pada kondisi uji demo.
- **NFR-005 (Konsistensi Data Status)**: Pada skenario sukses on-chain, status token yang ditampilkan backend MUST konsisten dengan hasil pembacaan kontrak pada 100% sampel uji.

### Compliance & Security Requirements *(mandatory)*

- **CR-001**: Spesifikasi MUST memetakan kontrol API terhadap praktik keamanan SNAP BI yang relevan untuk autentikasi, otorisasi, integritas pesan, dan audit.
- **CR-002**: Data pribadi yang disimpan MUST mengikuti prinsip minimisasi data dan perlindungan data pribadi sesuai UU PDP.
- **CR-003**: Data pribadi at-rest MUST dienkripsi setara AES-256 sesuai baseline keamanan yang telah disepakati.
- **CR-004**: Catatan audit MUST menyimpan jejak akses dan perubahan status untuk kebutuhan penelusuran regulator.
- **CR-005**: Spesifikasi MUST mencantumkan artefak verifikasi kepatuhan yang dapat diuji independen (hasil uji, log audit, dan checklist review).

### Hybrid Architecture Constraints *(mandatory)*

- **HA-001**: AI module dan DLT module MUST diperlakukan sebagai bounded context terpisah dengan kontrak antarmuka terdokumentasi.
- **HA-002**: Seluruh operasi DLT (mint/read/update status token) MUST melalui backend gateway; direct call AI -> DLT dilarang.
- **HA-003**: Perubahan kontrak antarmuka lintas modul MUST ditinjau sebelum implementasi dan tetap kompatibel dengan skenario PoC.

### Asumsi Iterasi

- Kontrak `GarudaLinkTokenization` dan `HarvestTokenRegistry` telah ter-deploy pada jaringan Besu lokal dan alamatnya tersedia dalam konfigurasi lingkungan.
- Kebutuhan otorisasi pengguna bisnis sudah dicakup baseline API middleware; iterasi ini fokus pada alur smart contract dan auditability.
- Fallback deterministik pada iterasi ini bersifat graceful degraded mode (transaksi tidak diproses on-chain saat Besu down) dan bukan retry asinkron otomatis.

### Dependency Eksternal

- Ketersediaan jaringan Hyperledger Besu lokal dengan konsensus QBFT.
- Ketersediaan ABI kontrak yang tervalidasi untuk operasi mint/update/read.
- Ketersediaan endpoint backend middleware untuk orkestrasi status token dan audit trail.

### Traceability Matrix *(mandatory)*

| Requirement ID | Acceptance Criteria ID | Design Component | Task ID | Test Case ID |
|----------------|------------------------|------------------|---------|--------------|
| FR-001, FR-002, FR-007 | AC-PET-01 | Tokenization Gateway Flow | T001 | TC-PET-001 |
| FR-005, FR-008 | AC-PET-02 | Deterministic Fallback Handler | T002 | TC-PET-002 |
| FR-003, FR-004 | AC-BNK-01 | Status Update & Verification Flow | T003 | TC-BNK-001 |
| FR-003, NFR-005 | AC-BNK-02 | On-chain/Backend Consistency Check | T004 | TC-BNK-002 |
| FR-007, FR-008, CR-004 | AC-REG-01 | Correlation Audit Pipeline | T005 | TC-REG-001 |
| CR-001, CR-002, CR-003, CR-005, HA-001, HA-002 | AC-REG-02 | Compliance & Boundary Control | T006 | TC-REG-002 |

Semua requirement yang disetujui wajib dipetakan dalam matriks ini sebelum masuk fase perencanaan teknis rinci.

### Key Entities *(include if feature involves data)*

- **Permintaan Tokenisasi Panen**: Data pengajuan tokenisasi dari Petani, termasuk identitas batch panen, nilai acuan, dan metadata request.
- **Token Aset Panen**: Representasi token quasi-collateral yang memiliki identitas token, status lifecycle pembiayaan, dan referensi kontrak.
- **Status Verifikasi Bank Mitra**: Keputusan status token dari Bank Mitra beserta alasan dan waktu perubahan.
- **Catatan Audit Korelasi**: Jejak terstruktur berisi correlation ID, aktor, operasi, hasil, dan referensi transaksi.
- **Status Layanan Besu**: Status operasional jaringan untuk menentukan mode normal atau fallback.

### Acceptance Criteria Per Aktor (Terstruktur)

**Aktor: Petani**

- **AC-PET-01**: Pengajuan tokenisasi valid diproses melalui backend ke kontrak dengan satu correlation ID konsisten dari request sampai respons.
  - **Given** Besu tersedia dan data panen valid, **When** Petani mengajukan tokenisasi, **Then** sistem mengembalikan status sukses berikut referensi transaksi dan correlation ID.
- **AC-PET-02**: Saat Besu tidak tersedia, alur tokenisasi masuk fallback deterministik tanpa menghasilkan status ambigu.
  - **Given** Besu tidak tersedia, **When** Petani mengajukan tokenisasi, **Then** sistem memberi status fallback yang konsisten dan mencatat jejak audit lengkap.

**Aktor: Bank Mitra**

- **AC-BNK-01**: Update status token oleh Bank Mitra tercatat konsisten antara backend dan kontrak pada skenario sukses.
  - **Given** token telah ada pada registry, **When** Bank Mitra mengubah status, **Then** status baru dapat terbaca ulang dengan nilai yang sama.
- **AC-BNK-02**: Verifikasi status token menghasilkan respons deterministik untuk kondisi data yang sama.
  - **Given** token tertentu dipilih, **When** Bank Mitra meminta verifikasi status, **Then** sistem mengembalikan status token yang konsisten dan dapat diaudit.

**Aktor: Regulator**

- **AC-REG-01**: Penelusuran audit berbasis correlation ID menampilkan rantai event end-to-end tanpa kehilangan jejak.
  - **Given** correlation ID transaksi tersedia, **When** Regulator meminta audit trace, **Then** sistem menampilkan urutan event dari request hingga hasil proses.
- **AC-REG-02**: Bukti kepatuhan kontrol batas AI-DLT dan kontrol perlindungan data tersedia untuk review.
  - **Given** periode audit dipilih, **When** Regulator meninjau bukti kontrol, **Then** tersedia artefak uji yang menunjukkan tidak ada direct call AI -> DLT serta pemenuhan kontrol SNAP BI/UU PDP relevan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Minimal 95% permintaan tokenisasi valid berhasil mencapai status akhir (sukses atau fallback terkontrol) tanpa status ambigu.
- **SC-002**: 100% transaksi uji memiliki correlation ID yang dapat ditelusuri end-to-end pada log audit.
- **SC-003**: Minimal 95% verifikasi status token oleh Bank Mitra selesai dalam <= 6 detik selama uji PoC.
- **SC-004**: 100% sampel audit Regulator menunjukkan konsistensi jejak antara request backend, keputusan proses, dan referensi transaksi kontrak/fallback.

### PoC Stability Outcomes *(mandatory for hackathon scope)*

- **PSC-001**: Alur utama tokenisasi + update status + verifikasi berjalan sukses 3 kali berturut-turut pada lingkungan uji yang sama.
- **PSC-002**: Respons error untuk kegagalan Besu bersifat deterministik dan mengikuti skema respons yang terdokumentasi.
- **PSC-003**: Tidak ditemukan pelanggaran batas arsitektur AI -> DLT pada hasil uji independen boundary control.
