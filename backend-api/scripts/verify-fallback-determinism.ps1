param(
    [string]$WorkspaceRoot = "d:\Work\Project\PIDI - DIGDAYA x Hackathon\backend-api"
)

$ErrorActionPreference = "Stop"

Write-Host "[INFO] T037 verification via integration tests"
Write-Host "[INFO] Running fallback determinism scenarios..."

Set-Location $WorkspaceRoot

$pattern = 'tokenize fallback is deterministic|update/verify fallback responses are deterministic'
$rawOutput = & node --test --test-concurrency=1 tests/integration/*.test.js --test-name-pattern "$pattern" 2>&1
$rawOutput | ForEach-Object { Write-Host $_ }

$outputText = ($rawOutput | Out-String)
$hasTokenizeFallback = $outputText -match "tokenize fallback is deterministic"
$hasUpdateVerifyFallback = $outputText -match "update/verify fallback responses are deterministic"
$hasFailure = $outputText -match "✖|fail\s+[1-9]"

if ($hasTokenizeFallback -and $hasUpdateVerifyFallback -and -not $hasFailure) {
    Write-Host "[PASS] T037 fallback determinism verified."
    exit 0
}

Write-Host "[FAIL] T037 fallback determinism verification failed."
exit 1
