# Repository Structure

## Core Sections (Required)

### Top-level layout

- `.github/` — CI, prompts, skills, agents
- `backend-api/` — Node.js backend API service (routes, services, tests)
- `ai-engine/` — Python FastAPI AI engine (services, routers)
- `specs/` — feature specifications and contracts
- `docs/` — user and deployment documentation

### Entry points

- Backend API: `backend-api/server.js`, `backend-api/src/app.js`
- AI Engine: `ai-engine/app/main.py`

### Notable directories

- `backend-api/src/api/routes/` — HTTP route handlers (governance, audit, tokens)
- `backend-api/src/services/` — service layer (audit store, besu gateway, governance)
- `backend-api/tests/` — contract & integration tests
- `.github/prompts/ui-ux-pro-max` — UI/UX prompt toolkit

### Evidence

- See `docs/codebase/.codebase-scan.txt` for full directory tree
