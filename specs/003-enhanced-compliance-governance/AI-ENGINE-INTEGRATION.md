# AI-Engine x Governance Integration Guide

## Overview

This guide demonstrates how the AI Engine (bounded context) integrates with Governance endpoints (Feature 003) while maintaining architectural boundaries defined in HA-001, HA-002, and HA-003.

### Key Principles
- **No Direct DLT Calls**: AI Engine does not directly call Besu or blockchain-related code
- **REST Gateway**: All governance queries flow through Backend API gateway
- **Compliance Context**: AI responses include governance compliance metadata
- **Correlation Propagation**: X-Correlation-ID header propagated end-to-end

---

## Integration Architecture

```
┌──────────────────────────────────┐
│  AI Engine (Pricing Module)      │
│  - XGBoost-LSTM predictions      │
│  - Route optimization            │
│  - Risk assessment               │
└─────────────┬────────────────────┘
              │ REST calls (port 3000)
              ↓
    ┌────────────────────────────────┐
    │  Backend API Gateway           │
    │  - /api/v1/governance/*        │
    │  - /api/v1/tokens/*            │
    └────────────────────────────────┘
              │
              ↓
    ┌────────────────────────────────┐
    │  Governance Services           │
    │  - Evidence aggregation        │
    │  - Compliance checking         │
    │  - Release readiness           │
    └────────────────────────────────┘
```

---

## Integration Patterns

### 1. Compliance-Aware Pricing

The AI pricing model incorporates governance compliance status into risk calculations:

```python
# ai-engine/app/services/pricing_service.py

from dataclasses import dataclass
from typing import Optional
import httpx

@dataclass
class GovernanceContext:
    """Governance compliance context for pricing decisions"""
    correlation_id: str
    audit_trace_status: str  # "pass", "warn", "fail"
    data_protection_status: str
    security_readiness_status: str
    overall_status: str  # "pass", "conditional", "fail"
    
class PricingService:
    def __init__(self, backend_api_url: str = "http://localhost:3000"):
        self.backend_api_url = backend_api_url
    
    async def fetch_compliance_context(
        self, 
        correlation_id: str
    ) -> Optional[GovernanceContext]:
        """Fetch governance compliance status from evidence endpoint"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.backend_api_url}/api/v1/governance/evidence/{correlation_id}",
                    headers={
                        "X-Correlation-ID": correlation_id,
                        "Accept": "application/json"
                    },
                    timeout=5.0
                )
                
                if response.status_code != 200:
                    return None
                
                evidence = response.json()["data"]
                audit_trace = evidence.get("auditTrace", [])
                control_domains = self._extract_control_domains(evidence)
                
                return GovernanceContext(
                    correlation_id=correlation_id,
                    audit_trace_status=self._derive_status(audit_trace),
                    data_protection_status=control_domains.get("DATA_PROTECTION", "unknown"),
                    security_readiness_status=control_domains.get("SECURITY_READINESS", "unknown"),
                    overall_status=evidence.get("complianceStatus", "unknown")
                )
        except Exception as e:
            print(f"Failed to fetch compliance context: {e}")
            return None
    
    def _extract_control_domains(self, evidence: dict) -> dict:
        """Extract control domain statuses from evidence data"""
        domains = {}
        for entry in evidence.get("auditTrace", []):
            if "complianceTags" in entry:
                tags = entry["complianceTags"]
                for domain, status in tags.items():
                    if domain not in domains:
                        domains[domain] = status
        return domains
    
    def _derive_status(self, audit_trace: list) -> str:
        """Derive audit trace status (pass/warn/fail)"""
        if not audit_trace:
            return "pass"
        
        statuses = [event.get("status", "unknown") for event in audit_trace]
        if "fail" in statuses:
            return "fail"
        if "warn" in statuses:
            return "warn"
        return "pass"
    
    async def calculate_price(
        self,
        commodity_code: str,
        quantity_kg: float,
        correlation_id: str,
        base_price_idr: float
    ) -> dict:
        """Calculate commodity price with compliance adjustments"""
        
        # Fetch compliance context
        compliance = await self.fetch_compliance_context(correlation_id)
        
        # Base prediction from ML model
        predicted_price = self.model.predict(
            commodity_code=commodity_code,
            quantity_kg=quantity_kg
        )
        
        # Apply compliance-based risk adjustment
        risk_multiplier = 1.0
        if compliance:
            if compliance.overall_status == "fail":
                # High-risk: apply 5% premium
                risk_multiplier = 1.05
            elif compliance.overall_status == "conditional":
                # Medium-risk: apply 2% premium
                risk_multiplier = 1.02
            # Pass: no adjustment (multiplier = 1.0)
        
        final_price = predicted_price * risk_multiplier
        
        return {
            "correlationId": correlation_id,
            "commodityCode": commodity_code,
            "quantityKg": quantity_kg,
            "predictedPrice": round(predicted_price, 2),
            "complianceStatus": compliance.overall_status if compliance else "unknown",
            "riskMultiplier": risk_multiplier,
            "finalPrice": round(final_price, 2),
            "priceIdr": round(final_price * base_price_idr, 0),
        }
```

### 2. Compliance-Driven Route Optimization

The route optimization module can consider governance compliance when selecting delivery paths:

```python
# ai-engine/app/services/route_optimization_service.py

class RouteOptimizationService:
    async def optimize_route(
        self,
        origin: dict,
        destination: dict,
        correlation_id: str,
        optimization_criteria: str = "distance"  # or "compliance"
    ) -> dict:
        """Optimize route considering governance compliance"""
        
        # If optimizing for compliance, fetch governance summary
        if optimization_criteria == "compliance":
            compliance_summary = await self.fetch_compliance_summary(correlation_id)
            
            # Route through higher-compliance distribution centers
            routes = self.generate_candidate_routes(origin, destination)
            scored_routes = []
            
            for route in routes:
                route_score = self.calculate_route_score(
                    route,
                    distance_weight=0.3,
                    compliance_weight=0.7,
                    compliance_summary=compliance_summary
                )
                scored_routes.append({
                    "route": route,
                    "score": route_score
                })
            
            # Return highest-scoring compliant route
            optimal_route = max(scored_routes, key=lambda x: x["score"])
            return {
                "correlationId": correlation_id,
                "optimalRoute": optimal_route["route"],
                "complianceAlignment": "high",
                "estimatedCost": optimal_route["route"]["totalDistance"] * 0.5  # per-km cost
            }
        
        # Default distance-based optimization
        routes = self.generate_candidate_routes(origin, destination)
        shortest = min(routes, key=lambda r: r["totalDistance"])
        return {
            "correlationId": correlation_id,
            "optimalRoute": shortest,
            "complianceAlignment": "neutral"
        }
    
    async def fetch_compliance_summary(self, correlation_id: str) -> dict:
        """Fetch governance summary for current date"""
        try:
            async with httpx.AsyncClient() as client:
                today = datetime.now().strftime("%Y-%m-%d")
                response = await client.get(
                    f"{self.backend_api_url}/api/v1/governance/summary",
                    params={"period": "daily", "key": today},
                    headers={"X-Correlation-ID": correlation_id},
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    return response.json()["data"]
                return {}
        except Exception as e:
            print(f"Failed to fetch compliance summary: {e}")
            return {}
```

### 3. Risk Assessment with Governance Context

```python
# ai-engine/app/services/risk_assessment_service.py

class RiskAssessmentService:
    async def assess_risk(
        self,
        batch_id: str,
        correlation_id: str
    ) -> dict:
        """Assess risk incorporating governance compliance"""
        
        # Fetch release readiness for current version
        readiness = await self.fetch_release_readiness()
        
        # Base risk from transaction history
        base_risk_score = self.calculate_historical_risk(batch_id)
        
        # Adjust for governance compliance
        governance_risk_factor = self._derive_governance_risk(readiness)
        
        adjusted_risk = base_risk_score * governance_risk_factor
        
        return {
            "correlationId": correlation_id,
            "batchId": batch_id,
            "baseRiskScore": base_risk_score,
            "governanceRiskFactor": governance_risk_factor,
            "adjustedRiskScore": adjusted_risk,
            "riskLevel": self._classify_risk(adjusted_risk),
            "readinessStatus": readiness.get("overallDecision", "unknown"),
            "complianceState": self._extract_compliance_state(readiness),
        }
    
    def _derive_governance_risk(self, readiness: dict) -> float:
        """Convert governance readiness to risk factor"""
        decision = readiness.get("overallDecision", "UNKNOWN")
        if decision == "GO":
            return 0.8  # Lower risk when ready to go
        elif decision == "CONDITIONAL_GO":
            return 1.2  # Higher risk with conditions
        else:  # NO_GO
            return 1.5  # Highest risk when not ready
    
    def _extract_compliance_state(self, readiness: dict) -> dict:
        """Extract detailed compliance state from readiness"""
        state = {}
        for item in readiness.get("items", []):
            state[item["itemCode"]] = {
                "status": item["status"],
                "severity": item["severity"]
            }
        return state
    
    def _classify_risk(self, score: float) -> str:
        """Classify risk level"""
        if score < 0.3:
            return "LOW"
        elif score < 0.7:
            return "MEDIUM"
        elif score < 1.0:
            return "HIGH"
        else:
            return "CRITICAL"
```

---

## API Integration Examples

### Example 1: Pricing Request with Compliance Context

```bash
# AI Engine calls backend API for pricing with governance check
curl -X POST http://localhost:8000/api/v1/pricing/calculate \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: GARUDA-12345678-1234-1234-1234-123456789012" \
  -d '{
    "commodityCode": "JAGUNG",
    "quantityKg": 500,
    "basePriceIdr": 2500000,
    "includeGovernanceContext": true
  }'

# Response includes compliance status
{
  "data": {
    "correlationId": "GARUDA-12345678-1234-1234-1234-123456789012",
    "commodityCode": "JAGUNG",
    "quantityKg": 500,
    "predictedPrice": 2450000,
    "complianceStatus": "pass",
    "riskMultiplier": 1.0,
    "finalPrice": 2450000,
    "priceIdr": 2450000,
    "governanceEvidence": {
      "bundleId": "EVIDENCE-GARUDA-12345678",
      "auditTrace": [...],
      "complianceStatus": "pass"
    }
  }
}
```

### Example 2: Route Optimization with Compliance Alignment

```bash
curl -X POST http://localhost:8000/api/v1/routes/optimize \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: GARUDA-12345678-1234-1234-1234-123456789012" \
  -d '{
    "origin": {"latitude": -6.2, "longitude": 106.8},
    "destination": {"latitude": -7.5, "longitude": 110.4},
    "optimizationCriteria": "compliance",
    "fetchGovernanceContext": true
  }'

# Response prioritizes compliant distribution centers
{
  "data": {
    "correlationId": "GARUDA-12345678-1234-1234-1234-123456789012",
    "optimalRoute": {
      "waypoints": [
        {"latitude": -6.2, "longitude": 106.8},
        {"latitude": -6.8, "longitude": 108.5},
        {"latitude": -7.5, "longitude": 110.4}
      ],
      "totalDistance": 450,
      "estimatedCost": 225
    },
    "complianceAlignment": "high",
    "governanceSummary": {
      "summaryId": "GOV-SUMMARY-DAILY-2026-05-19",
      "controlDomains": [
        {"domainCode": "DATA_PROTECTION", "status": "pass"},
        {"domainCode": "SECURITY_READINESS", "status": "pass"}
      ],
      "overallStatus": "pass"
    }
  }
}
```

### Example 3: Risk Assessment with Governance State

```bash
curl -X GET http://localhost:8000/api/v1/risk/assess/BATCH-001 \
  -H "X-Correlation-ID: GARUDA-12345678-1234-1234-1234-123456789012"

# Response reflects governance readiness status
{
  "data": {
    "correlationId": "GARUDA-12345678-1234-1234-1234-123456789012",
    "batchId": "BATCH-001",
    "baseRiskScore": 0.35,
    "governanceRiskFactor": 0.8,
    "adjustedRiskScore": 0.28,
    "riskLevel": "LOW",
    "readinessStatus": "GO",
    "complianceState": {
      "AUDIT_TRACE": {"status": "pass", "severity": "CRITICAL"},
      "DATA_PROTECTION": {"status": "pass", "severity": "CRITICAL"},
      "FALLBACK_DETERMINISM": {"status": "pass", "severity": "HIGH"},
      "SECURITY_READINESS": {"status": "pass", "severity": "HIGH"}
    }
  }
}
```

---

## Error Handling & Fallbacks

### Governance Endpoint Unavailable

```python
async def get_compliance_with_fallback(self, correlation_id: str):
    """Graceful fallback if governance endpoint is down"""
    try:
        return await self.fetch_compliance_context(correlation_id)
    except (httpx.TimeoutException, httpx.ConnectError):
        # Fallback: assume neutral compliance (no adjustment)
        return GovernanceContext(
            correlation_id=correlation_id,
            audit_trace_status="unknown",
            data_protection_status="unknown",
            security_readiness_status="unknown",
            overall_status="unknown"  # No risk adjustment applied
        )
```

### Validation Checklist

- [ ] AI Engine imports only REST client (httpx), not blockchain libraries
- [ ] All governance queries include X-Correlation-ID header
- [ ] Compliance context is optional (graceful degradation)
- [ ] No direct Besu/DLT imports in AI code
- [ ] Timeout protection (5s max) on governance calls
- [ ] Proper error handling for network failures
- [ ] Logs include correlation ID for traceability

---

## Testing Integration

### Integration Test Example

```python
# ai-engine/tests/test_governance_integration.py

import pytest
from unittest.mock import patch, AsyncMock
from app.services.pricing_service import PricingService, GovernanceContext

@pytest.mark.asyncio
async def test_pricing_with_compliance_pass():
    """Test pricing calculation when governance status is PASS"""
    service = PricingService(backend_api_url="http://localhost:3000")
    
    # Mock governance response
    mock_response = {
        "data": {
            "complianceStatus": "pass",
            "auditTrace": [
                {"status": "pass", "complianceTags": {"DATA_PROTECTION": "pass"}}
            ]
        }
    }
    
    with patch.object(service, 'fetch_compliance_context') as mock_fetch:
        mock_fetch.return_value = GovernanceContext(
            correlation_id="GARUDA-test",
            audit_trace_status="pass",
            data_protection_status="pass",
            security_readiness_status="pass",
            overall_status="pass"
        )
        
        result = await service.calculate_price(
            commodity_code="JAGUNG",
            quantity_kg=500,
            correlation_id="GARUDA-test",
            base_price_idr=2500000
        )
        
        # Verify no risk multiplier applied (compliance = pass)
        assert result["riskMultiplier"] == 1.0
        assert result["complianceStatus"] == "pass"

@pytest.mark.asyncio
async def test_pricing_with_compliance_fail():
    """Test pricing calculation when governance status is FAIL"""
    service = PricingService(backend_api_url="http://localhost:3000")
    
    with patch.object(service, 'fetch_compliance_context') as mock_fetch:
        mock_fetch.return_value = GovernanceContext(
            correlation_id="GARUDA-test",
            overall_status="fail"
        )
        
        result = await service.calculate_price(
            commodity_code="JAGUNG",
            quantity_kg=500,
            correlation_id="GARUDA-test",
            base_price_idr=2500000
        )
        
        # Verify 5% risk premium applied (compliance = fail)
        assert result["riskMultiplier"] == 1.05
        assert result["complianceStatus"] == "fail"
```

---

## Deployment Configuration

Update `.env` files to include governance API endpoint:

```bash
# .env.development
AI_ENGINE_GOVERNANCE_API_URL=http://localhost:3000/api/v1/governance
AI_ENGINE_GOVERNANCE_TIMEOUT_MS=5000
AI_ENGINE_FETCH_GOVERNANCE_CONTEXT=true

# .env.staging
AI_ENGINE_GOVERNANCE_API_URL=http://backend-api-staging:3000/api/v1/governance
AI_ENGINE_GOVERNANCE_TIMEOUT_MS=5000
AI_ENGINE_FETCH_GOVERNANCE_CONTEXT=true

# .env.production
AI_ENGINE_GOVERNANCE_API_URL=https://api.garuda-link.production/api/v1/governance
AI_ENGINE_GOVERNANCE_TIMEOUT_MS=5000
AI_ENGINE_FETCH_GOVERNANCE_CONTEXT=true
```

---

## Summary

The AI-Engine integrates with Governance endpoints while maintaining architectural boundaries:

✅ **Boundary Compliance**: No direct DLT imports or calls  
✅ **REST Gateway**: All governance queries through Backend API  
✅ **Correlation Propagation**: X-Correlation-ID header included  
✅ **Graceful Degradation**: Fallback if governance unavailable  
✅ **Risk Adjustment**: Pricing & routing consider compliance status  
✅ **Testable**: Mocked governance responses for unit testing  

This integration enables AI models to make compliance-aware decisions while keeping DLT operations isolated within the Backend API gateway.
