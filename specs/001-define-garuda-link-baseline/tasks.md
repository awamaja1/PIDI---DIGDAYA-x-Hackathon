# Tasks: GARUDA-LINK Baseline PoC Hackathon

**Input**: Design documents from `/specs/001-define-garuda-link-baseline/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Scope Note**: Task list ini disusun khusus fase PoC Hackathon dengan 4 tahap utama yang wajib dieksekusi berurutan.

## Format: `[ID] [P?] Description with file path`

- **[P]**: Dapat dijalankan paralel (file berbeda, tanpa konflik dependensi aktif)
- Setiap task memuat dependensi eksplisit, DoD objektif, dan acceptance check lokal

## Constitution Guardrails (Wajib di semua tahap)

- Anti-Vibe Coding: semua implementasi harus menelusur ke requirement FR/NFR/CR/HA yang relevan, tanpa perubahan kontrak liar.
- SNAP BI + UU PDP: endpoint gateway menerapkan API key/JWT/HMAC; data sensitif at-rest memakai AES-256 (`pgcrypto` atau ekuivalen).
- Pemisahan AI-DLT: `ai-engine/` tidak boleh akses RPC blockchain langsung; semua orkestrasi lintas domain hanya melalui `backend-api/`.
- Stabilitas Mock-API: fallback/mock harus deterministik, schema error konsisten, dan dapat diulang lokal minimal 3x.

---

## Phase 1: Task 1 (Backend & Mock)

**Goal**: Inisialisasi `backend-api/` Node.js + Mock-API endpoint SNAP BI semantic dan API PIHPS yang stabil.

**Independent Test Criteria**: `backend-api` berjalan lokal, `/api/v1/health` sehat, endpoint mock PIHPS/IASC merespons schema standar dengan `X-Correlation-ID` konsisten.

- [ ] T001 Bootstrap project Node.js Express dan struktur dasar API gateway di `backend-api/package.json`, `backend-api/src/app.js`, `backend-api/src/api/routes/`
  Depends on: none
  DoD: `npm run start` berhasil, server bind pada port yang dikonfigurasi, dan router root terpasang.
  Acceptance Check: jalankan `cd backend-api && npm install && npm run start`, lalu `GET /api/v1/health` mengembalikan HTTP 200.

- [ ] T002 Definisikan standard response schema sukses/error di `backend-api/src/common/responseSchema.js` dan integrasikan pada route handler awal
  Depends on: T001
  DoD: seluruh respons awal memiliki `success`, `data|error`, `correlationId`, `timestamp` dengan bentuk deterministik.
  Acceptance Check: panggil endpoint sukses dan endpoint invalid, verifikasi struktur JSON identik antar percobaan input sama.

- [ ] T003 [P] Implement middleware correlation ID di `backend-api/src/middleware/correlationId.js` dan pasang global pada `backend-api/src/app.js`
  Depends on: T001
  DoD: request tanpa header menghasilkan `GARUDA-{uuid}`; request dengan header mempertahankan nilai yang sama hingga respons.
  Acceptance Check: kirim 2 request (`dengan` dan `tanpa` `X-Correlation-ID`), cek header respons + body memuat ID yang sesuai.

- [ ] T004 Implement global error handling deterministik di `backend-api/src/middleware/errorHandler.js` untuk status 4xx/5xx konsisten
  Depends on: T002, T003
  DoD: exception sinkron/asinkron dipetakan ke kode error terdokumentasi tanpa stack trace sensitif di production mode.
  Acceptance Check: trigger error validasi dan error internal simulatif; skema respons error tetap konsisten dengan `correlationId`.

- [ ] T005 [P] Buat healthcheck route layanan internal di `backend-api/src/api/routes/health.js` dan registrasi di `backend-api/src/api/routes/index.js`
  Depends on: T001, T003
  DoD: endpoint mengembalikan status backend, status mock layer, dan metadata waktu respons.
  Acceptance Check: `GET /api/v1/health` mengembalikan `healthy` dalam < 1 detik pada mesin lokal normal.

- [ ] T006 [P] Siapkan dataset mock deterministik PIHPS dan IASC di `backend-api/src/mock/data/commodity-prices.json` dan `backend-api/src/mock/data/iasc-traces.json`
  Depends on: T001
  DoD: dataset mencakup minimal 3 komoditas x 3 wilayah x 30 hari + sample trace IASC; file tervalidasi JSON.
  Acceptance Check: jalankan parser lokal (`node`) untuk validasi jumlah record dan field wajib tanpa error.

- [ ] T007 Implement endpoint Mock-API PIHPS/IASC sesuai kontrak di `backend-api/src/mock/mockServer.js` dan route adapter `backend-api/src/api/routes/mock.js`
  Depends on: T002, T003, T004, T006
  DoD: endpoint `/api/v1/mock/pihps/prices`, `/api/v1/mock/pihps/prices/{commodity}/latest`, `/api/v1/mock/iasc/verify/{referenceId}`, `/api/v1/mock/health` tersedia dan deterministik; alias legacy `/mock/*` tetap tersedia untuk backward compatibility.
  Acceptance Check: jalankan request berulang dengan parameter sama, hasil payload dan status code identik (kecuali timestamp).

- [ ] T008 Buat skrip verifikasi lokal stabilitas mock di `backend-api/scripts/verify-mock-local.ps1`
  Depends on: T005, T007
  DoD: skrip menjalankan minimal 3 putaran cek health + endpoint mock dan gagal cepat bila ada mismatch schema/error code.
  Acceptance Check: `powershell -File backend-api/scripts/verify-mock-local.ps1` selesai PASS 3/3.

---

## Phase 2: Task 2 (AI/ML)

**Goal**: Pembuatan dummy Python service untuk simulasi prediksi XGBoost-LSTM dan GNN yang deterministik via kontrak internal AI engine.

**Independent Test Criteria**: service `ai-engine` merespons endpoint prediksi/optimasi sesuai `contracts/ai-engine-contract.yaml` dengan output deterministic berdasarkan seed/input.

- [ ] T009 Bootstrap service stub FastAPI di `ai-engine/app/main.py`, `ai-engine/requirements.txt`, dan `ai-engine/app/routers/health.py`
  Depends on: T008
  DoD: server FastAPI dapat dijalankan lokal dan endpoint `/health` mengembalikan status `ok`.
  Acceptance Check: `cd ai-engine && pip install -r requirements.txt && uvicorn app.main:app --reload`, lalu `GET /health` = 200.

- [ ] T010 Implement schema input-output contract AI engine di `ai-engine/app/schemas/contracts.py` mengacu ke `specs/001-define-garuda-link-baseline/contracts/ai-engine-contract.yaml`
  Depends on: T009
  DoD: request/response model memuat field wajib termasuk `correlation_id` pattern `GARUDA-*`.
  Acceptance Check: kirim payload invalid (tanpa `correlation_id`) dan pastikan service mengembalikan 400/422 sesuai kontrak.

- [ ] T011 [P] Bangun stub inference prediksi harga XGBoost-LSTM dummy di `ai-engine/app/services/forecast_stub.py`
  Depends on: T010
  DoD: output berisi horizon prediksi, confidence band, metadata model `XGBoost-LSTM`, dan flag mock.
  Acceptance Check: request sama dua kali menghasilkan nilai prediksi identik dalam toleransi nol.

- [ ] T012 [P] Bangun stub inference optimasi rute GA+PPO+GNN dummy di `ai-engine/app/services/route_stub.py`
  Depends on: T010
  DoD: output route plan, metrics biaya/waktu/layanan, dan metadata algoritma (`GA`, `PPO` opsional, `GNN-STUB`).
  Acceptance Check: payload benchmark mengembalikan `cost_reduction_pct` konsisten dan tidak random antar run.

- [ ] T013 Implement router inference `/predict/price` dan `/optimize/route` di `ai-engine/app/routers/forecast.py` dan `ai-engine/app/routers/optimize.py`
  Depends on: T011, T012
  DoD: endpoint memanggil service stub, menerapkan validasi schema, dan selalu meneruskan `correlation_id` ke output.
  Acceptance Check: `POST /predict/price` dan `POST /optimize/route` mengembalikan HTTP 200 + schema kontrak lengkap.

- [ ] T014 Tambahkan skrip uji determinisme AI lokal di `ai-engine/tests/test_stub_determinism.py` dan `ai-engine/scripts/run_local_contract_check.py`
  Depends on: T013
  DoD: skrip memverifikasi kontrak field wajib + deterministik output minimal 3 run berturut-turut.
  Acceptance Check: `cd ai-engine && pytest ai-engine/tests/test_stub_determinism.py` PASS.

---

## Phase 3: Task 3 (Blockchain)

**Goal**: Menulis smart contract `GarudaLinkTokenization.sol` untuk mint sertifikat panen hanya saat status logistik = `Delivered`.

**Independent Test Criteria**: contract dapat dideploy lokal, mint gagal untuk status non-Delivered, dan event mint/status membawa `correlationId`.

- [ ] T015 Inisialisasi struktur Hardhat dan file kontrak di `blockchain-contracts/hardhat.config.js` dan `blockchain-contracts/contracts/GarudaLinkTokenization.sol`
  Depends on: T014
  DoD: proyek hardhat compile tanpa error dan kontrak dasar terdeteksi.
  Acceptance Check: `cd blockchain-contracts && npm install && npx hardhat compile` sukses.

- [ ] T016 Implement struktur data token dan metadata sertifikat panen pada `blockchain-contracts/contracts/GarudaLinkTokenization.sol`
  Depends on: T015
  DoD: struct token menyimpan `batchId`, `commodityCode`, `logisticsStatus`, `correlationId`, timestamp mint/update.
  Acceptance Check: test unit dapat membaca data token yang tersimpan setelah mint valid.

- [ ] T017 Implement guard status logistik `Delivered` pada fungsi mint di `blockchain-contracts/contracts/GarudaLinkTokenization.sol`
  Depends on: T016
  DoD: fungsi mint me-revert untuk status selain `Delivered` dengan pesan error yang eksplisit.
  Acceptance Check: test negatif untuk `InTransit`/`Pending` gagal sesuai revert reason.

- [ ] T018 Implement event emission dengan `correlationId` untuk mint/update status di `blockchain-contracts/contracts/GarudaLinkTokenization.sol`
  Depends on: T017
  DoD: event `CertificateMinted` dan `LogisticsStatusUpdated` memuat `tokenId` indexed dan `correlationId` non-empty.
  Acceptance Check: test event assertion memverifikasi argumen event sesuai input transaksi.

- [ ] T019 Buat test kontrak untuk guard Delivered + event integrity di `blockchain-contracts/test/GarudaLinkTokenization.test.js`
  Depends on: T018
  DoD: minimal mencakup 1 skenario sukses mint `Delivered` + 2 skenario gagal non-Delivered + verifikasi event.
  Acceptance Check: `cd blockchain-contracts && npx hardhat test` PASS untuk seluruh kasus utama.

- [ ] T020 Buat skrip deploy lokal + export ABI di `blockchain-contracts/scripts/deploy-tokenization.js` dan `blockchain-contracts/artifacts/abi/GarudaLinkTokenization.json`
  Depends on: T019
  DoD: deploy script menghasilkan address kontrak dan mengekspor ABI versi terkini untuk integrasi backend.
  Acceptance Check: `npx hardhat run scripts/deploy-tokenization.js --network besu-local` menghasilkan address + file ABI terbentuk.

---

## Phase 4: Task 4 (Frontend)

**Goal**: Membangun dashboard React sederhana untuk skor kredit dan visibilitas stok dengan integrasi gateway API.

**Independent Test Criteria**: dashboard menampilkan kartu metrik + tabel stok dari API gateway, serta memiliki state loading/error yang terverifikasi.

- [ ] T021 Bootstrap aplikasi React dashboard di `frontend/package.json`, `frontend/src/main.tsx`, dan `frontend/src/App.tsx`
  Depends on: T020
  DoD: aplikasi dapat dijalankan lokal dan route dashboard utama tersedia.
  Acceptance Check: `cd frontend && npm install && npm run dev` menampilkan halaman dashboard tanpa crash.

- [ ] T022 Implement API gateway client (tanpa direct call ke AI/DLT) di `frontend/src/services/api.ts`
  Depends on: T021
  DoD: semua fetch data melalui endpoint `backend-api` dengan header API key/JWT/correlation ID dan timeout terkelola.
  Acceptance Check: network panel menunjukkan hanya request ke backend gateway, bukan ke service AI/blockchain langsung.

- [ ] T023 Buat halaman dashboard utama di `frontend/src/pages/DashboardPage.tsx`
  Depends on: T022
  DoD: halaman memuat section skor kredit, visibilitas stok, dan status sinkronisasi tokenisasi.
  Acceptance Check: render awal menampilkan placeholder data tanpa error JavaScript.

- [ ] T024 [P] Implement komponen kartu metrik skor kredit di `frontend/src/components/dashboard/CreditScoreCards.tsx`
  Depends on: T023
  DoD: minimal tiga kartu (`Risk Score`, `Recommendation`, `Last Update`) dengan format angka/label konsisten.
  Acceptance Check: saat API sukses, nilai kartu terisi; saat API gagal, kartu menampilkan fallback state.

- [ ] T025 [P] Implement komponen tabel visibilitas stok di `frontend/src/components/dashboard/StockVisibilityTable.tsx`
  Depends on: T023
  DoD: tabel menampilkan komoditas, wilayah, harga terbaru, stok, dan status logistik dengan sorting sederhana.
  Acceptance Check: data list > 0 row tampil benar; kondisi kosong menampilkan empty state informatif.

- [ ] T026 Implement loading/error handling terstandar di `frontend/src/hooks/useDashboardData.ts` dan `frontend/src/components/common/ApiStateBanner.tsx`
  Depends on: T024, T025
  DoD: state loading, retry, dan error message deterministik untuk timeout/4xx/5xx; menampilkan `correlationId` untuk audit support.
  Acceptance Check: simulasi backend down menampilkan banner error dan tombol retry; saat pulih, data termuat ulang.

---

## Dependencies & Execution Order

### Phase Dependencies (Wajib Berurutan)

- Phase 1 (Task 1 Backend & Mock) -> Phase 2 (Task 2 AI/ML) -> Phase 3 (Task 3 Blockchain) -> Phase 4 (Task 4 Frontend)
- Tidak ada fase yang boleh mulai sebelum fase sebelumnya lulus acceptance check.

### Task Dependency Chain (Critical Path)

T001 -> T002 -> T004 -> T007 -> T008 -> T009 -> T010 -> T011 -> T013 -> T014 -> T015 -> T017 -> T018 -> T019 -> T020 -> T021 -> T022 -> T023 -> T024 -> T026

### Parallel Opportunities per Phase

- Phase 1: T003 dapat paralel dengan T002; T005 dapat paralel dengan T006 setelah T001.
- Phase 2: T011 dan T012 dapat paralel setelah T010.
- Phase 3: tidak direkomendasikan paralel pada inti kontrak; fokus berurutan untuk menghindari defect state machine.
- Phase 4: T024 dan T025 dapat paralel setelah T023.

## Implementation Strategy (PoC First)

1. Selesaikan penuh Phase 1 dan jalankan `verify-mock-local` sampai PASS 3/3.
2. Selesaikan Phase 2 dengan output deterministic dan validasi kontrak ai-engine.
3. Selesaikan Phase 3, validasi guard `Delivered`, lalu export ABI final.
4. Selesaikan Phase 4 untuk demo dashboard end-to-end terhadap backend gateway.
5. Freeze scope setelah T026, hanya bugfix blocker demo.
