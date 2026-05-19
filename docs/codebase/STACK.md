# Technology Stack (Auto-generated)

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | JavaScript (Node.js) + Python | `backend-api/package.json`, `ai-engine/requirements.txt` |
| Runtime + version | Node.js (backend-api), Python 3.11 (AI engine) | `backend-api/package.json`, `ai-engine/requirements.txt` |
| Package manager | pnpm (backend-api), pip (ai-engine) | `backend-api/pnpm-lock.yaml`, `ai-engine/requirements.txt` |
| Module/build system | None (simple Node app), Uvicorn for AI engine | `backend-api/server.js`, `ai-engine/app/main.py` |

### 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| Express.js | (see `backend-api/package.json`) | HTTP API backend | `backend-api/package.json` |
| FastAPI / Uvicorn | (see `ai-engine/requirements.txt`) | AI engine HTTP server | `ai-engine/requirements.txt` |
| Hyperledger Besu (runtime) | n/a (external service) | DLT node for smart contracts (staging) | `docker-compose.staging.yml`, `DEPLOYMENT.md` |

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| pnpm / npm | package management & scripts (backend) | `backend-api/package.json`, `backend-api/pnpm-lock.yaml` |
| Python (pip) | AI engine dependencies & scripts | `ai-engine/requirements.txt` |
| Docker Compose | Local/staging orchestration | `docker-compose.staging.yml` |

### 4) Key Commands

```bash
# Backend
cd backend-api
pnpm install
pnpm run dev

# AI engine
cd ai-engine
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Staging (docker-compose)
docker-compose -f docker-compose.staging.yml up -d
```

### 5) Environment and Config

- Config sources: `backend-api/.env.example`, `ai-engine/requirements.txt`, `docker-compose.staging.yml`
- Required env vars: See `backend-api/.env.example` (`NODE_ENV`, `LOG_LEVEL`, ports, etc.)
- Deployment/runtime constraints: AI and DLT kept as bounded contexts; backend owns DLT interactions.

### 6) Evidence

- `backend-api/package.json`
- `ai-engine/requirements.txt`
- `docker-compose.staging.yml`
