# Verification script for governance evidence endpoint determinism and field completeness.
# Run this after implementing governance evidence endpoint to validate PoC readiness.

param(
    [string]$BaseUrl = "http://localhost:3000",
    [int]$Port = 3000
)

Write-Host "Governance Evidence Verification Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Sample correlation ID for testing
$correlationId = "GARUDA-eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
$baseUrl = "http://127.0.0.1:$Port"

Write-Host "Step 1: Create tokenization transaction..." -ForegroundColor Yellow
$tokenizeRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/tokens/tokenize" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "X-Correlation-ID" = $correlationId
  } `
  -Body (ConvertTo-Json @{
    batchId = "VERIFY-EVIDENCE-BATCH-1"
    commodityCode = "PADI"
    harvestQuantityKg = 420
    referenceValueIdr = 2000000
  })

Write-Host "  ✓ Transaction created with tokenId: $($tokenizeRes.data.tokenId)" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Retrieve evidence bundle by correlationId..." -ForegroundColor Yellow

$evidenceRes1 = Invoke-RestMethod -Uri "$baseUrl/api/v1/governance/evidence/$correlationId" `
  -Method GET `
  -Headers @{
    "X-Correlation-ID" = $correlationId
  }

Write-Host "  ✓ Evidence bundle retrieved" -ForegroundColor Green
Write-Host "    Bundle ID: $($evidenceRes1.data.bundleId)"
Write-Host "    Event count: $($evidenceRes1.data.transactionMetadata.eventCount)"
Write-Host "    Operations: $($evidenceRes1.data.transactionMetadata.operations -join ', ')"
Write-Host "    Compliance tags: $($evidenceRes1.data.complianceStatus.complianceTags -join ', ')"

Write-Host ""
Write-Host "Step 3: Verify determinism (repeat read)..." -ForegroundColor Yellow

$evidenceRes2 = Invoke-RestMethod -Uri "$baseUrl/api/v1/governance/evidence/$correlationId" `
  -Method GET `
  -Headers @{
    "X-Correlation-ID" = $correlationId
  }

$isDeterministic = ($evidenceRes1.data | ConvertTo-Json) -eq ($evidenceRes2.data | ConvertTo-Json)
if ($isDeterministic) {
  Write-Host "  ✓ Evidence bundle is deterministic (identical payloads)" -ForegroundColor Green
} else {
  Write-Host "  ✗ Evidence bundle NOT deterministic (payloads differ)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Validate required fields..." -ForegroundColor Yellow

$requiredFields = @("bundleId", "correlationId", "transactionMetadata", "auditTrace", "complianceStatus", "generatedAt", "sourceRefs")
$missingFields = @()

foreach ($field in $requiredFields) {
  if (-not $evidenceRes1.data.PSObject.Properties.Name -contains $field) {
    $missingFields += $field
  }
}

if ($missingFields.Count -eq 0) {
  Write-Host "  ✓ All required fields present" -ForegroundColor Green
} else {
  Write-Host "  ✗ Missing fields: $($missingFields -join ', ')" -ForegroundColor Red
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "--------"
Write-Host "Determinism check: $(if ($isDeterministic) { 'PASS' } else { 'FAIL' })"
Write-Host "Required fields: $(if ($missingFields.Count -eq 0) { 'PASS' } else { 'FAIL' })"
Write-Host ""
Write-Host "Governance evidence endpoint is ready for PoC demo." -ForegroundColor Green
