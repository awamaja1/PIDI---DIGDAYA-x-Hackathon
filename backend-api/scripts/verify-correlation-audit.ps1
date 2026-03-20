# Verify Correlation Audit Trail (T038)
# Execute full flow: tokenize -> update status -> verify status
# Retrieve audit trace using correlationId and validate complete event chain 

param(
    [string]$BackendUrl = "http://localhost:3000"
)

# Pre-flight check
Write-Host "`n[INFO] Checking backend API health..."
try {
    $healthResponse = Invoke-RestMethod -Uri "$BackendUrl/api/v1/mock/health" -ErrorAction Stop
    Write-Host "[PASS] Backend is responsive"
} catch {
    Write-Host "[FAIL] Backend unreachable at $BackendUrl"
    exit 1
}

# Clear prior audit state
Write-Host "`n[INFO] Preparing test state..."
$auditLogPath = Join-Path (Split-Path $PSScriptRoot -Parent) "logs/audit-events.ndjson"
if (Test-Path $auditLogPath) {
    Remove-Item $auditLogPath -Force
    Write-Host "[PASS] Audit log cleared"
}

$batchId = "BATCH-CAT-" + (Get-Date -Format "yyyyMMddHHmmss")
Write-Host "[INFO] Using batch ID: $batchId"

# Step 1: Tokenize
Write-Host "`n[TEST] Step 1: Tokenize Harvest"
Write-Host "================================================================"

$tokenizePayload = @{
    batchId            = $batchId
    commodityCode      = "RICE"
    harvestQuantityKg  = 750.0
    referenceValueIdr  = 2250000
} | ConvertTo-Json

$correlationId = $null
$tokenId = $null

try {
    $tokenizeResponse = Invoke-RestMethod -Uri "$BackendUrl/api/v1/tokens/tokenize" -Method Post -Headers @{ "Content-Type" = "application/json" } -Body $tokenizePayload -ErrorAction Stop
    $correlationId = $tokenizeResponse.correlationId
    $tokenId = $tokenizeResponse.tokenId
    Write-Host "[PASS] Tokenize succeeded"
    Write-Host "  CorrelationId: $correlationId"
    Write-Host "  TokenId: $tokenId"
} catch {
    Write-Host "[FAIL] Tokenize failed: $($_.Exception.Message)"
    exit 1
}

# Step 2: Update Status
Write-Host "`n[TEST] Step 2: Update Token Status"
Write-Host "================================================================"

$updatePayload = @{
    newStatus = "IN_TRANSIT"
    reason    = "Shipped to warehouse"
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "$BackendUrl/api/v1/tokens/$tokenId/status" -Method Patch -Headers @{ "Content-Type" = "application/json"; "X-Correlation-ID" = $correlationId } -Body $updatePayload -ErrorAction Stop
    Write-Host "[PASS] Update succeeded"
    Write-Host "  New Status: $($updateResponse.status)"
} catch {
    Write-Host "[FAIL] Update failed: $($_.Exception.Message)"
    exit 1
}

# Step 3: Verify Status
Write-Host "`n[TEST] Step 3: Verify Token Status"
Write-Host "================================================================"

try {
    $verifyResponse = Invoke-RestMethod -Uri "$BackendUrl/api/v1/tokens/$tokenId/verify" -Method Get -Headers @{ "X-Correlation-ID" = $correlationId } -ErrorAction Stop
    Write-Host "[PASS] Verify succeeded"
    Write-Host "  Verified Status: $($verifyResponse.status)"
} catch {
    Write-Host "[FAIL] Verify failed: $($_.Exception.Message)"
    exit 1
}

# Step 4: Retrieve Audit Trace
Write-Host "`n[TEST] Step 4: Retrieve Audit Trace"
Write-Host "================================================================"

$auditTrace = $null
$events = @()

try {
    $auditResponse = Invoke-RestMethod -Uri "$BackendUrl/api/v1/audit/traces/$correlationId" -Method Get -ErrorAction Stop
    $events = $auditResponse.events
    Write-Host "[PASS] Audit trace retrieved"
    Write-Host "  Total events: $($events.Count)"
} catch {
    Write-Host "[FAIL] Audit trace retrieval failed: $($_.Exception.Message)"
    exit 1
}

# Validate Event Chain
Write-Host "`n[TEST] Event Chain Validation"
Write-Host "================================================================"

$expectedEventTypes = @("TokenizeRequest", "UpdateStatus", "VerifyStatus")
Write-Host "`nExpected event types: TokenizeRequest -> UpdateStatus -> VerifyStatus"

$foundEventTypes = $events | Select-Object -ExpandProperty eventType
Write-Host "Found event types:    $($foundEventTypes -join ' -> ')"

# Check event count
if ($events.Count -ge 3) { Write-Host "[PASS] Event count: $($events.Count) (minimum met)" } else { Write-Host "[FAIL] Event count: $($events.Count) (minimum 3 required)"; exit 1 }

# Check required event types
$hasTokenize = $events | Where-Object { $_.eventType -eq "TokenizeRequest" }
$hasUpdate = $events | Where-Object { $_.eventType -eq "UpdateStatus" }
$hasVerify = $events | Where-Object { $_.eventType -eq "VerifyStatus" }

if ($hasTokenize) { Write-Host "[PASS] TokenizeRequest event present" } else { Write-Host "[FAIL] TokenizeRequest event missing" }
if ($hasUpdate) { Write-Host "[PASS] UpdateStatus event present" } else { Write-Host "[FAIL] UpdateStatus event missing" }
if ($hasVerify) { Write-Host "[PASS] VerifyStatus event present" } else { Write-Host "[FAIL] VerifyStatus event missing" }

# Check compliance tags
Write-Host "`n[TEST] Compliance Tags Validation"
Write-Host "================================================================"

$tags = @()
$events | ForEach-Object { if ($_.complianceTag) { $tags += $_.complianceTag } }

$hasCR001 = $tags -contains "CR-001"
$hasCR005 = $tags -contains "CR-005"

if ($hasCR001) { Write-Host "[PASS] CR-001 (tokenization control) tag present" } else { Write-Host "[FAIL] CR-001 tag missing" }
if ($hasCR005) { Write-Host "[PASS] CR-005 (lifecycle audit) tag present" } else { Write-Host "[FAIL] CR-005 tag missing" }

# Display event chain
Write-Host "`nEvent Chain Summary:"
Write-Host "================================================================"
$events | Format-Table -Property @(
    @{ Label = "Type"; Expression = { $_.eventType } },
    @{ Label = "Status"; Expression = { $_.status } },
    @{ Label = "ComplianceTag"; Expression = { $_.complianceTag } }
) -AutoSize

# Final result
Write-Host "`n[TEST] T038: Correlation Audit Trail"
Write-Host "================================================================"

$allValid = @($events.Count -ge 3, $null -ne $hasTokenize, $null -ne $hasUpdate, $null -ne $hasVerify, $hasCR001, $hasCR005) | Where-Object { $_ -eq $false } | Measure-Object | Select-Object -ExpandProperty Count

if ($allValid -eq 0) {
    Write-Host "[PASS] All validation checks passed."
    Write-Host "  - Full event chain recorded: Tokenize -> Update -> Verify"
    Write-Host "  - All required event types present"
    Write-Host "  - Compliance tags properly assigned (CR-001, CR-005)"
    Write-Host "  - Correlation ID $correlationId links all events"
    exit 0
} else {
    Write-Host "[FAIL] $allValid validation(s) failed."
    exit 1
}
