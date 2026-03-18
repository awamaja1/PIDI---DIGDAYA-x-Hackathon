# PIDI - DIGDAYA x Hackathon Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-17

## Active Technologies

### Languages and Runtimes
- **Frontend**: Node.js 20 LTS / React 18 / TypeScript 5
- **Backend API Gateway**: Node.js 20 LTS + Express 4
- **AI/ML Engine**: Python 3.11 + FastAPI 0.110
- **Smart Contracts**: Solidity 0.8.24 + Hardhat 2.22
- **Database**: PostgreSQL 16 + pgcrypto (AES-256)

### Key Libraries
- Frontend: React 18, React Router 6, Axios, TailwindCSS (Navy `#1B2A4A` & Gold `#C9A84C`)
- Backend: Express 4, ethers.js 6, pg (node-postgres), winston, uuid, axios, joi
- AI Engine: FastAPI, XGBoost 2.x, TensorFlow/Keras 2.16, DEAP, stable-baselines3, joblib
- Blockchain: Hardhat 2, OpenZeppelin Contracts 5, ethers.js 6
- Infrastructure: Docker Compose 3.9, Hyperledger Besu 24.x (QBFT, 4-node)

## Project Structure

```text
frontend/             # React 18 + TypeScript 5 — UI tema Navy Blue & Gold
backend-api/          # Node.js 20 + Express 4 — API Gateway & Orchestrator
ai-engine/            # Python 3.11 + FastAPI — AI/ML Microservice
blockchain-contracts/ # Solidity 0.8.24 + Hardhat — Smart Contracts & Besu
infra/                # Docker Compose + seed/deploy scripts
specs/                # Feature specifications and plans
```

## Architecture Rules (WAJIB DIPATUHI)

- **HA-001**: ai-engine dan blockchain-contracts adalah bounded context TERPISAH
- **HA-002**: Semua komunikasi antarmodul HANYA melalui kontrak di `specs/001-define-garuda-link-baseline/contracts/`
- **HA-003**: ai-engine TIDAK BOLEH memanggil Besu JSON-RPC langsung — hanya melalui backend-api
- **HA-004**: Perubahan kontrak antarmuka wajib update spec sebelum implementasi

## Security Requirements (CR-001..005)

- API Key (`X-API-Key`) + JWT RS256 (`Authorization: Bearer`) untuk semua endpoint
- HMAC-SHA256 (`X-Signature`) untuk endpoint tokenisasi dan pembiayaan
- PostgreSQL PII dienkripsi pgcrypto `pgp_sym_encrypt` dengan key dari env `PII_ENCRYPTION_KEY`
- Tidak ada hardcoded credentials — semua dari environment variables
- Setiap aksi kritis dicatat ke tabel `audit_trail` dengan `correlation_id`

## Correlation ID Pattern (NFR-004)

Format: `GARUDA-{uuid4}` — contoh: `GARUDA-550e8400-e29b-41d4-a716-446655440000`
Propagasi: header `X-Correlation-ID` → request body `correlation_id` → Solidity event → DB kolom `correlation_id`

## Commands

```bash
# Start all services
cd infra && docker compose up --build -d

# Database setup
docker compose exec backend-api npm run db:migrate
docker compose exec backend-api npm run db:seed

# Deploy smart contracts
docker compose exec backend-api npm run blockchain:deploy

# Backend tests
cd backend-api && npm test

# AI engine tests
cd ai-engine && pytest

# Smart contract tests
cd blockchain-contracts && npx hardhat test

# Validate demo stability (3x run)
bash infra/scripts/demo-validate.sh 3
```

## Mock-API Policy (FR-008)

- Mock-API aktif in-process di backend-api (`src/mock/mockServer.js`)
- Fallback otomatis jika PIHPS timeout > 3s atau IASC timeout > 5s
- Respons mock DETERMINISTIK — input sama = output sama
- Dataset mock: 3 komoditas × 3 wilayah × 30 hari history

## Code Style

- Backend: CommonJS (require), async/await, Joi validation di semua routes
- Frontend: TypeScript strict mode, functional components dengan hooks
- Python: Pydantic models untuk semua request/response, type hints wajib
- Solidity: events wajib include `correlationId` sebagai parameter

## Recent Changes

- 2026-03-17: Plan PoC baseline selesai (plan.md, research.md, data-model.md, contracts/, quickstart.md)
- Branch: `001-define-garuda-link-baseline`

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
