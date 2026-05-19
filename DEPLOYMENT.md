# GARUDA-LINK Deployment Guide

## Environments

### Development
- **Location**: Local machine
- **Node.js**: `npm run dev` (localhost:3000)
- **Besu**: Docker Compose local 4-node QBFT
- **AI Engine**: `uvicorn app.main:app --reload` (localhost:8000)
- **Chain ID**: 1337 (development)

### Staging
- **Location**: Docker containers or staging VPS
- **Deployment**: `docker-compose -f docker-compose.staging.yml up -d`
- **Backend API**: Port 3000 (internal: container network)
- **Besu**: Port 8545 (RPC), 8546 (WebSocket)
- **AI Engine**: Port 8000 (internal)
- **Chain ID**: 1337 (staging - same as dev for easy migration)
- **Health Checks**: All services include healthcheck endpoints
- **Data Persistence**: Besu data stored in `besu-staging-data` volume

### Production
- **Location**: Managed cloud infrastructure (AWS/GCP/Azure)
- **Requirements**: 
  - Kubernetes cluster or managed container service
  - Managed database (PostgreSQL for audit logs)
  - CDN for API gateway
  - SSL/TLS certificates for all endpoints
- **Chain ID**: Production Besu network (to be determined)
- **Monitoring**: Integrated with Sentry + Datadog
- **Backup**: Automated daily backup of Besu chain state & audit logs

---

## Staging Deployment Steps

### Prerequisites
```bash
# Install Docker & Docker Compose
docker --version  # Should be 20.10+
docker-compose --version  # Should be 1.29+

# Clone repo and navigate
cd "d:\Work\Project\PIDI - DIGDAYA x Hackathon"

# Copy environment template
cp .env.staging.example .env.staging
# Edit .env.staging with your staging values
```

### Deploy Staging Environment
```bash
# Start all services
docker-compose -f docker-compose.staging.yml up -d

# Check service health
docker-compose -f docker-compose.staging.yml ps

# View logs
docker-compose -f docker-compose.staging.yml logs -f backend-api-staging
docker-compose -f docker-compose.staging.yml logs -f besu-staging
docker-compose -f docker-compose.staging.yml logs -f ai-engine-staging

# Verify endpoints
curl http://localhost:3000/api/v1/health
curl http://localhost:8000/api/v1/health
```

### Staging Validation
```bash
# Run contract tests against staging
cd backend-api
npm run test:contract

# Run integration tests
npm run test:integration

# Run governance verification scripts
./scripts/verify-governance-evidence.ps1 -Port 3000
./scripts/verify-governance-summary.ps1 -Port 3000

# Load test (optional)
npm run test:load
```

### Rollback
```bash
# Stop all services
docker-compose -f docker-compose.staging.yml down

# Preserve data
docker-compose -f docker-compose.staging.yml down -v  # WARNING: Deletes volumes

# Restart specific service
docker-compose -f docker-compose.staging.yml up -d backend-api-staging
```

---

## Production Deployment (Kubernetes)

### Prerequisites
```bash
# Install kubectl & helm
kubectl version --client
helm version

# Access to production cluster
kubectl cluster-info
kubectl config current-context
```

### Create Production Secrets
```bash
# Create namespace
kubectl create namespace garuda-link-prod

# Create secrets
kubectl -n garuda-link-prod create secret generic garuda-secrets \
  --from-literal=besu_rpc_url=https://besu-prod.example.com:8545 \
  --from-literal=jwt_secret=$(openssl rand -base64 32) \
  --from-literal=api_key=$(openssl rand -base64 32) \
  --from-literal=db_password=$(openssl rand -base64 32)

# Create ConfigMap for environment
kubectl -n garuda-link-prod create configmap garuda-config \
  --from-file=.env.staging=.env.staging
```

### Deploy with Helm
```bash
# Add Helm repo (if using public charts)
helm repo add garuda-link https://charts.garuda-link.io

# Deploy release
helm install garuda-link garuda-link/backend-api \
  --namespace garuda-link-prod \
  --values helm/values-prod.yaml \
  --version 0.2.0

# Monitor deployment
kubectl -n garuda-link-prod rollout status deployment/garuda-link-backend-api

# View pods
kubectl -n garuda-link-prod get pods
```

### Production Monitoring
```bash
# Port forward to access Prometheus
kubectl -n garuda-link-prod port-forward svc/prometheus 9090:9090

# View logs
kubectl -n garuda-link-prod logs -f deployment/garuda-link-backend-api

# Check service endpoints
kubectl -n garuda-link-prod get svc
```

### Production Scaling
```bash
# Scale replicas
kubectl -n garuda-link-prod scale deployment garuda-link-backend-api --replicas=3

# Auto-scaling
kubectl -n garuda-link-prod autoscale deployment garuda-link-backend-api \
  --min=2 --max=10 --cpu-percent=70
```

---

## Health Check Endpoints

All services expose health check endpoints:

```bash
# Backend API
GET /api/v1/health
Response: { "status": "ok", "version": "0.2.0", "timestamp": "2026-05-19T..." }

# AI Engine
GET /api/v1/health
Response: { "status": "operational", "timestamp": "2026-05-19T..." }
```

---

## Governance Endpoints for Production Validation

### Evidence Endpoint
```bash
GET /api/v1/governance/evidence/:correlationId
Response:
{
  "data": {
    "bundleId": "EVIDENCE-GARUDA-xxxx",
    "correlationId": "GARUDA-xxxx",
    "transactionMetadata": {...},
    "auditTrace": [...],
    "complianceStatus": "pass",
    "generatedAt": "2026-05-19T..."
  }
}
```

### Summary Endpoint
```bash
GET /api/v1/governance/summary?period=release&key=v0.2.0
Response:
{
  "data": {
    "summaryId": "GOV-SUMMARY-RELEASE-v0.2.0",
    "periodType": "RELEASE",
    "periodKey": "v0.2.0",
    "controlDomains": [
      { "domainCode": "AUDIT_TRACE", "status": "pass" },
      { "domainCode": "FALLBACK_DETERMINISM", "status": "pass" },
      { "domainCode": "DATA_PROTECTION", "status": "pass" },
      { "domainCode": "SECURITY_READINESS", "status": "pass" }
    ],
    "overallStatus": "pass",
    "evidenceCoveragePct": 100
  }
}
```

### Release Readiness Endpoint
```bash
GET /api/v1/governance/release-readiness?releaseCandidate=v0.2.0
Response:
{
  "data": {
    "checklistId": "CHECKLIST-v0.2.0",
    "releaseCandidate": "v0.2.0",
    "items": [...],
    "overallDecision": "GO",
    "evaluatedAt": "2026-05-19T..."
  }
}
```

---

## Rollback Strategy

### Staging Rollback
```bash
# Stop current deployment
docker-compose -f docker-compose.staging.yml down

# Checkout previous tag
git checkout v0.1.0

# Redeploy
docker-compose -f docker-compose.staging.yml up -d
```

### Production Rollback
```bash
# Check rollout history
kubectl -n garuda-link-prod rollout history deployment/garuda-link-backend-api

# Rollback to previous version
kubectl -n garuda-link-prod rollout undo deployment/garuda-link-backend-api

# Verify
kubectl -n garuda-link-prod rollout status deployment/garuda-link-backend-api
```

---

## Monitoring & Alerting

### Key Metrics to Monitor
1. **Governance Evidence** - Determinism validation rate (target: 100%)
2. **Governance Summary** - Domain classification accuracy (target: 100%)
3. **Release Readiness** - Decision correctness (target: 100%)
4. **API Latency** - Evidence: <100ms, Summary: <200ms, Readiness: <150ms
5. **Error Rate** - Target: <0.1%
6. **Availability** - Target: 99.9%

### Alert Thresholds
- Evidence endpoint response time > 500ms → Alert
- Any control domain status = "fail" → Critical alert
- Governance summary accuracy < 95% → Warning
- API error rate > 1% → Alert
- Service down > 1 minute → Critical alert

---

## Compliance & Security Checklist

- [ ] SSL/TLS certificates valid and non-expired
- [ ] CORS configured correctly for production domain
- [ ] API authentication (JWT) enabled
- [ ] Rate limiting configured (100 req/min per client)
- [ ] Audit logs persisted and encrypted
- [ ] Secrets stored in secure vault (not in .env files)
- [ ] Regular security scanning (OWASP)
- [ ] Backup restoration tested monthly
- [ ] Incident response plan documented
- [ ] Governance compliance verified (all 4 domains = PASS)
