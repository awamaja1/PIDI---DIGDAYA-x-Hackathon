# Rencana Implementasi: GARUDA-LINK Baseline PoC

**Branch**: `001-define-garuda-link-baseline` | **Tanggal**: 2026-03-17 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification — `/specs/001-define-garuda-link-baseline/spec.md`

## Ringkasan

GARUDA-LINK adalah middleware logistik dan pembiayaan berbasis AI-DLT untuk komoditas pertanian Indonesia. PoC ini mengimplementasikan alur end-to-end: agregasi data harga PIHPS → prediksi harga XGBoost-LSTM → optimasi rute GA+PPO → tokenisasi quasi-collateral di Hyperledger Besu QBFT → verifikasi IASC OJK → dashboard keputusan tiga aktor (Petani, Bank Mitra, Regulator). Seluruh komponen terhubung melalui backend Node.js/Express sebagai API Gateway, dengan fallback Mock-API deterministik untuk stabilitas demo hackathon.

## Technical Context

**Language/Version**:  
- Frontend: Node.js 20 LTS / React 18 (TypeScript 5)  
- Backend API Gateway: Node.js 20 LTS + Express 4  
- AI/ML: Python 3.11 + FastAPI 0.110  
- Smart Contract: Solidity 0.8.24 + Hardhat 2.22  
- Database: PostgreSQL 16  

**Primary Dependencies**:  
- Frontend: React 18, React Router 6, Axios, TailwindCSS (tema Navy Blue `#1B2A4A` & Gold `#C9A84C`)  
- Backend: Express 4, ethers.js 6, pg (node-postgres), winston, uuid, axios, joi  
- AI Engine: FastAPI, XGBoost 2.x, TensorFlow/Keras 2.16, DEAP (GA), stable-baselines3 (PPO), scikit-learn, pandas, numpy, joblib  
- Blockchain: Hardhat 2, OpenZeppelin Contracts 5, ethers.js 6  
- Infrastruktur: Docker Compose 3.9, Hyperledger Besu 24.x (QBFT, 4-node local cluster)  

**Storage**: PostgreSQL 16 — data at-rest dienkripsi AES-256 via `pgcrypto` (kolom sensitif) + enkripsi tingkat field untuk PII (NIK hash)  

**Testing**:  
- Frontend: Jest + React Testing Library  
- Backend: Jest + Supertest  
- AI Engine: pytest + pytest-asyncio  
- Smart Contract: Hardhat + Mocha/Chai  

**Target Platform**: Docker Compose pada mesin demo lokal (Linux/WSL2); tidak memerlukan cloud eksternal  

**Project Type**: Hybrid web-service — API Gateway + AI microservice + DLT node cluster + web frontend  

**Performance Goals** (dari NFR-002):  
- Endpoint utama demo: ≤ 5 detik respons per permintaan  
- Keputusan pembiayaan: ≤ 10 detik setelah data verifikasi tersedia (AC-BNK-02)  
- Laporan kepatuhan: ≤ 2 menit (AC-REG-01)  
- Tokenisasi quasi-collateral: ≤ 3 menit per batch panen (AC-PET-03)  

**Constraints**:  
- Mock-API HARUS meniru skema semantik endpoint aktual PIHPS dan IASC OJK  
- Dataset mock: minimal 3 komoditas, 3 wilayah, 30 hari histori (dari Assumptions & Mock-API Policy)  
- Demo wajib deterministik dan repeatable tanpa intervensi manual (NFR-001)  
- Tidak ada integrasi produksi eksternal (Out of Scope)  

**Scale/Scope**: Hackathon PoC — volume demo terbatas, 3 komoditas, kapasitas komputasi single-machine

## Constitution Check

*GATE: Dievaluasi sebelum Phase 0. Dievaluasi ulang setelah Phase 1 desain.*

### Gate 1 — Anti-Vibe Coding Berbasis Spesifikasi

**Status**: ✅ LULUS

Semua komponen desain dapat ditelusuri ke requirement ID yang disetujui:

| Requirement ID | Acceptance Criteria | Komponen Desain | Modul |
|---|---|---|---|
| FR-001, FR-002 | AC-PET-01 | Price Forecasting Service | ai-engine |
| FR-003 | AC-PET-02 | Route Optimization Service | ai-engine |
| FR-004, AC-PET-03 | AC-BNK-01 | Asset Tokenization + HarvestTokenRegistry | blockchain-contracts + backend-api |
| FR-005 | AC-BNK-02 | IASC Trace Verification Gateway | backend-api |
| FR-006, HA-001..003 | AC-REG-02 | AI-DLT Interface Contract (versioned) | contracts/ |
| CR-001..005, FR-009 | AC-REG-01 | Compliance Controls + Audit Trail | backend-api + PostgreSQL |
| FR-007 | AC-BNK-03 | Dashboard multi-aktor | frontend |
| FR-008, NFR-003 | AC-REG-03 | Mock-API Resilience Layer | backend-api |
| NFR-001..005 | semua AC | Infrastruktur Docker Compose deterministik | infra/ |

Setiap task implementasi WAJIB mencantumkan Requirement ID pada deskripsinya (diimplementasikan saat `/speckit.tasks`).

### Gate 2 — Kepatuhan Regulasi SNAP BI + UU PDP

**Status**: ✅ LULUS

| Kontrol | Mekanisme | Bukti Verifikasi |
|---|---|---|
| SNAP BI — Autentikasi | API Key (header `X-API-Key`) + JWT RS256 (header `Authorization`) | Konfigurasi middleware auth di `backend-api/src/middleware/auth.js` |
| SNAP BI — Integritas Pesan | HMAC-SHA256 signature pada endpoint tokenisasi dan pembiayaan | Unit test HMAC di `backend-api/tests/integration/hmac.test.js` |
| SNAP BI — Manajemen Kredensial | Secrets via environment variables; tidak ada hardcoded credential | Checklist scan `.env.example` tanpa nilai sensitif |
| UU PDP — Enkripsi at-rest | `pgcrypto` AES-256 untuk kolom PII (NIK, nama): `pgp_sym_encrypt` | Migrasi PostgreSQL: `migrations/001_encrypt_pii.sql` |
| UU PDP — Enkripsi in-transit | TLS 1.2+ wajib di lingkungan produksi; `NODE_TLS_REJECT_UNAUTHORIZED=1` | Docker network + env config |
| CR-004 — Least Privilege | Role database terpisah: `garuda_app` (DML only), `garuda_admin` (DDL only) | Script setup DB |
| CR-005 — Fail Visible | Setiap kegagalan kontrol keamanan → HTTP 503 dengan `degradation_reason` | Kontrak error di `contracts/frontend-api-contract.yaml` |

### Gate 3 — Arsitektur Hibrida Modular AI-DLT

**Status**: ✅ LULUS

```
┌─────────────────────────────────────────────────────────────────┐
│                     BOUNDARY AI (ai-engine/)                    │
│  Python/FastAPI  │  XGBoost-LSTM  │  GA/PPO/HSTE-GNN            │
│  Owner: Tim AI   │  TIDAK BOLEH   │  memanggil DLT langsung      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP REST (kontrak terversi v1)
                               │ contracts/ai-engine-contract.yaml
┌──────────────────────────────┴──────────────────────────────────┐
│              BACKEND-API (backend-api/) — API Gateway           │
│  Node.js/Express  │  Orchestrator  │  Audit Trail Writer        │
│  SATU-SATUNYA      │  lapisan yang  │  boleh mengakses keduanya  │
└──────┬─────────────────────────────────────────┬────────────────┘
       │ JSON-RPC (ethers.js)                    │ pg (SQL)
       │ contracts/blockchain-rpc-contract.yaml  │
┌──────┴─────────────────────────┐   ┌───────────┴────────────────┐
│  BOUNDARY DLT                  │   │  PostgreSQL 16              │
│  (blockchain-contracts/)       │   │  pgcrypto AES-256           │
│  Solidity/Hyperledger Besu     │   │  Owner: Tim Data           │
│  QBFT, 4-node local            │   └────────────────────────────┘
│  Owner: Tim Blockchain         │
└────────────────────────────────┘
```

Pelanggaran yang dilarang (HA-003): `ai-engine` TIDAK BOLEH memanggil Besu JSON-RPC secara langsung. `blockchain-contracts` TIDAK BOLEH memanggil Python service. Seluruh orkestrasi via `backend-api`.

### Gate 4 — Fokus PoC Stabil untuk Hackathon

**Status**: ✅ LULUS

| Kriteria | Implementasi |
|---|---|
| Mock-API deterministik | `backend-api/src/mock/` — PIHPS dan IASC mock dengan data seed JSON statis |
| Fallback otomatis | Middleware `circuitBreaker` — jika endpoint aktual timeout > 3s, switch ke mock transparan |
| Demo repeatable | `quickstart.md` + `docker compose up --build` + seed script `npm run db:seed` |
| Non-goal eksplisit | Sesuai Out of Scope spec: tidak ada core banking, tidak ada multi-country, tidak ada disbursement engine |
| Stabilitas NFR-001 | Skrip validasi `scripts/demo-validate.sh` menjalankan alur P1 tiga kali berturut-turut |

### Kebijakan Versioning dan Deprecation Mock-API

Kebijakan ini menstandarkan namespace endpoint mock agar konsisten dengan pola API versioning.

- Namespace utama (canonical): `/api/v1/mock/*`
- Namespace alias legacy: `/mock/*` (tetap aktif selama masa transisi)

| Milestone | Tanggal Target | Kebijakan |
|---|---|---|
| Aktivasi canonical path | 2026-03-18 | Seluruh dokumentasi dan contoh request baru WAJIB menggunakan `/api/v1/mock/*`. |
| Masa transisi alias legacy | 2026-03-18 s.d. 2026-04-30 | `/mock/*` tetap dilayani untuk backward compatibility, namun ditandai deprecated di kontrak. |
| Evaluasi sunset alias legacy | 2026-05-01 | Putuskan mempertahankan atau menonaktifkan `/mock/*` berdasarkan dampak integrasi demo dan hasil regression test. |

Aturan implementasi:
- Perubahan endpoint baru pada modul mock hanya boleh ditambahkan pada namespace canonical `/api/v1/mock/*`.
- Alias `/mock/*` harus memetakan handler yang sama untuk mencegah drift perilaku.
- Uji regresi endpoint mock wajib memverifikasi kedua path selama masa transisi.

### Post-Phase 1 Re-evaluation

**Status**: ✅ LULUS — Desain data model dan kontrak antarmuka tidak menambah pelanggaran. Semua boundary AI-DLT dipertahankan. Kontrak versi `v1` terdefinisi pada semua interface. Tidak ada kompleksitas tambahan di luar kebutuhan PoC.

## Struktur Proyek

### Dokumentasi (fitur ini)

```text
specs/001-define-garuda-link-baseline/
├── plan.md              # File ini (output /speckit.plan)
├── research.md          # Output Phase 0 (/speckit.plan)
├── data-model.md        # Output Phase 1 (/speckit.plan)
├── quickstart.md        # Output Phase 1 (/speckit.plan)
├── contracts/           # Output Phase 1 (/speckit.plan)
│   ├── ai-engine-contract.yaml
│   ├── blockchain-rpc-contract.yaml
│   ├── mock-api-contract.yaml
│   └── frontend-api-contract.yaml
└── tasks.md             # Output Phase 2 (perintah /speckit.tasks — BELUM dibuat)
```

### Source Code (root repositori)

```text
frontend/                          # React 18 + TypeScript 5 — UI tema Navy Blue & Gold
├── public/
├── src/
│   ├── components/
│   │   ├── common/                # Tombol, tabel, badge reusable
│   │   ├── dashboard/             # DashboardPetani, DashboardBank, DashboardRegulator
│   │   ├── forecast/              # PriceChart, ConfidenceInterval
│   │   ├── logistics/             # RouteMap, FleetPanel
│   │   └── financing/             # TokenStatusCard, FinancingDecision
│   ├── pages/                     # SPA routes: /petani, /bank, /regulator, /audit
│   ├── services/
│   │   └── api.ts                 # Axios client — semua calls ke backend-api
│   ├── hooks/                     # useCorrelationId, useForecast, useRoute, useToken
│   ├── theme/                     # Tailwind config Navy (#1B2A4A) & Gold (#C9A84C)
│   └── types/                     # TypeScript interfaces mirroring API contracts
├── tests/
└── package.json

backend-api/                       # Node.js 20 + Express 4 — API Gateway & Orchestrator
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── prices.js          # FR-001: /api/v1/prices/*
│   │   │   ├── forecast.js        # FR-002: /api/v1/forecast/*
│   │   │   ├── routes.js          # FR-003: /api/v1/routes/*
│   │   │   ├── tokens.js          # FR-004: /api/v1/tokens/*
│   │   │   ├── financing.js       # FR-005: /api/v1/financing/*
│   │   │   ├── compliance.js      # FR-009: /api/v1/compliance/*
│   │   │   └── health.js
│   │   └── validators/            # Joi schema validation per route
│   ├── middleware/
│   │   ├── auth.js                # CR-001: API Key + JWT RS256
│   │   ├── hmac.js                # CR-001: HMAC-SHA256 message integrity
│   │   ├── correlationId.js       # NFR-004: X-Correlation-ID generation & propagation
│   │   ├── circuitBreaker.js      # FR-008: fallback ke Mock-API jika external timeout
│   │   └── errorHandler.js        # NFR-003: standardized error response schema
│   ├── services/
│   │   ├── aiEngineClient.js      # HTTP client ke ai-engine (axios, async/await)
│   │   ├── besuClient.js          # JSON-RPC client ke Hyperledger Besu (ethers.js)
│   │   ├── iascMockClient.js      # Adaptor IASC OJK Mock (FR-005, FR-008)
│   │   ├── auditService.js        # FR-009: tulis AuditTrail ke PostgreSQL
│   │   └── pihpsMockClient.js     # Adaptor PIHPS Mock (FR-001, FR-008)
│   ├── mock/
│   │   ├── data/
│   │   │   ├── commodity-prices.json   # 3 komoditas × 3 wilayah × 30 hari
│   │   │   └── iasc-traces.json        # Sample trace records
│   │   └── mockServer.js              # Statis dalam-proses, tidak butuh server terpisah
│   ├── db/
│   │   ├── pool.js                # pg connection pool
│   │   └── migrations/            # SQL migration files (pgcrypto setup, schema)
│   └── app.js                     # Express app entrypoint
├── tests/
│   ├── unit/
│   ├── integration/
│   └── contract/                  # Validasi kontrak API terhadap contracts/
├── .env.example
└── package.json

ai-engine/                         # Python 3.11 + FastAPI — AI/ML Microservice
├── app/
│   ├── main.py                    # FastAPI app entrypoint
│   ├── routers/
│   │   ├── forecast.py            # FR-002: POST /predict/price (XGBoost-LSTM)
│   │   ├── optimize.py            # FR-003: POST /optimize/route (GA + PPO)
│   │   └── health.py
│   ├── models/
│   │   ├── price_model.py         # XGBoost pipeline + LSTM sequential model (Keras)
│   │   └── route_model.py         # GA (DEAP) + PPO (stable-baselines3) + GNN stub
│   ├── schemas/
│   │   └── contracts.py           # Pydantic models — mirror ai-engine-contract.yaml
│   ├── mock/
│   │   └── mock_responses.py      # Respons deterministik untuk mode demo
│   └── config.py
├── tests/
│   ├── unit/
│   └── integration/
├── requirements.txt
└── Dockerfile

blockchain-contracts/              # Solidity 0.8.24 + Hardhat — Smart Contracts & Besu
├── contracts/
│   ├── HarvestTokenRegistry.sol   # FR-004: mint/updateStatus/getToken + events
│   └── interfaces/
│       └── IHarvestToken.sol      # Interface eksplisit (HA-002)
├── scripts/
│   ├── deploy.js                  # Deploy ke local Besu node
│   └── seed.js                    # Mint sample token untuk demo
├── test/
│   └── HarvestTokenRegistry.test.js
├── besu-config/                   # QBFT genesis + static-nodes.json
│   ├── genesis.json
│   ├── static-nodes.json
│   └── docker-compose.besu.yml    # 4-node Besu cluster
├── hardhat.config.js
└── package.json

infra/                             # Orkestrasi Docker Compose
├── docker-compose.yml             # Semua layanan: frontend, backend-api, ai-engine, besu, postgres
├── .env.example
└── scripts/
    ├── demo-validate.sh           # NFR-001: 3× end-to-end run validation
    └── db-seed.sh                 # Seed PostgreSQL + deploy smart contract
```

**Keputusan Struktur**: Empat bounded context (frontend, backend-api, ai-engine, blockchain-contracts) dalam satu monorepo. Pemisahan ini memenuhi HA-001 (boundary tegas AI vs DLT), mendukung deployment independen, dan memungkinkan pengujian unit/kontrak per lapisan tanpa dependensi silang.

---

## Alur Integrasi Rinci

### Diagram Alur Data End-to-End

```
[Browser — React Frontend]
    │ HTTP REST JSON + header:
    │   Authorization: Bearer <JWT>
    │   X-API-Key: <api-key>
    │   X-Correlation-ID: GARUDA-<uuid4>
    │
    ▼
[backend-api :3000 — Express API Gateway]
    │
    ├─[A: Prediksi Harga]─────────────────────────────────────
    │   POST /api/v1/forecast/price
    │   → aiEngineClient.js
    │       │ HTTP POST ai-engine:8000/predict/price
    │       │   body: { commodity_code, region_code, horizon_days, correlation_id }
    │       │   timeout: 8s → jika gagal → circuitBreaker → pihpsMockClient
    │       ▼
    │   [ai-engine :8000 — FastAPI]
    │       → price_model.py (XGBoost pipeline → LSTM refinement)
    │       ← { predictions[], confidence_interval, model_version, correlation_id }
    │   ← response disimpan ke audit_trail (PostgreSQL)
    │
    ├─[B: Optimasi Rute]──────────────────────────────────────
    │   POST /api/v1/routes/optimize
    │   → aiEngineClient.js
    │       │ HTTP POST ai-engine:8000/optimize/route
    │       │   body: { origin, destinations[], fleet[], deadline, correlation_id }
    │       ▼
    │   [ai-engine :8000 — FastAPI]
    │       → route_model.py (GA initial → PPO refinement → GNN stub encoding)
    │       ← { route_plan, cost_estimate, duration_min, service_level, correlation_id }
    │   ← response + audit_trail write
    │
    ├─[C: Tokenisasi Aset Panen]──────────────────────────────
    │   POST /api/v1/tokens/mint
    │   → Validasi data input (Joi schema)
    │   → auditService: catat status PENDING ke audit_trail
    │   → besuClient.js
    │       │ ethers.js → JSON-RPC POST http://besu-node1:8545
    │       │   contract: HarvestTokenRegistry.mintToken(...)
    │       │   event emitted: TokenMinted(tokenId, batchId, correlationId)
    │       ▼
    │   [Hyperledger Besu — QBFT 4-node :8545]
    │       → Transaction mined (QBFT finality)
    │       ← txHash, tokenId, blockNumber
    │   → HarvestAsset record UPDATE: token_id, besu_tx_hash, status='pending_verification'
    │   ← { tokenId, txHash, status, correlationId }
    │
    ├─[D: Verifikasi & Keputusan Pembiayaan]──────────────────
    │   POST /api/v1/financing/evaluate
    │   → iascMockClient.js
    │       │ GET mock/iasc/verify/{referenceId}
    │       │   (atau endpoint IASC aktual jika tersedia, timeout 5s → fallback)
    │       ← { verificationStatus, proofHash, traceRef }
    │   → Scoring risiko (rule-based di Node.js untuk PoC)
    │   → FinancingApplication UPDATE dengan decision + iasc_trace_ref
    │   → auditService: catat keputusan ke audit_trail
    │   ← { decision, riskScore, rationale, iascTraceRef, correlationId }
    │
    └─[E: Pembaruan Status Token Post-Keputusan]──────────────
        POST /api/v1/tokens/{tokenId}/status
        → besuClient.js
            │ HarvestTokenRegistry.updateStatus(tokenId, newStatus, correlationId)
            ← txHash, updatedStatus
        → HarvestAsset UPDATE token_status
        → auditService: catat perubahan status
        ← { tokenId, newStatus, txHash, correlationId }
```

### Correlation ID — Traceability Lintas Modul

| Titik | Aksi | Penyimpanan |
|---|---|---|
| Frontend (request masuk) | Generate `GARUDA-{uuid4}` jika tidak ada | Header `X-Correlation-ID` |
| backend-api middleware | Attach ke setiap `req.correlationId` | Log winston (JSON) |
| ai-engine call | Dikirim di request body `correlation_id` | Log FastAPI + response body |
| Besu transaction | Encode sebagai parameter `correlationId` di fungsi Solidity | Event log on-chain (indexed) |
| PostgreSQL audit_trail | Kolom `correlation_id` di setiap record | Query-able untuk audit |
| Response ke Frontend | Field `correlationId` di setiap response JSON | Ditampilkan di UI audit trail |

### Error Handling — Skema Standar (NFR-003)

```json
{
  "error": {
    "code": "FORECAST_ENGINE_UNAVAILABLE",
    "httpStatus": 503,
    "message": "Layanan prediksi tidak merespons. Menggunakan data fallback.",
    "correlationId": "GARUDA-550e8400-e29b-41d4-a716-446655440000",
    "module": "backend-api",
    "timestamp": "2026-03-17T10:00:00.000Z",
    "fallbackActive": true
  }
}
```

Kode error terdefinisi per modul:

| Kode | Modul | HTTP | Pemicu |
|---|---|---|---|
| `INVALID_REQUEST` | backend-api | 400 | Joi validation fail |
| `AUTH_FAILED` | backend-api | 401 | JWT invalid / API Key salah |
| `FORBIDDEN` | backend-api | 403 | Role tidak memiliki akses |
| `NOT_FOUND` | backend-api | 404 | Resource tidak ditemukan |
| `FORECAST_ENGINE_UNAVAILABLE` | ai-engine | 503 | Timeout/down → fallback aktif |
| `ROUTE_ENGINE_UNAVAILABLE` | ai-engine | 503 | Timeout/down → fallback aktif |
| `BESU_NODE_UNAVAILABLE` | blockchain | 503 | RPC gagal → status PENDING |
| `IASC_VERIFICATION_TIMEOUT` | backend-api | 202 | IASC async pending |
| `TOKEN_DUPLICATE` | blockchain | 409 | batchId sudah ada on-chain |
| `DATA_QUALITY_LOW` | ai-engine | 200+flag | Input parsial, confidence turun |

---

## Phase 0: Ringkasan Temuan Riset

*Lihat [research.md](research.md) untuk detail lengkap.*

| Unknown | Resolusi |
|---|---|
| XGBoost-LSTM hybrid untuk prediksi harga | Sequential pipeline: XGBoost feature importance → LSTM temporal, scikit-learn + TF/Keras |
| GA + PPO + HSTE-GNN untuk optimasi rute | GA (DEAP) sebagai solver utama, PPO (SB3) sebagai policy refiner, GNN stub pre-trained |
| Hyperledger Besu QBFT local setup | Docker Compose 4-node, genesis QBFT, port 8545, Hardhat sebagai toolchain |
| SNAP BI controls mapping | API Key + JWT RS256 + HMAC-SHA256 per spesifikasi SNAP BI 2.0 |
| Node.js ↔ Python integration | FastAPI di ai-engine, HTTP via axios dari Node.js — async, container-native |
| PostgreSQL AES-256 | pgcrypto `pgp_sym_encrypt` untuk kolom PII; key via env var |
| Correlation ID tracking | UUID v4 prefix `GARUDA-`, propagated via header + body + on-chain event |

---

## Phase 1: Artefak Desain

*Output lengkap tersedia di file terpisah:*

- **Data Model**: [data-model.md](data-model.md) — 8 entitas utama, validasi, relasi, state transitions
- **Kontrak API**: [contracts/](contracts/) — 4 file YAML (frontend-api, ai-engine, blockchain-rpc, mock-api)
- **Panduan Mulai Cepat**: [quickstart.md](quickstart.md) — Docker Compose + alur demo P1

---

## Risiko dan Unknown Terbuka

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Model XGBoost-LSTM butuh waktu training yang signifikan | Demo tidak stabil jika model belum converge | Sediakan model pre-trained serialized + mock mode deterministik |
| Hyperledger Besu QBFT 4-node berat untuk mesin demo | Demo crash jika RAM tidak cukup | minimum 8GB RAM; simpan opsi single-node dev mode sebagai fallback |
| HSTE-GNN full implementation terlalu kompleks untuk PoC | Feature route optimization tidak selesai | Gunakan GNN stub (static embedding) — narasi tetap valid |
| Ambiguitas status hukum quasi-collateral | Pertanyaan dari juri PIDI | Tambahkan disclaimer eksplisit di UI dan dokumentasi: "token bersifat PoC, bukan agunan legal" |
| Ketidaktersediaan endpoint PIHPS + IASC aktual | Demo bergantung penuh pada Mock-API | Mock-API sudah dirancang deterministik dan semantically equivalent |
| Sinkronisasi kontrak antarmuka AI-DLT antara tim | Inkonsistensi payload | Kontrak difreeze di `contracts/` sebelum coding dimulai; perubahan via spec review |
