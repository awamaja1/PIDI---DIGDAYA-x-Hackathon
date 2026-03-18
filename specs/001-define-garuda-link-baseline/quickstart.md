# Quickstart: GARUDA-LINK PoC

**Branch**: `001-define-garuda-link-baseline` | **Tanggal**: 2026-03-17  
**Target Demo**: Alur P1 end-to-end — Petani (prediksi harga + rute + tokenisasi)

---

## Prasyarat

| Perangkat Lunak | Versi Minimum | Catatan |
|---|---|---|
| Docker Desktop / Docker Engine | 24.x | Wajib untuk Docker Compose |
| Docker Compose | 3.9 (v2 syntax) | Bundled dengan Docker Desktop |
| Node.js | 20 LTS | Untuk development lokal di luar Docker |
| Python | 3.11 | Untuk development lokal ai-engine |
| Git | 2.40+ | |
| RAM Tersedia | **8 GB minimum** | 12 GB recommended (4-node Besu QBFT) |
| Disk Tersedia | 20 GB | Image Docker, chain data, model files |

### Opsi Fallback Hardware

Jika RAM < 8 GB, aktifkan mode Besu single-node:
```bash
export BESU_MODE=single-node
docker compose --profile besu-single up
```

---

## Langkah 1: Clone dan Setup Konfigurasi

```bash
# Clone repositori
git clone <repo-url> garuda-link
cd garuda-link
git checkout 001-define-garuda-link-baseline

# Salin file konfigurasi
cp infra/.env.example infra/.env

# Edit konfigurasi minimum yang wajib diisi
# (nilai default sudah cukup untuk demo lokal)
notepad infra/.env   # Windows
# atau: nano infra/.env   # Linux/Mac
```

**Isi wajib di `infra/.env`**:
```dotenv
# Kunci enkripsi PII — WAJIB min 32 karakter (CR-002)
PII_ENCRYPTION_KEY=garuda-poc-pii-key-2026-change-this-in-production

# JWT RS256 keys (generate via script di bawah atau gunakan default dev keys)
JWT_PRIVATE_KEY_PATH=./keys/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./keys/jwt-public.pem

# API Key untuk demo (nilai bebas untuk PoC)
DEMO_API_KEY=garuda-demo-api-key-2026

# HMAC Secret untuk message integrity (CR-001)
HMAC_SECRET=garuda-hmac-secret-2026-change-this

# Besu deployer key (HANYA untuk PoC — jangan gunakan wallet nyata)
DEPLOYER_PRIVATE_KEY=0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3d3a79cb3f4bff7c4b3d8c7a2
```

**Generate JWT keys**:
```bash
# Di terminal biasa
cd infra
node scripts/generate-jwt-keys.js
# Output: keys/jwt-private.pem dan keys/jwt-public.pem
```

---

## Langkah 2: Build dan Jalankan Seluruh Layanan

```bash
cd infra

# Build semua image dan jalankan
docker compose up --build -d

# Pantau progress boot (tunggu semua layanan "healthy")
docker compose ps
docker compose logs -f
```

**Urutan startup yang diharapkan**:
1. `postgres` — ready dalam ~15 detik
2. `besu-node1..4` — ready dalam ~30 detik (QBFT sync)
3. `ai-engine` — ready dalam ~45 detik (load model files)
4. `backend-api` — ready setelah postgres + besu ready
5. `frontend` — ready setelah backend-api ready

**Verifikasi layanan aktif**:
```bash
# Semua layanan harus "healthy"
docker compose ps

# Health check endpoint
curl http://localhost:3000/api/v1/health
# Respons yang diharapkan:
# { "status": "healthy", "services": { "database": "ok", "ai_engine": "ok", "besu_node": "ok", "mock_api": "ok" } }
```

---

## Langkah 3: Inisialisasi Database dan Deploy Smart Contract

```bash
# Jalankan migrasi database + seed data mock
docker compose exec backend-api npm run db:migrate
docker compose exec backend-api npm run db:seed

# Deploy smart contract ke local Besu
docker compose exec backend-api npm run blockchain:deploy

# Verifikasi deploy
docker compose exec backend-api npm run blockchain:verify
# Output: "HarvestTokenRegistry deployed at: 0x..."
```

---

## Langkah 4: Akses Aplikasi

| Layanan | URL | Catatan |
|---|---|---|
| **Frontend** (React) | http://localhost:5173 | UI tema Navy Blue & Gold |
| **Backend API** | http://localhost:3000 | Express REST API |
| **AI Engine** | http://localhost:8000/docs | FastAPI Swagger UI (dev mode) |
| **Besu JSON-RPC** | http://localhost:8545 | JSON-RPC Node 1 |
| **PostgreSQL** | localhost:5432 | DB: `garuda_poc`, User: `garuda_app` |

---

## Demo Alur P1: Petani — Prediksi Harga + Optimasi Rute + Tokenisasi

### Alur Lengkap via Frontend

1. Buka http://localhost:5173
2. Navigasi ke **Dashboard Petani**
3. Ikuti langkah-langkah berikut:

### Langkah A — Prediksi Harga (FR-002, AC-PET-01)

```
Dashboard Petani → Tab "Prediksi Harga"
→ Pilih Komoditas: CABAI_RAWIT
→ Pilih Wilayah: JKT
→ Klik "Prediksi 7 Hari"
→ Hasil muncul dalam ≤5 detik (NFR-002)
→ Verifikasi: grafik harga + interval kepercayaan + timestamp data sumber
```

**Cek correlation ID di respons**: Salin nilai `correlationId` untuk penelusuran audit.

### Langkah B — Optimasi Rute (FR-003, AC-PET-02)

```
Dashboard Petani → Tab "Rute Armada"
→ Origin: JKT
→ Destinations: SBY, MKS
→ Fleet Capacity: 5000 kg
→ Deadline: +24 jam dari sekarang
→ Klik "Optimasi Rute"
→ Hasil muncul dalam ≤5 detik
→ Verifikasi: peta rute + estimasi biaya + cost reduction % ≥10%
```

### Langkah C — Tokenisasi Quasi-Collateral (FR-004, AC-PET-03)

```
Dashboard Petani → Tab "Tokenisasi Panen"
→ Batch ID: BATCH-DEMO-001
→ Komoditas: CABAI_RAWIT
→ Jumlah: 2000 kg
→ Tanggal Panen: (kemarin)
→ Klik "Token Aset Panen"
→ Status: "pending_verification" muncul dalam ≤30 detik
→ TX Hash Besu ditampilkan
→ Verifikasi: token tersimpan on-chain (query via Langkah E)
```

---

## Demo Alur P2: Bank Mitra — Verifikasi + Keputusan Pembiayaan

```
Dashboard Bank Mitra → Tab "Antrian Verifikasi"
→ Lihat token BATCH-DEMO-001 (dari Langkah C)
→ Klik "Validasi Token"
→ Hasil: status "verified" + alasan audit
→ Klik "Evaluasi Pembiayaan"
→ Verifikasi IASC OJK dijalankan (≤10 detik)
→ Skor risiko + rekomendasi keputusan muncul
→ Klik "Setujui" / "Tolak"
→ Verifikasi: status token berubah on-chain + di PostgreSQL (AC-BNK-03)
```

---

## Demo Alur P3: Regulator — Audit dan Kepatuhan

```
Dashboard Regulator → Tab "Laporan Kepatuhan"
→ Period: bulan ini
→ Klik "Generate Laporan"
→ Laporan muncul dalam ≤2 menit (AC-REG-01)
→ Verifikasi: semua control CR-001..005 dengan status dan bukti

Dashboard Regulator → Tab "Penelusuran Jejak"
→ Masukkan Correlation ID dari Langkah A
→ Klik "Telusuri"
→ Verifikasi: event dari frontend → backend-api → ai-engine → blockchain semuanya muncul (AC-REG-02)
```

---

## Validasi Stabilitas PoC (NFR-001)

Jalankan skrip validasi tiga kali berturut-turut untuk memenuhi NFR-001:

```bash
# Dari root repositori
bash infra/scripts/demo-validate.sh 3
# Output: run 1/3 PASS ... run 2/3 PASS ... run 3/3 PASS
# PoC CERTIFIED: demo stable ✓
```

Skrip ini menjalankan alur P1 secara programatik (tanpa browser) dan memverifikasi:
- Respons HTTP 200 pada semua endpoint kritis
- `cost_reduction_pct >= 10` pada route optimization
- `token_status == "pending_verification"` setelah mint
- `correlationId` konsisten di audit_trail lintas modul

---

## Pengujian Unit dan Kontrak

```bash
# Backend API tests
cd backend-api
npm test

# AI Engine tests
cd ai-engine
pytest

# Smart Contract tests (Hardhat embedded network)
cd blockchain-contracts
npx hardhat test

# Contract compliance tests (validasi respons vs skema kontrak)
cd backend-api
npm run test:contract
```

---

## Menghentikan Layanan

```bash
cd infra
docker compose down        # Hentikan layanan, pertahankan data
docker compose down -v     # Hentikan + hapus volume (reset data)
```

---

## Troubleshooting

### Besu tidak start
```bash
docker compose logs besu-node1
# Jika error QBFT "waiting for peers" lebih dari 60 detik:
docker compose restart besu-node1 besu-node2 besu-node3 besu-node4
```

### AI Engine tidak load model
```bash
docker compose logs ai-engine
# Jika "model file not found" → model belum ada, gunakan mock mode:
docker compose exec ai-engine python -m app.scripts.generate_demo_models
docker compose restart ai-engine
```

### Backend API gagal konek ke PostgreSQL
```bash
docker compose logs postgres
docker compose exec backend-api npm run db:migrate  # Re-run migrasi
```

### Mock API tidak aktif
```bash
# Mock API selalu aktif in-process di backend-api
# Cek dengan:
curl http://localhost:3000/api/v1/mock/health
# Alias legacy yang tetap didukung:
# curl http://localhost:3000/mock/health
# Jika 404 → backend-api belum ready, tunggu
```

### Reset total demo
```bash
cd infra
docker compose down -v
docker compose up --build -d
docker compose exec backend-api npm run db:migrate
docker compose exec backend-api npm run db:seed
docker compose exec backend-api npm run blockchain:deploy
```

---

## Struktur Environment Variables Lengkap

Lihat `infra/.env.example` untuk daftar lengkap semua variabel dengan penjelasan.

Variabel kritis keamanan yang WAJIB diubah sebelum demo:
- `PII_ENCRYPTION_KEY` — min 32 karakter (CR-002)
- `HMAC_SECRET` — min 32 karakter (CR-001)
- `DEMO_API_KEY` — nilai unik untuk demo (CR-001)

Variabel yang TIDAK BOLEH di-hardcode di kode:
- Semua secrets dan keys hanya dari environment variables
- Tidak ada fallback ke nilai default yang dapat ditebak di kode produksi
