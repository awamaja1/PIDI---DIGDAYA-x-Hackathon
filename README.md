# GARUDA-LINK: Platform Digitalisasi Pembiayaan Pertanian

Repositori implementasi GARUDA-LINK untuk hackathon PIDI - DIGDAYA 2026, fokus pada integrasi smart contract Besu untuk tokenisasi aset pertanian dengan audit trail end-to-end.

## 📋 Daftar Isi

- [Quick Start](#quick-start)
- [Arsitektur](#arsitektur)
- [Fitur Utama](#fitur-utama)
- [Rilis & Changelog](#rilis--changelog)
- [Struktur Proyek](#struktur-proyek)
- [Persyaratan](#persyaratan)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Testing](#testing)
- [Kontribusi](#kontribusi)

## 🚀 Quick Start

### Setup Environment

```bash
# Clone repository
git clone https://github.com/awamaja1/PIDI---DIGDAYA-x-Hackathon.git
cd "PIDI - DIGDAYA x Hackathon"

# Setup Python (AI Engine)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ai-engine/requirements.txt

# Setup Node.js (Backend API)
cd backend-api
npm install
npm run dev

# AI Engine (opsional, berjalan di port 8000)
cd ../ai-engine
uvicorn app.main:app --reload
```

Lihat [specs/002-smart-contract-integration/quickstart.md](specs/002-smart-contract-integration/quickstart.md) untuk validasi lengkap.

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Gateway                       │
│                   (Node.js Express Port 3000)                │
│  - Tokenisasi (Mint Token)                                  │
│  - Update Status Token                                      │
│  - Verifikasi Status (Read-Only)                            │
│  - Jejak Audit (Correlation ID)                             │
│  - Fallback Deterministik (Besu Down)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
         ┌─────────────────────────┐
         │  Besu QBFT Local        │
         │  - GarudaLinkTokenization│
         │  - HarvestTokenRegistry │
         └─────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            AI Engine (Python Port 8000)                      │
│  - Price Prediction (XGBoost-LSTM)                          │
│  - Route Optimization (GA+PPO+GNN)                          │
│  ⚠️ NO DIRECT DLT CALLS (boundary compliance)              │
└─────────────────────────────────────────────────────────────┘
```

**Prinsip Arsitektur:**
- Backend API = satu-satunya owner operasi DLT
- AI Engine = bounded context terpisah, hanya input/output via REST
- Correlation ID dipropagasi end-to-end untuk audit trace

## ✨ Fitur Utama

### Feature 001: GARUDA-LINK Baseline (Completed)
- AI Engine stubs deterministik
- Contract test coverage
- CI/CD pipeline dasar

**Branch**: `001-define-garuda-link-baseline`  
**Specs**: [specs/001-define-garuda-link-baseline/](specs/001-define-garuda-link-baseline/)

### Feature 002: Smart-Contract Integration (Completed ✅)
- Integrasi backend ke Besu QBFT
- Mint Token via `GarudaLinkTokenization`
- Update & Verifikasi Status via `HarvestTokenRegistry`
- Fallback deterministik saat Besu unavailable
- Correlation audit trail end-to-end

**Branch**: `002-smart-contract-integration`  
**Specs**: [specs/002-smart-contract-integration/](specs/002-smart-contract-integration/)  
**Release**: [v0.1.0](https://github.com/awamaja1/PIDI---DIGDAYA-x-Hackathon/releases/tag/v0.1.0)

### Feature 003: Enhanced Compliance & Governance (Planned)
*Belum dimulai*

## 📦 Rilis & Changelog

**Latest Release**: [v0.1.0 - Feature 002 Smart-Contract Integration](https://github.com/awamaja1/PIDI---DIGDAYA-x-Hackathon/releases/tag/v0.1.0)

Lihat [CHANGELOG.md](CHANGELOG.md) untuk ringkasan lengkap rilis.

## 📁 Struktur Proyek

```
.
├── README.md                           # File ini
├── CHANGELOG.md                        # Rilis & perubahan
├── .github/
│   └── workflows/
│       └── ai-engine-ci.yml           # CI/CD pipeline
├── ai-engine/
│   ├── app/
│   │   ├── main.py                    # FastAPI app
│   │   ├── routers/                   # API endpoints
│   │   └── services/                  # Business logic
│   ├── tests/
│   │   ├── test_api_contracts.py      # API contract tests
│   │   └── test_no_direct_dlt_calls.py # Boundary checks
│   └── requirements.txt                # Python dependencies
├── backend-api/
│   ├── src/
│   │   ├── main.ts                    # Express app
│   │   ├── routes/                    # API endpoints
│   │   ├── middleware/                # Correlation ID, error handlers
│   │   └── services/                  # Besu gateway, audit
│   ├── tests/
│   │   ├── integration.test.ts        # E2E flow tests
│   │   └── contracts.test.ts          # Contract validation
│   ├── scripts/                        # Verification scripts
│   └── package.json                    # Node dependencies
├── specs/
│   ├── 001-define-garuda-link-baseline/
│   │   ├── spec.md                    # Requirements
│   │   ├── plan.md                    # Implementation plan
│   │   ├── research.md                # Architectural decisions
│   │   └── quickstart.md              # Getting started
│   └── 002-smart-contract-integration/
│       ├── spec.md                    # Smart contract requirements
│       ├── plan.md                    # Implementation roadmap
│       ├── research.md                # Besu integration patterns
│       ├── quickstart.md              # Validation guide
│       ├── contracts/                 # Contract ABIs & docs
│       ├── data-model.md              # Token lifecycle
│       └── checklists/
│           └── requirements.md        # Compliance checklist
├── docs/
│   └── proposal/                      # Hackathon proposal docs
└── .gitignore                          # Git ignore rules

```

## 📋 Persyaratan

### Environment
- **Node.js**: 20 LTS atau lebih tinggi
- **Python**: 3.11
- **Docker**: (opsional, untuk Besu lokal via Docker Compose)
- **PowerShell**: (untuk Windows)

### Hardware
- RAM: 8 GB minimum (untuk 4-node Besu QBFT)
- Disk: 20 GB (untuk image Docker, chain data, model files)

### Dependencies
Lihat [backend-api/package.json](backend-api/package.json) dan [ai-engine/requirements.txt](ai-engine/requirements.txt)

## 🏃 Menjalankan Aplikasi

### Backend API (Port 3000)

```powershell
cd backend-api
npm install
npm run dev
```

Endpoint utama:
- `POST /api/v1/tokens/tokenize` - Mint token
- `PATCH /api/v1/tokens/{tokenId}/status` - Update status
- `GET /api/v1/tokens/{tokenId}/verify` - Verifikasi status
- `GET /api/v1/audit/traces/{correlationId}` - Jejak audit

### AI Engine (Port 8000)

```powershell
cd ai-engine
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Endpoint utama:
- `POST /predict/price` - Prediksi harga komoditas
- `POST /optimize/route` - Optimasi rute logistik

### Besu QBFT (Port 8545)

```bash
# Lihat docs Hyperledger Besu untuk setup lokal
# Atau gunakan Docker Compose dari repository kami
```

## 🧪 Testing

### Unit Tests (AI Engine)

```powershell
cd ai-engine
python -m pytest tests/ -v
# atau
python -m unittest discover -s tests -p "test_*.py" -v
```

Expected: 6/6 PASSED

### Integration Tests (Backend)

```powershell
cd backend-api
npm run test:integration
```

Expected: 8/8 PASSED (dengan Besu running)

### Fallback Determinism Tests

```powershell
# Windows PowerShell
cd backend-api
.\scripts\verify-fallback-determinism.ps1
.\scripts\verify-correlation-audit.ps1
```

## 🤝 Kontribusi

### Branch Convention
- `main` - Production ready, rilis resmi
- `00X-feature-name` - Feature branches untuk iterasi tertentu
- `hotfix/*` - Emergency fixes

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

Tipe: `feat`, `fix`, `docs`, `chore`, `test`, `ci`, `refactor`

Contoh:
```
feat(backend): add correlation ID middleware

Adds request-scoped correlation ID generation and propagation
to all API responses for end-to-end auditability.

Closes #5
```

### Pull Request Process
1. Buat branch dari `main` atau feature branch yang relevan
2. Implementasikan dan test secara lokal
3. Buat PR dengan deskripsi lengkap
4. Tunggu CI/CD pipeline hijau
5. Request review dan merge setelah approval

## 📚 Dokumentasi Lanjutan

- [Spesifikasi Feature 002](specs/002-smart-contract-integration/spec.md)
- [Quickstart & Validasi](specs/002-smart-contract-integration/quickstart.md)
- [Rencana Implementasi](specs/002-smart-contract-integration/plan.md)
- [Data Model & Kontrak](specs/002-smart-contract-integration/data-model.md)
- [Compliance Checklist](specs/002-smart-contract-integration/checklists/requirements.md)

## 📞 Support & Contact

Untuk pertanyaan, buat issue di repository atau hubungi tim development.

## 📄 Lisensi

Proyek ini adalah bagian dari hackathon PIDI - DIGDAYA 2026 dan mengikuti lisensi yang disepakati organisasi penyelenggara.

---

**Terakhir Update**: 2026-04-22  
**Release Terbaru**: [v0.1.0](https://github.com/awamaja1/PIDI---DIGDAYA-x-Hackathon/releases/tag/v0.1.0)
