# Research: GARUDA-LINK Baseline PoC

**Branch**: `001-define-garuda-link-baseline` | **Tanggal**: 2026-03-17  
**Status**: Selesai — semua NEEDS CLARIFICATION terselesaikan

---

## R-001: Model Hibrida XGBoost-LSTM untuk Prediksi Harga Komoditas

**Kebutuhan**: FR-002, AC-PET-01 — prediksi harga 7 hari ke depan dengan interval kepercayaan

### Keputusan
Pipeline sequential dua tahap:
1. **XGBoost** sebagai feature extractor dan baseline predictor (lag features, rolling stats, indikator musiman)
2. **LSTM (Keras/TensorFlow)** sebagai temporal refinement model yang menerima output XGBoost sebagai fitur tambahan

### Justifikasi
- XGBoost memberikan interpretabilitas feature importance (nilai untuk narasi demo ke Bank Mitra/Regulator)
- LSTM menangkap dependensi temporal jangka pendek (7 hari) yang relevan untuk data harga komoditas musiman
- Pipeline ini dapat dilatih ulang offline sebelum demo dengan data seed 30 hari (3 komoditas × 3 wilayah)
- Output confidence interval via quantile regression pada LSTM output layer (`lower_q=0.1, upper_q=0.9`)

### Implementasi PoC
```
ai-engine/app/models/price_model.py
  ├── XGBoostFeaturizer: fit(X_train) → transform(X) → feature matrix
  ├── LSTMForecaster: fit(X_seq_train) → predict(X_seq) → (point_forecast, ci_low, ci_high)
  └── HybridPriceModel: XGBoostFeaturizer | LSTMForecaster → joblib serialization
```

Model serialized tersimpan di `ai-engine/models/saved/` dan di-load saat startup FastAPI. Mode `MOCK=true` mengembalikan prediksi deterministik dari `mock_responses.py` tanpa memanggil model.

### Alternatif yang Ditolak
- **Pure ARIMA**: Tidak mendukung narasi AI hackathon, tidak menangani non-linearity
- **Pure LSTM**: Kurang interpretable, training lebih lama, tidak ada feature importance
- **Prophet (Meta)**: Bagus untuk seasonality tapi tidak mendukung custom feature injection

### Referensi Best Practice
- Serialisasi model: `joblib.dump` untuk XGBoost, `model.save('lstm.keras')` untuk TF/Keras
- Inference time: < 2 detik untuk horizon 7 hari pada dataset 30 hari (`AC-PET-01` ≤ 5 detik)

---

## R-002: Optimasi Rute GA + PPO + HSTE-GNN

**Kebutuhan**: FR-003, AC-PET-02 — rute dinamis dengan pengurangan biaya ≥ 10% vs baseline statis

### Keputusan
Arsitektur tiga lapisan dengan kompleksitas bertingkat:

| Lapisan | Algoritma | Library | Peran dalam PoC |
|---|---|---|---|
| L1: Initial Solution | Genetic Algorithm (GA) | DEAP 1.4 | Solver utama; cukup untuk demo |
| L2: Policy Refinement | PPO (Proximal Policy Optimization) | stable-baselines3 2.x | Opsional untuk narasi RL |
| L3: Demand Encoding | HSTE-GNN (stub) | Pre-computed embedding | Diimplementasi sebagai static lookup |

**Strategi PoC**: L1 (GA via DEAP) dijalankan penuh. L2 (PPO) dieksekusi jika `ENABLE_PPO=true` di env (default: false untuk stabilitas demo). L3 (GNN) menggunakan embedding statis per wilayah yang di-load dari file JSON.

### Justifikasi
- GA (DEAP) memberikan hasil yang cukup baik untuk 3–10 titik distribusi dalam < 5 detik
- PPO membutuhkan environment training tersendiri; untuk PoC, pre-trained policy dimuat dari file
- HSTE-GNN full implementation membutuhkan data graph temporal yang tidak tersedia dalam 30 hari mock data; stub cukup untuk narasi arsitektur
- Target `AC-PET-02` (pengurangan biaya ≥ 10%) tercapai dengan GA pada dataset benchmark internal

### Implementasi PoC
```
ai-engine/app/models/route_model.py
  ├── GARouteSolver: DEAP toolbox, minimisasi fungsi biaya multi-objektif
  ├── PPOPolicyLoader: load policy dari saved/ jika ENABLE_PPO=true
  ├── GNNEmbeddingStub: load static embeddings dari embeddings/region_embeddings.json
  └── RouteOptimizer: orchestrate GA → (PPO refinement) → GNN context → output plan
```

### Alternatif yang Ditolak
- **OR-Tools (Google)**: Tidak ada narasi AI/ML untuk hackathon
- **Pure PPO**: Konvergensi lambat, tidak reproducible tanpa fixed seed dan pre-training
- **Full HSTE-GNN**: Memerlukan dynamic spatio-temporal graph data yang tidak tersedia dalam scope PoC

---

## R-003: Hyperledger Besu QBFT — Setup Lokal PoC

**Kebutuhan**: FR-004, AC-BNK-01, AC-BNK-03 — tokenisasi on-chain deterministik dan reproducible

### Keputusan
Docker Compose 4-node Hyperledger Besu dengan konsensus QBFT, ekspos JSON-RPC di `localhost:8545`.

### Konfigurasi

```yaml
# blockchain-contracts/besu-config/docker-compose.besu.yml
services:
  besu-node1:  # validator 1, port 8545 (JSON-RPC), port 30303 (P2P)
  besu-node2:  # validator 2
  besu-node3:  # validator 3
  besu-node4:  # validator 4
```

Konfigurasi genesis QBFT:
- `blockperiodseconds: 2` — finality cepat untuk demo
- `epochlength: 30000`
- `requesttimeoutseconds: 4`
- Chain ID: `1337` (standard local dev)

Toolchain smart contract:
- **Hardhat 2.22** dengan `@nomicfoundation/hardhat-ethers` + `ethers.js 6`
- Deploy script: `blockchain-contracts/scripts/deploy.js`
- Testing: Mocha/Chai (embedded Hardhat network untuk unit test; local Besu untuk integration test)

### Justifikasi
- 4-node QBFT memungkinkan narasi "enterprise blockchain" yang valid untuk juri hackathon
- `blockperiodseconds: 2` memastikan konfirmasi transaksi dalam < 5 detik (memenuhi `NFR-002`)
- Docker Compose memastikan reproducibility on any demo machine (Linux/WSL2)
- Single-node dev mode tersedia sebagai fallback jika RAM demo < 8GB

### Spesifikasi Hardware Minimum
- RAM: 8 GB (12 GB recommended)
- CPU: 4 core
- Disk: 20 GB available

### Alternatif yang Ditolak
- **Ganache**: Tidak mendukung QBFT, tidak ada narasi enterprise
- **Hardhat Network in-process**: Tidak ada P2P node, tidak valid sebagai DLT demo
- **Polygon testnet**: Dependensi internet eksternal melanggar PoC offline-stable

---

## R-004: SNAP BI Security Controls Mapping

**Kebutuhan**: CR-001..005, AC-REG-01 — kontrol keamanan terverifikasi dengan bukti

### Keputusan

| SNAP BI Area | Kontrol Teknis | Implementasi |
|---|---|---|
| Autentikasi mesin-ke-mesin | API Key | Header `X-API-Key`, validasi di `auth.js` |
| Autentikasi sesi pengguna | JWT RS256 | Header `Authorization: Bearer`, validasi signature publik key |
| Integritas pesan (endpoint kritis) | HMAC-SHA256 | Header `X-Signature: hmac-sha256 <hash>` pada `/tokens/*` dan `/financing/*` |
| Manajemen kredensial | Environment variables | `.env` file, tidak commit, `.env.example` tanpa nilai sensitif |
| Enkripsi in-transit | TLS 1.2+ | Reverse proxy (nginx) di depan backend-api di lingkungan non-demo |
| Enkripsi at-rest (PII) | AES-256 via pgcrypto | `pgp_sym_encrypt(nik, $KEY)`, `pgp_sym_encrypt(name, $KEY)` di PostgreSQL |
| Least privilege | Role DB terpisah | `garuda_app` (SELECT/INSERT/UPDATE), `garuda_admin` (DDL) |
| Audit log | Tabel `audit_trail` | Setiap aksi kritis → INSERT ke `audit_trail` dengan `correlation_id` |

### Bukti Verifikasi per Kontrol

| Kontrol | File Bukti |
|---|---|
| API Key middleware | `backend-api/src/middleware/auth.js` + `tests/unit/auth.test.js` |
| JWT validation | `backend-api/src/middleware/auth.js` + env `JWT_PUBLIC_KEY` |
| HMAC signature | `backend-api/src/middleware/hmac.js` + `tests/integration/hmac.test.js` |
| pgcrypto AES-256 | `backend-api/src/db/migrations/001_encrypt_pii.sql` |
| Role DB | `infra/scripts/db-seed.sh` (CREATE ROLE statements) |
| Audit trail | `backend-api/src/services/auditService.js` |

### Alternatif yang Ditolak
- **OAuth2 full flow**: Terlalu kompleks untuk PoC; JWT RS256 sudah memenuhi SNAP BI authentication requirement
- **Vault (HashiCorp)**: Dependensi tambahan; env var cukup untuk PoC

---

## R-005: Pola Correlation ID Lintas Modul

**Kebutuhan**: NFR-004, AC-REG-02 — penelusuran jejak end-to-end tanpa kehilangan ID

### Keputusan

**Format**: `GARUDA-{uuid4}` — contoh: `GARUDA-550e8400-e29b-41d4-a716-446655440000`

**Alur propagasi**:

```
Frontend generate → header X-Correlation-ID
    ↓
backend-api middleware attach ke req.correlationId
    ↓ dikirim ke ai-engine
    body.correlation_id (field wajib di semua request)
    ↓ dikirim ke Besu
    parameter correlationId di fungsi Solidity (string, indexed di event)
    ↓ disimpan di PostgreSQL
    kolom correlation_id di: commodity_prices, price_forecasts, fleet_routes,
    harvest_assets, financing_applications, iasc_traces, audit_trail
    ↓ dikembalikan ke Frontend
    field correlationId di setiap response JSON
```

**Query audit**: `SELECT * FROM audit_trail WHERE correlation_id = 'GARUDA-...' ORDER BY timestamp`

### Implementasi
```javascript
// backend-api/src/middleware/correlationId.js
const { v4: uuidv4 } = require('uuid');
module.exports = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || `GARUDA-${uuidv4()}`;
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
};
```

---

## R-006: Integrasi Node.js ↔ Python (FastAPI)

**Kebutuhan**: HA-002, HA-003 — komunikasi antarmodul via kontrak resmi

### Keputusan
**HTTP REST (FastAPI)** berjalan sebagai container terpisah di Docker network `garuda-net`. Node.js memanggil via `axios` dengan timeout 8 detik.

### Justifikasi
- FastAPI mendukung async natively, kompatibel dengan model AI yang berat
- HTTP REST memungkinkan testing/mocking independen (via `msw` atau `pytest`)
- Circuit breaker di Node.js (`circuitBreaker.js`) menangani fallback jika ai-engine down
- Tidak ada `child_process.spawn` Python dari Node.js — ini melanggar HA-003

### Pola Sinkron vs Asinkron (PoC)
- **Sinkron** (HTTP request-response): digunakan untuk `/predict/price` dan `/optimize/route`  
  Alasan: response time < 8 detik acceptable untuk demo; tidak perlu job queue
- **Asinkron dengan polling** (opsional): `X-Processing-Mode: async` header  
  Diaktifkan jika model training time > 8 detik (tidak expected untuk PoC dataset kecil)

### Circuit Breaker Config (di backend-api)
```javascript
// Jika ai-engine tidak merespons dalam 8 detik → fallback ke mock
const CIRCUIT_TIMEOUT_MS = 8000;
const FALLBACK_KEY = 'AI_ENGINE_FALLBACK';
```

---

## Ringkasan Resolusi NEEDS CLARIFICATION

| Item | Status | Keputusan Final |
|---|---|---|
| Versi Python dan framework AI | ✅ Resolved | Python 3.11 + FastAPI 0.110 + TF/Keras 2.16 |
| XGBoost-LSTM hybrid approach | ✅ Resolved | Sequential pipeline, joblib serialization |
| GA/PPO/GNN untuk route optimization | ✅ Resolved | DEAP GA utama, PPO opsional, GNN stub |
| Besu QBFT local setup | ✅ Resolved | Docker Compose 4-node, genesis QBFT, port 8545 |
| SNAP BI controls implementation | ✅ Resolved | API Key + JWT RS256 + HMAC-SHA256 |
| PostgreSQL AES-256 | ✅ Resolved | pgcrypto pgp_sym_encrypt, key via env var |
| Correlation ID format dan propagation | ✅ Resolved | GARUDA-{uuid4}, header + body + on-chain + DB |
| Node.js ↔ Python integration mode | ✅ Resolved | HTTP REST FastAPI, axios, circuit breaker |
| Demo hardware requirements | ✅ Resolved | 8GB RAM minimum, Docker Compose |
