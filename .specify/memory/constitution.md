<!--
Sync Impact Report
- Version change: template-initial -> 1.0.0
- Modified principles:
	- Prinsip inti 1 template -> I. Anti-Vibe Coding Berbasis Spesifikasi (NON-NEGOTIABLE)
	- Prinsip inti 2 template -> II. Kepatuhan Regulasi SNAP BI dan UU PDP
	- Prinsip inti 3 template -> III. Arsitektur Hibrida Modular AI-DLT
	- Prinsip inti 4 template -> IV. Fokus PoC Stabil untuk Hackathon
- Added sections:
	- Ruang Lingkup Konstitusi
	- Implikasi Rekayasa dan Kriteria Penerimaan
- Removed sections:
	- Prinsip inti 5 template
- Templates requiring updates:
	- ✅ updated: .specify/templates/plan-template.md
	- ✅ updated: .specify/templates/spec-template.md
	- ✅ updated: .specify/templates/tasks-template.md
	- ⚠ pending: .specify/templates/commands/*.md (direktori tidak tersedia)
	- ✅ not-applicable: README.md / docs/quickstart.md (berkas tidak tersedia)
- Deferred TODOs:
	- Tidak ada
-->

# GARUDA-LINK Constitution

## Core Principles

### I. Anti-Vibe Coding Berbasis Spesifikasi (NON-NEGOTIABLE)
Semua implementasi kode WAJIB diturunkan dari spesifikasi yang telah disetujui,
minimal mencakup requirement teridentifikasi, acceptance criteria terukur, dan
traceability dua arah dari requirement ke desain, tugas, kode, dan pengujian.
Perubahan implementasi tanpa pembaruan spesifikasi yang disetujui DINYATAKAN
tidak patuh. Rationale: disiplin ini mencegah implementasi spekulatif,
mengendalikan scope, dan memungkinkan audit teknis yang objektif.

### II. Kepatuhan Regulasi SNAP BI dan UU PDP
Seluruh desain dan implementasi API WAJIB memenuhi standar keamanan SNAP Bank
Indonesia yang berlaku untuk autentikasi, otorisasi, integritas pesan, dan
manajemen kredensial. Data pribadi WAJIB dilindungi menggunakan enkripsi
AES-256 untuk data at-rest dan mekanisme kriptografi setara untuk data in-transit
sesuai UU PDP dan kebijakan keamanan proyek. Setiap kontrol keamanan WAJIB
memiliki bukti verifikasi (konfigurasi, hasil uji, atau log kontrol).
Rationale: kepatuhan regulasi adalah syarat operasional minimum, bukan opsi.

### III. Arsitektur Hibrida Modular AI-DLT
Modul AI (Python/TensorFlow) dan modul DLT/Blockchain
(Solidity/Hyperledger) WAJIB dipisahkan secara tegas pada level kode,
deployment boundary, dan hak akses. Integrasi antarmodul WAJIB melalui
kontrak antarmuka terdokumentasi (API/schema/event contract) dengan definisi
tanggung jawab yang eksplisit, termasuk ownership error handling,
observabilitas, dan fallback. Akses langsung lintas batas modul tanpa kontrak
resmi DINYATAKAN pelanggaran arsitektur. Rationale: pemisahan ini menurunkan
coupling, mempermudah verifikasi keamanan, dan menjaga evolusi komponen.

### IV. Fokus PoC Stabil untuk Hackathon
Prioritas delivery WAJIB diarahkan pada Mock-API skala kecil yang stabil,
deterministik, dan dapat didemonstrasikan end-to-end dalam konteks hackathon.
Fitur yang tidak mendukung skenario demo inti HARUS ditunda. Definisi stabil
minimum mencakup: endpoint inti berjalan konsisten, error response terstandar,
dan skrip demo dapat diulang tanpa intervensi manual non-dokumentasi.
Rationale: keberhasilan PoC ditentukan oleh keandalan demonstrasi, bukan
kelengkapan fitur produksi.

## Ruang Lingkup Konstitusi
Konstitusi ini berlaku untuk seluruh artefak dalam repositori GARUDA-LINK,
meliputi spesifikasi, rencana implementasi, kode sumber, kontrak antarmuka,
konfigurasi keamanan, pengujian, dan dokumentasi demo.

Ruang lingkup teknis minimum:
- Komponen AI berbasis Python/TensorFlow.
- Komponen DLT/Blockchain berbasis Solidity/Hyperledger.
- Lapisan integrasi API, termasuk Mock-API untuk demonstrasi.

Ketentuan keberlakuan:
- Setiap pull request WAJIB menyertakan bukti kepatuhan terhadap prinsip inti.
- Ketidakpatuhan pada satu prinsip inti cukup untuk menolak perubahan.
- Pengecualian hanya sah jika disetujui melalui prosedur amandemen governance.

## Implikasi Rekayasa dan Kriteria Penerimaan
### Implikasi Rekayasa
- Setiap feature WAJIB memiliki keterkaitan eksplisit ke requirement ID,
	acceptance criteria, dan task implementasi.
- Desain API WAJIB menyertakan kontrol keamanan SNAP BI yang relevan serta
	bukti enkripsi AES-256 pada komponen penyimpanan data pribadi.
- Batas antarmuka AI-DLT WAJIB dinyatakan melalui kontrak versi, termasuk
	format payload, SLA integrasi, dan skenario kegagalan.
- Cakupan PoC WAJIB dibatasi pada alur demo prioritas P1 dengan mock dependency
	yang terdokumentasi.

### Kriteria Penerimaan
- AC-01 Traceability: setiap requirement memiliki pemetaan ke desain, task,
	implementasi, dan minimal satu kasus uji verifikasi.
- AC-02 Regulatory: checklist kepatuhan SNAP BI terisi lengkap dan tervalidasi
	pada artefak review.
- AC-03 Data Protection: data pribadi sensitif terbukti terenkripsi AES-256
	pada storage yang relevan, dan mekanisme kunci terdokumentasi.
- AC-04 Architecture: tidak ada panggilan lintas modul AI-DLT di luar kontrak
	antarmuka yang disetujui.
- AC-05 PoC Stability: skenario demo inti berjalan sukses minimal tiga kali
	berturut-turut pada lingkungan uji yang sama.

## Governance
Konstitusi ini adalah acuan normatif tertinggi untuk proses rekayasa
GARUDA-LINK. Semua dokumen turunan HARUS konsisten terhadap konstitusi ini.

Aturan amandemen:
- Usulan perubahan WAJIB menyertakan alasan, dampak teknis, dampak proses,
	serta rencana migrasi artefak yang terdampak.
- Amandemen dinyatakan sah setelah ditinjau dan disetujui oleh minimal dua
	penanggung jawab teknis lintas modul (AI dan DLT).
- Setiap amandemen WAJIB memperbarui Sync Impact Report di dokumen ini.

Kebijakan versioning konstitusi:
- MAJOR: perubahan inkompatibel pada definisi prinsip atau penghapusan prinsip.
- MINOR: penambahan prinsip/section baru atau perluasan material yang
	menambah kewajiban audit.
- PATCH: klarifikasi redaksional tanpa perubahan makna normatif.

Ekspektasi compliance review:
- Review WAJIB memeriksa bukti traceability, kepatuhan regulasi, batas
	arsitektur, dan stabilitas PoC sebelum merge.
- Temuan pelanggaran MUST-level WAJIB ditutup sebelum persetujuan akhir.
- Audit berkala HARUS dilakukan pada setiap milestone utama hackathon.

**Version**: 1.0.0 | **Ratified**: 2026-03-17 | **Last Amended**: 2026-03-17
