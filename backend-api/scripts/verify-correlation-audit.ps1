param(
    [string]$WorkspaceRoot = "d:\Work\Project\PIDI - DIGDAYA x Hackathon\backend-api"
)

$ErrorActionPreference = "Stop"

Write-Host "[INFO] T038 verification via integration tests"
Write-Host "[INFO] Running correlation/audit scenarios..."

Set-Location $WorkspaceRoot

$pattern = 'audit trace includes tokenize, updateStatus, verifyStatus under one correlationId|audit trace records fallback reason for failed operation'
$rawOutput = & node --test --test-concurrency=1 tests/integration/*.test.js --test-name-pattern "$pattern" 2>&1
$rawOutput | ForEach-Object { Write-Host $_ }

$outputText = ($rawOutput | Out-String)
$hasTraceChain = $outputText -match "audit trace includes tokenize, updateStatus, verifyStatus under one correlationId"
$hasFallbackReason = $outputText -match "audit trace records fallback reason for failed operation"
$hasFailure = $outputText -match "✖|fail\s+[1-9]"

if ($hasTraceChain -and $hasFallbackReason -and -not $hasFailure) {
    Write-Host "[PASS] T038 correlation audit trail verified."
    exit 0
}

Write-Host "[FAIL] T038 correlation audit trail verification failed."
exit 1
