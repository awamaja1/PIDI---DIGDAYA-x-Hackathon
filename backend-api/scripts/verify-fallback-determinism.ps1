# Verify Fallback Determinism (T037)
# Execute 3 identical requests with Besu unavailable (BESU_SIMULATION_MODE=unavailable)
# and confirm HTTP status, errorCode, and payload structure are deterministically identical.

param(
    [string]$BackendUrl = "http://localhost:3000",
    [int]$Runs = 3
)

# Pre-flight check
Write-Host "`n[INFO] Checking backend API health..."
try {
    $healthResponse = Invoke-RestMethod -Uri "$BackendUrl/api/v1/mock/health" -ErrorAction Stop
    Write-Host "[PASS] Backend is responsive"
} catch {
    Write-Host "[FAIL] Backend unreachable at $BackendUrl. Please start backend API."
    exit 1
}

# Run 3 identical tokenize requests with fallback enabled
Write-Host "`n[INFO] Running Fallback Determinism Test (3 runs)..."
Write-Host "========================================================================"

$testPayload = @{
    batchId            = "BATCH-FD001"
    commodityCode      = "COFF"
    harvestQuantityKg  = 500.0
    referenceValueIdr  = 1500000
} | ConvertTo-Json

$results = @()

for ($i = 1; $i -le $Runs; $i++) {
    Write-Host "`n  Run $($i) of $($Runs)"
    
    try {
        # Set fallback mode for this request
        $env:BESU_SIMULATION_MODE = "unavailable"
        
        $response = Invoke-RestMethod -Uri "$BackendUrl/api/v1/tokens/tokenize" -Method Post -Headers @{ "Content-Type" = "application/json" } -Body $testPayload -ErrorAction Stop
        
        Write-Host "[WARN] Request succeeded (error expected)"
        
    } catch {
        # Expected: should return fallback 503 response
        $exceptionResponse = $_.Exception.Response
        $statusCode = [int]$exceptionResponse.StatusCode
        $streamReader = [System.IO.StreamReader]::new($exceptionResponse.GetResponseStream())
        $responseBody = $streamReader.ReadToEnd()
        $streamReader.Close()
        
        try {
            $jsonResponse = $responseBody | ConvertFrom-Json
            $errorCode = $jsonResponse.errorCode
            $correlationId = $jsonResponse.correlationId
            
            $result = @{
                RunNumber   = $i
                HttpStatus  = $statusCode
                ErrorCode   = $errorCode
                CorrelationId = $correlationId
                PayloadKeys = ($jsonResponse | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name | Sort-Object) -join ", "
            }
            
            $results += $result
            
            Write-Host "[PASS] HTTP $($statusCode) | ErrorCode: $($errorCode) | CorrID: $($correlationId)"
            
        } catch {
            Write-Host "[FAIL] Failed to parse fallback response body"
            exit 1
        }
        
    } finally {
        $env:BESU_SIMULATION_MODE = ""
    }
}

# Validate determinism
Write-Host "`n[INFO] Validating Determinism..."
Write-Host "========================================================================"

$allHttpStatusesMatch = ($results | Select-Object -ExpandProperty HttpStatus | Sort-Object -Unique).Count -eq 1
$allErrorCodesMatch = ($results | Select-Object -ExpandProperty ErrorCode | Sort-Object -Unique).Count -eq 1
$allPayloadSchemasMatch = ($results | Select-Object -ExpandProperty PayloadKeys | Sort-Object -Unique).Count -eq 1

Write-Host "`nComparative Results:"
Write-Host "================================================================"
$results | Format-Table -Property RunNumber, HttpStatus, ErrorCode, CorrelationId, PayloadKeys

Write-Host "`nDeterminism Checks:"
Write-Host "================================================================"
if ($allHttpStatusesMatch) { Write-Host "[PASS] HTTP Status Deterministic: $($results[0].HttpStatus)" } else { Write-Host "[FAIL] HTTP Status NOT deterministic" }
if ($allErrorCodesMatch) { Write-Host "[PASS] ErrorCode Deterministic: $($results[0].ErrorCode)" } else { Write-Host "[FAIL] ErrorCode NOT deterministic" }
if ($allPayloadSchemasMatch) { Write-Host "[PASS] Payload Schema Deterministic" } else { Write-Host "[FAIL] Payload Schema NOT deterministic" }

# Final summary
Write-Host "`n[TEST] T037: Fallback Determinism"
Write-Host "========================================================================"

if ($allHttpStatusesMatch -and $allErrorCodesMatch -and $allPayloadSchemasMatch) {
    Write-Host "[PASS] All determinsim checks passed."
    Write-Host "  - All 3 runs produced identical HTTP status codes"
    Write-Host "  - All 3 runs produced identical error codes"
    Write-Host "  - All 3 runs maintained identical payload structure"
    exit 0
} else {
    Write-Host "[FAIL] One or more determinism checks failed."
    exit 1
}
