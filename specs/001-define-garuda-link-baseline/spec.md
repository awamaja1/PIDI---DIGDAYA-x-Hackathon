# Feature Specification: Baseline GARUDA-LINK Middleware Logistik dan Pembiayaan

**Feature Branch**: `001-define-garuda-link-baseline`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: User description: "Buat atau perbarui baseline spesifikasi fitur untuk proyek middleware logistik dan pembiayaan GARUDA-LINK pada kompetisi PIDI 2026"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Petani Mendapatkan Rekomendasi Operasional dan Pembiayaan (Priority: P1)

Sebagai Petani, saya ingin melihat prediksi harga komoditas dan rekomendasi rute pengiriman agar keputusan waktu panen, distribusi, dan pengajuan pembiayaan dapat dilakukan berbasis data.

**Why this priority**: Nilai langsung ke aktor utama dan menjadi alur demo inti PoC dari data harga sampai usulan aksi logistik dan pembiayaan.

**Independent Test**: Dapat diuji mandiri dengan menjalankan satu skenario komoditas dari input wilayah-tanggal hingga keluaran prediksi harga, rekomendasi rute, dan status kelayakan quasi-collateral.

**Acceptance Scenarios (Petani)**:

1. **Given** data harga historis PIHPS untuk komoditas tersedia pada Mock-API, **When** Petani meminta prediksi harga 7 hari ke depan, **Then** sistem menampilkan hasil prediksi model hibrida XGBoost-LSTM berikut interval kepercayaan dan waktu pembaruan data.
2. **Given** daftar titik muat, kapasitas armada, dan batas waktu kirim telah terisi, **When** Petani mengeksekusi optimasi rute, **Then** sistem menghasilkan rute usulan dinamis berbasis GA dan PPO + HSTE-GNN dengan estimasi biaya, waktu tempuh, dan tingkat layanan.
3. **Given** data panen telah tervalidasi minimal, **When** Petani mengajukan tokenisasi aset panen sebagai quasi-collateral, **Then** sistem menerbitkan draft token aset dan menampilkan status verifikasi sebelum diserahkan ke Bank Mitra.

---

### User Story 2 - Bank Mitra Menilai Risiko dan Menerbitkan Pembiayaan (Priority: P2)

Sebagai Bank Mitra, saya ingin memverifikasi token aset panen dan rekam jejak operasional agar keputusan pembiayaan dapat dipertanggungjawabkan secara audit.

**Why this priority**: Menjadi inti nilai bisnis pembiayaan, sekaligus penghubung antara modul AI dan DLT melalui kontrak antarmodul yang terkontrol.

**Independent Test**: Dapat diuji mandiri dengan memproses satu aplikasi pembiayaan berbasis token dari status diajukan hingga disetujui/ditolak beserta jejak audit.

**Acceptance Scenarios (Bank Mitra)**:

1. **Given** token aset panen berstatus "siap verifikasi", **When** Bank Mitra melakukan validasi metadata token dan riwayat komoditas, **Then** sistem memberikan hasil validasi deterministik dengan keputusan "valid", "perlu klarifikasi", atau "tidak valid".
2. **Given** skor risiko dan rekam jejak IASC OJK tersedia, **When** Bank Mitra melakukan penilaian pembiayaan, **Then** sistem menampilkan rekomendasi keputusan dengan alasan yang dapat ditelusuri dan menyimpan jejak audit keputusan.
3. **Given** pengajuan disetujui, **When** kontrak pembiayaan dieksekusi, **Then** sistem mengubah status token quasi-collateral sesuai siklus pembiayaan dan mencatat peristiwa transaksi pada jaringan DLT.

---

### User Story 3 - Regulator Memantau Kepatuhan dan Transparansi (Priority: P3)

Sebagai Regulator, saya ingin memantau status kepatuhan, jejak audit, dan integritas data agar proses pembiayaan dan logistik tetap sesuai regulasi.

**Why this priority**: Menjamin validitas demo pada aspek kepatuhan SNAP BI, perlindungan data pribadi (UU PDP), serta integrasi rekam jejak IASC OJK.

**Independent Test**: Dapat diuji mandiri dengan menjalankan audit pada satu periode transaksi dan memverifikasi bukti kontrol keamanan serta jejak transaksi.

**Acceptance Scenarios (Regulator)**:

1. **Given** data transaksi periode audit tersedia, **When** Regulator meminta laporan kepatuhan, **Then** sistem menghasilkan laporan yang memetakan kontrol SNAP BI, status enkripsi AES-256 data at-rest, dan hasil verifikasi kontrol.
2. **Given** terdapat transaksi tokenisasi dan pembiayaan pada periode audit, **When** Regulator melakukan penelusuran jejak, **Then** sistem menyediakan jejak rekam yang konsisten antara middleware, kontrak pintar Hyperledger Besu (QBFT), dan log verifikasi IASC OJK.
3. **Given** terjadi kegagalan endpoint eksternal, **When** Regulator meninjau insiden, **Then** sistem menampilkan fallback Mock-API, klasifikasi dampak, dan bukti bahwa alur demo tetap deterministik.

### Alur Utama PoC

1. Ingest data harga PIHPS dari Mock-API ke modul analitik.
2. Hitung prediksi harga komoditas menggunakan model hibrida XGBoost-LSTM.
3. Hitung optimasi rute armada dinamis menggunakan GA dan PPO + HSTE-GNN.
4. Bentuk usulan tokenisasi aset panen (quasi-collateral) dan lakukan validasi awal.
5. Terbitkan/kelola token pada smart contract Hyperledger Besu dengan konsensus QBFT.
6. Lakukan verifikasi rekam jejak terintegrasi IASC OJK untuk keputusan pembiayaan.
7. Sajikan dashboard keputusan Petani, Bank Mitra, dan Regulator beserta log audit.

### Edge Cases

- Endpoint PIHPS aktual tidak tersedia atau timeout; sistem wajib beralih ke Mock-API tanpa mengubah skema respons.
- Data komoditas parsial atau outlier ekstrem; sistem wajib menandai kualitas data dan menurunkan tingkat keyakinan prediksi.
- Konflik hasil optimasi rute (biaya minimum vs batas SLA); sistem wajib menerapkan aturan prioritas kebijakan yang terdokumentasi.
- Token aset ganda untuk panen yang sama; sistem wajib menolak duplikasi berdasarkan identitas batch panen.
- Verifikasi IASC OJK tidak sinkron sementara; sistem wajib memberi status "pending verification" dengan batas waktu evaluasi ulang.

## Requirements *(mandatory)*

### Ruang Lingkup

**In Scope**:

- Agregasi data harga komoditas dari PIHPS melalui Mock-API untuk kebutuhan peramalan.
- Peramalan harga berbasis model hibrida XGBoost-LSTM untuk horizon demo.
- Optimasi rute dinamis menggunakan GA dan PPO + HSTE-GNN untuk skenario armada terbatas.
- Tokenisasi aset panen (quasi-collateral) menggunakan smart contract di Hyperledger Besu dengan QBFT.
- Verifikasi rekam jejak terintegrasi IASC OJK untuk proses penilaian pembiayaan.
- Kontrol kepatuhan SNAP BI, UU PDP, enkripsi data at-rest AES-256, dan audit trail minimum.

**Out of Scope**:

- Integrasi produksi skala nasional dengan seluruh endpoint eksternal real-time.
- Penyelesaian hukum final atas token sebagai agunan formal di luar konteks PoC.
- Fitur operasional perbankan penuh (disbursement core banking, collection engine, treasury).
- Pemodelan komoditas lintas negara dan simulasi makroekonomi mendalam.

### Functional Requirements

- **FR-001**: Sistem MUST mengagregasi data harga komoditas dari sumber PIHPS melalui antarmuka Mock-API yang stabil untuk kebutuhan demo.
- **FR-002**: Sistem MUST menghasilkan prediksi harga komoditas menggunakan pendekatan model hibrida XGBoost-LSTM untuk horizon yang ditentukan pada skenario PoC.
- **FR-003**: Sistem MUST menyediakan optimasi rute armada dinamis menggunakan kombinasi GA dan PPO + HSTE-GNN dengan keluaran biaya, waktu, dan risiko layanan.
- **FR-004**: Sistem MUST menyediakan proses tokenisasi aset panen sebagai quasi-collateral melalui smart contract pada Hyperledger Besu dengan konsensus QBFT.
- **FR-005**: Sistem MUST melakukan verifikasi rekam jejak terintegrasi IASC OJK sebagai bagian dari evaluasi pengajuan pembiayaan.
- **FR-006**: Sistem MUST memisahkan tegas alur data dan kontrol antara modul AI dan modul DLT/Blockchain melalui kontrak antarmuka terversi.
- **FR-007**: Sistem MUST menyediakan status proses end-to-end untuk tiga aktor utama (Petani, Bank Mitra, Regulator) dalam alur PoC.
- **FR-008**: Sistem MUST menyediakan fallback Mock-API policy saat endpoint aktual tidak tersedia, dengan perilaku respons yang deterministik.
- **FR-009**: Sistem MUST mencatat jejak audit untuk keputusan prediksi, optimasi, tokenisasi, verifikasi, dan keputusan pembiayaan.

### Non-Functional Requirements

- **NFR-001 (Stabilitas PoC)**: Alur demo inti MUST berhasil dijalankan end-to-end minimal 3 kali berturut-turut dalam lingkungan yang sama tanpa intervensi manual non-dokumentasi.
- **NFR-002 (Kinerja Demo)**: Waktu respons endpoint kritis demo MUST berada pada batas yang mendukung presentasi interaktif (target operasional: <= 5 detik per permintaan utama).
- **NFR-003 (Determinisme Error)**: Semua endpoint demo-kritis MUST mengembalikan kode dan skema error konsisten untuk kondisi kegagalan yang sama.
- **NFR-004 (Auditabilitas)**: Setiap keputusan sistem MUST memiliki referensi ID jejak yang dapat ditelusuri lintas modul untuk kebutuhan audit.
- **NFR-005 (Keamanan Data)**: Data pribadi pada penyimpanan MUST terlindungi dengan AES-256 atau ekuivalen yang disetujui formal.

### Compliance & Security Requirements *(mandatory)*

- **CR-001**: Desain API MUST memetakan kontrol keamanan relevan terhadap ketentuan SNAP BI (autentikasi, otorisasi, integritas pesan, dan pengelolaan kredensial).
- **CR-002**: Data pribadi at-rest MUST dienkripsi menggunakan AES-256 sesuai prinsip UU PDP dan kebijakan internal keamanan data.
- **CR-003**: Spesifikasi MUST mendefinisikan artefak bukti kepatuhan minimum: konfigurasi kontrol, log audit, hasil uji, dan checklist review.
- **CR-004**: Akses data sensitif MUST mengikuti prinsip least privilege dan tercatat untuk kebutuhan audit regulator.
- **CR-005**: Kegagalan kontrol keamanan MUST memicu status degradasi layanan yang terdokumentasi, bukan kegagalan diam.

### Hybrid Architecture Constraints *(mandatory)*

- **HA-001**: Modul AI dan modul DLT/Blockchain MUST dipisahkan sebagai bounded context berbeda dengan ownership yang jelas.
- **HA-002**: Komunikasi antarmodul MUST melalui kontrak antarmuka terdokumentasi, terversi, dan memiliki semantik error eksplisit.
- **HA-003**: Pemanggilan langsung lintas batas modul di luar kontrak resmi MUST dilarang.
- **HA-004**: Perubahan kontrak antarmodul MUST melalui proses persetujuan spesifikasi sebelum implementasi.

### External Dependencies

- Sumber data harga PIHPS (aktual atau representasi Mock-API).
- Layanan/verifikator rekam jejak IASC OJK (aktual atau adaptor mock tervalidasi).
- Jaringan Hyperledger Besu (mode PoC) dengan konfigurasi konsensus QBFT.
- Ketersediaan data komoditas dan armada minimum untuk skenario demo.

### Assumptions & Mock-API Policy

- Endpoint aktual PIHPS dan/atau IASC OJK dapat belum tersedia secara penuh selama fase hackathon.
- Mock-API wajib meniru skema request/response, kode status, dan pola error yang setara secara semantik dengan endpoint target.
- Dataset mock merepresentasikan minimal 3 komoditas, 3 wilayah, dan 30 hari histori untuk validasi skenario.
- Jika atribut data wajib tidak tersedia dari sumber aktual, sistem menggunakan nilai default terdokumentasi dengan label "assumed-data".
- Sinkronisasi ke endpoint aktual di luar cakupan PoC dan akan diperlakukan sebagai aktivitas fase lanjutan.

### Risk & Constraints

- Kualitas data historis tidak stabil dapat menurunkan akurasi prediksi dan kredibilitas demo.
- Keterlambatan integrasi endpoint eksternal dapat menghambat verifikasi lintas lembaga.
- Ambiguitas status hukum quasi-collateral dapat membatasi narasi penggunaan sebagai agunan formal.
- Ketergantungan pada satu lingkungan demo meningkatkan risiko kegagalan jika konfigurasi tidak reproducible.
- Ketidakselarasan kontrak antarmodul AI-DLT berpotensi menyebabkan inkonsistensi jejak audit.

### Traceability Matrix *(mandatory)*

| Requirement ID | Acceptance Criteria ID | Design Component | Task ID | Test Case ID |
|----------------|------------------------|------------------|---------|--------------|
| FR-001, FR-002 | AC-PET-01             | Data Pricing & Forecasting | T001 | TC-PET-001 |
| FR-003         | AC-PET-02             | Dynamic Route Optimization | T002 | TC-PET-002 |
| FR-004         | AC-BNK-01             | Asset Tokenization Service | T003 | TC-BNK-001 |
| FR-005         | AC-BNK-02             | Trace Verification Gateway | T004 | TC-BNK-002 |
| CR-001, CR-002, CR-003, CR-004 | AC-REG-01 | Compliance & Security Controls | T005 | TC-REG-001 |
| HA-001, HA-002, HA-003 | AC-REG-02 | AI-DLT Interface Contract | T006 | TC-REG-002 |
| FR-008, NFR-003 | AC-REG-03 | Mock-API Resilience Layer | T007 | TC-REG-003 |

Semua requirement yang disetujui wajib dipetakan di matriks ini sebelum masuk fase perencanaan implementasi rinci.

### Key Entities *(include if feature involves data)*

- **Profil Petani**: Identitas aktor, lokasi lahan, jenis komoditas, histori produksi, status persetujuan data.
- **Data Harga Komoditas**: Riwayat harga per wilayah dan waktu, sumber data, kualitas data, indikator anomali.
- **Rencana Rute Armada**: Titik asal/tujuan, kapasitas armada, batas waktu, estimasi biaya-waktu-risiko.
- **Aset Panen Tertokenisasi**: Identitas batch panen, nilai referensi, status token, status pembiayaan.
- **Rekam Jejak IASC OJK**: Identitas referensi, status verifikasi, timestamp verifikasi, bukti audit.
- **Catatan Kepatuhan**: Pemetaan kontrol regulasi, status pemenuhan, bukti verifikasi, pemilik kontrol.

### Acceptance Criteria Per Aktor (Terstruktur)

**Aktor: Petani**

- **AC-PET-01**: Prediksi harga tersedia untuk minimal 3 komoditas prioritas dalam <= 5 detik per permintaan pada 95% percobaan demo.
  - **Given** dataset mock valid tersedia, **When** Petani meminta prediksi, **Then** hasil prediksi, interval kepercayaan, dan timestamp sumber data ditampilkan lengkap.
- **AC-PET-02**: Rute dinamis usulan menghasilkan pengurangan estimasi biaya distribusi minimal 10% dibanding baseline rute statis pada skenario uji.
  - **Given** skenario armada dan permintaan yang sama, **When** optimasi dinamis dijalankan, **Then** metrik biaya/waktu layanan menunjukkan perbaikan sesuai ambang.
- **AC-PET-03**: Pengajuan tokenisasi quasi-collateral dapat diselesaikan dalam <= 3 menit per batch panen pada skenario demo.
  - **Given** data panen lengkap, **When** Petani men-submit pengajuan, **Then** status tokenisasi awal tercatat dan dapat dilacak.

**Aktor: Bank Mitra**

- **AC-BNK-01**: Validasi token aset menghasilkan status deterministik dan jejak alasan keputusan pada 100% transaksi demo.
  - **Given** token masuk antrean validasi, **When** Bank Mitra menjalankan validasi, **Then** sistem mengembalikan status valid/perlu klarifikasi/tidak valid beserta alasan audit.
- **AC-BNK-02**: Keputusan pembiayaan berbasis rekam jejak IASC OJK tersedia dalam <= 10 detik setelah data verifikasi diterima.
  - **Given** data verifikasi tersedia, **When** evaluasi pembiayaan dilakukan, **Then** rekomendasi keputusan dan skor risiko muncul dengan referensi jejak.
- **AC-BNK-03**: Perubahan status quasi-collateral pasca persetujuan/penolakan tercatat sinkron di middleware dan DLT pada 100% skenario uji PoC.
  - **Given** keputusan final dibuat, **When** status kontrak diperbarui, **Then** catatan status konsisten lintas sistem.

**Aktor: Regulator**

- **AC-REG-01**: Laporan kepatuhan SNAP BI + UU PDP (termasuk bukti AES-256 at-rest) dapat dihasilkan dalam <= 2 menit untuk periode audit yang dipilih.
  - **Given** periode audit dipilih, **When** Regulator meminta laporan, **Then** kontrol, bukti, dan status kepatuhan ditampilkan lengkap.
- **AC-REG-02**: Penelusuran jejak transaksi lintas modul AI-DLT berhasil pada 100% sampel audit PoC tanpa kehilangan ID korelasi.
  - **Given** satu transaksi dipilih, **When** Regulator menelusuri jejak, **Then** seluruh event terkait dapat diikuti end-to-end.
- **AC-REG-03**: Pada kegagalan endpoint eksternal simulatif, fallback Mock-API mempertahankan kelangsungan alur demo dengan skema error konsisten pada 100% percobaan.
  - **Given** endpoint eksternal tidak tersedia, **When** alur demo dijalankan, **Then** sistem tetap responsif dan menampilkan status fallback terdokumentasi.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Minimal 90% pengguna uji (petani simulatif) dapat menyelesaikan alur dari permintaan prediksi hingga pengajuan tokenisasi dalam <= 5 menit.
- **SC-002**: Minimal 95% permintaan endpoint demo-kritis merespons dalam <= 5 detik selama sesi presentasi.
- **SC-003**: Minimal 95% skenario keputusan Bank Mitra dapat ditelusuri ke bukti verifikasi rekam jejak dan log audit.
- **SC-004**: Tingkat kelengkapan laporan kepatuhan regulator mencapai 100% untuk kontrol wajib yang didefinisikan pada spesifikasi ini.

### PoC Stability Outcomes *(mandatory for hackathon scope)*

- **PSC-001**: Alur utama Mock-API demo berhasil dijalankan 3 kali berturut-turut pada lingkungan yang sama.
- **PSC-002**: Respons error endpoint demo-kritis bersifat deterministik dan mengikuti skema yang terdokumentasi.
- **PSC-003**: Tidak ada pelanggaran batas arsitektur AI-DLT di luar kontrak antarmuka yang disetujui selama uji demo.
