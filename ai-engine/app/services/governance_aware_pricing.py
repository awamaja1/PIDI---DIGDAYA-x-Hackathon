"""
Governance-Aware Pricing Service for AI Engine
Demonstrates integration pattern between AI module and Governance endpoints
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import asyncio
import json


@dataclass
class GovernanceContext:
    """Governance compliance context for pricing decisions"""
    correlation_id: str
    audit_trace_status: str  # "pass", "warn", "fail"
    data_protection_status: str
    security_readiness_status: str
    overall_status: str  # "pass", "conditional", "fail"
    evidence_bundle_id: Optional[str] = None
    fetched_at: Optional[str] = None


class GovernanceAwarePricingService:
    """
    Example service showing how AI pricing module integrates with governance.
    
    Key points:
    - Fetches governance compliance status for pricing context
    - Applies risk adjustments based on compliance state
    - Maintains correlation ID for traceability
    - Includes graceful fallback if governance unavailable
    """
    
    def __init__(self, backend_api_url: str = "http://localhost:3000"):
        self.backend_api_url = backend_api_url
        # In real implementation, would use httpx.AsyncClient
        self.clients = {}
    
    async def fetch_compliance_context(
        self, 
        correlation_id: str
    ) -> Optional[GovernanceContext]:
        """
        Fetch governance compliance status from evidence endpoint
        
        Args:
            correlation_id: Transaction correlation ID for tracing
            
        Returns:
            GovernanceContext with compliance status, or None if unavailable
        """
        try:
            # In real implementation:
            # async with httpx.AsyncClient() as client:
            #     response = await client.get(
            #         f"{self.backend_api_url}/api/v1/governance/evidence/{correlation_id}",
            #         headers={"X-Correlation-ID": correlation_id},
            #         timeout=5.0
            #     )
            #     if response.status_code == 200:
            #         evidence = response.json()["data"]
            #         return self._parse_governance_context(evidence, correlation_id)
            
            # For demo: simulate governance response
            return GovernanceContext(
                correlation_id=correlation_id,
                audit_trace_status="pass",
                data_protection_status="pass",
                security_readiness_status="pass",
                overall_status="pass",
                evidence_bundle_id=f"EVIDENCE-{correlation_id}",
                fetched_at=datetime.now().isoformat()
            )
        except Exception as e:
            print(f"Warning: Failed to fetch compliance context: {e}")
            return None
    
    def _parse_governance_context(
        self, 
        evidence: dict, 
        correlation_id: str
    ) -> GovernanceContext:
        """Parse governance evidence data into context"""
        audit_trace = evidence.get("auditTrace", [])
        control_domains = self._extract_control_domains(evidence)
        
        return GovernanceContext(
            correlation_id=correlation_id,
            audit_trace_status=self._derive_audit_status(audit_trace),
            data_protection_status=control_domains.get("DATA_PROTECTION", "unknown"),
            security_readiness_status=control_domains.get("SECURITY_READINESS", "unknown"),
            overall_status=evidence.get("complianceStatus", "unknown"),
            evidence_bundle_id=evidence.get("bundleId"),
            fetched_at=datetime.now().isoformat()
        )
    
    def _extract_control_domains(self, evidence: dict) -> dict:
        """Extract control domain statuses from evidence"""
        domains = {}
        for entry in evidence.get("auditTrace", []):
            if "complianceTags" in entry:
                tags = entry["complianceTags"]
                for domain, status in tags.items():
                    if domain not in domains:
                        domains[domain] = status
        return domains
    
    def _derive_audit_status(self, audit_trace: list) -> str:
        """Derive overall audit status"""
        if not audit_trace:
            return "pass"
        
        statuses = [event.get("status", "pass") for event in audit_trace]
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
        base_price_idr: float,
        include_governance: bool = True
    ) -> dict:
        """
        Calculate commodity price with optional governance compliance adjustment
        
        Args:
            commodity_code: Commodity code (e.g., "JAGUNG", "PADI")
            quantity_kg: Quantity in kilograms
            correlation_id: Transaction correlation ID
            base_price_idr: Base price reference in IDR
            include_governance: Whether to fetch compliance context
            
        Returns:
            Pricing result with compliance status and final price
        """
        
        # Fetch compliance context if requested
        compliance = None
        if include_governance:
            compliance = await self.fetch_compliance_context(correlation_id)
        
        # Simulate ML model prediction
        predicted_price = self._predict_base_price(
            commodity_code=commodity_code,
            quantity_kg=quantity_kg,
            base_price=base_price_idr
        )
        
        # Apply compliance-based risk adjustment
        risk_multiplier = 1.0
        if compliance:
            risk_multiplier = self._calculate_risk_multiplier(compliance.overall_status)
        
        final_price = predicted_price * risk_multiplier
        price_idr = final_price * base_price_idr
        
        return {
            "correlationId": correlation_id,
            "commodityCode": commodity_code,
            "quantityKg": quantity_kg,
            "basePriceIdr": base_price_idr,
            "predictedPrice": round(predicted_price, 2),
            "complianceStatus": compliance.overall_status if compliance else "unknown",
            "riskMultiplier": risk_multiplier,
            "finalPrice": round(final_price, 2),
            "priceIdr": round(price_idr, 0),
            "governanceEvidenceId": compliance.evidence_bundle_id if compliance else None,
            "pricingTimestamp": datetime.now().isoformat(),
        }
    
    def _predict_base_price(
        self, 
        commodity_code: str, 
        quantity_kg: float, 
        base_price: float
    ) -> float:
        """
        Simulate ML model price prediction
        In real implementation, would call XGBoost-LSTM model
        """
        # Simulated factors
        quantity_factor = 1.0 - (quantity_kg / 1000) * 0.1  # Volume discount
        commodity_factors = {
            "JAGUNG": 1.0,
            "PADI": 1.15,
            "KOPI": 2.5,
        }
        
        commodity_factor = commodity_factors.get(commodity_code, 1.0)
        market_factor = 0.95  # Market trend factor
        
        predicted = commodity_factor * quantity_factor * market_factor
        return predicted
    
    def _calculate_risk_multiplier(self, compliance_status: str) -> float:
        """
        Convert governance compliance status to price risk multiplier
        
        Args:
            compliance_status: "pass", "conditional", or "fail"
            
        Returns:
            Risk multiplier (1.0 = no adjustment, >1.0 = premium, <1.0 = discount)
        """
        multipliers = {
            "pass": 1.0,          # Fully compliant: no adjustment
            "conditional": 1.02,  # Conditional compliance: 2% premium
            "fail": 1.05,         # Non-compliant: 5% premium
            "unknown": 1.0,       # Unknown: no adjustment (fail-safe)
        }
        return multipliers.get(compliance_status, 1.0)
    
    async def assess_pricing_risk(
        self,
        batch_id: str,
        correlation_id: str
    ) -> dict:
        """
        Comprehensive risk assessment incorporating governance state
        
        Returns:
            Risk assessment with compliance factors
        """
        compliance = await self.fetch_compliance_context(correlation_id)
        
        # Base risk from batch characteristics
        base_risk = self._calculate_base_risk(batch_id)
        
        # Governance risk factor
        gov_risk_factor = self._derive_governance_risk_factor(compliance)
        
        adjusted_risk = base_risk * gov_risk_factor
        
        return {
            "correlationId": correlation_id,
            "batchId": batch_id,
            "baseRiskScore": round(base_risk, 3),
            "governanceRiskFactor": gov_risk_factor,
            "adjustedRiskScore": round(adjusted_risk, 3),
            "riskLevel": self._classify_risk_level(adjusted_risk),
            "complianceStatus": compliance.overall_status if compliance else "unknown",
            "assessmentTimestamp": datetime.now().isoformat(),
        }
    
    def _calculate_base_risk(self, batch_id: str) -> float:
        """Simulate base risk calculation from batch characteristics"""
        # In real implementation: analyze historical data, transaction patterns, etc.
        return 0.35  # Simulated
    
    def _derive_governance_risk_factor(self, compliance: Optional[GovernanceContext]) -> float:
        """Convert governance compliance to risk adjustment factor"""
        if not compliance:
            return 1.0  # Neutral when governance unavailable
        
        factors = {
            "pass": 0.8,         # Lower risk when compliant
            "conditional": 1.2,  # Higher risk with conditions
            "fail": 1.5,         # Highest risk when not compliant
            "unknown": 1.0,      # Neutral when unknown
        }
        return factors.get(compliance.overall_status, 1.0)
    
    def _classify_risk_level(self, score: float) -> str:
        """Classify numerical risk score into level"""
        if score < 0.3:
            return "LOW"
        elif score < 0.7:
            return "MEDIUM"
        elif score < 1.0:
            return "HIGH"
        else:
            return "CRITICAL"


# Example usage
async def main():
    """Demonstrate governance-aware pricing service"""
    service = GovernanceAwarePricingService()
    
    # Example 1: Calculate price with compliance context
    print("=" * 70)
    print("Example 1: Compliance-Aware Pricing")
    print("=" * 70)
    
    result = await service.calculate_price(
        commodity_code="JAGUNG",
        quantity_kg=500,
        correlation_id="GARUDA-demo-12345678-1234-1234-123456789012",
        base_price_idr=2500000,
        include_governance=True
    )
    
    print(json.dumps(result, indent=2))
    
    # Example 2: Risk assessment with governance
    print("\n" + "=" * 70)
    print("Example 2: Governance-Based Risk Assessment")
    print("=" * 70)
    
    risk = await service.assess_pricing_risk(
        batch_id="BATCH-2026-05-19-001",
        correlation_id="GARUDA-demo-12345678-1234-1234-123456789012"
    )
    
    print(json.dumps(risk, indent=2))
    
    print("\n✓ Integration examples completed")
    print("\nKey Points:")
    print("- Correlation ID propagated for full traceability")
    print("- Governance compliance status fetched and integrated")
    print("- Risk adjustments applied based on compliance")
    print("- Graceful fallback if governance unavailable")
    print("- No direct blockchain imports in AI module")


if __name__ == "__main__":
    asyncio.run(main())
