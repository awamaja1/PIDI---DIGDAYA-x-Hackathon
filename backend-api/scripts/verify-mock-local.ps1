param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$MockBasePath = "/api/v1/mock",
  [string]$LegacyMockBasePath = "/mock"
)

$ErrorActionPreference = "Stop"

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Convert-StableJson {
  param([object]$InputObject)
  return ($InputObject | ConvertTo-Json -Depth 12 -Compress)
}

function Invoke-JsonGet {
  param(
    [string]$Uri,
    [hashtable]$Headers,
    [string]$Label
  )

  try {
    return Invoke-RestMethod -Method Get -Uri $Uri -Headers $Headers
  } catch {
    throw "[$Label] gagal mengakses $Uri. Pastikan backend-api aktif (contoh: cd backend-api; node server.js). Detail: $($_.Exception.Message)"
  }
}

Write-Host "[verify] Memulai verifikasi mock 3 putaran pada $BaseUrl" -ForegroundColor Cyan
Write-Host "[verify] Canonical mock path: $MockBasePath | Legacy alias: $LegacyMockBasePath" -ForegroundColor Cyan

$baselinePrices = $null
$baselineLatest = $null
$baselineIasc = $null

for ($run = 1; $run -le 3; $run++) {
  $cid = "GARUDA-VERIFY-$run"
  $headers = @{ "X-Correlation-ID" = $cid }

  $health = Invoke-JsonGet -Uri "$BaseUrl/api/v1/health" -Headers $headers -Label "health"
  Assert-True ($health.success -eq $true) "Health check gagal pada run $run"

  $mockHealth = Invoke-JsonGet -Uri "$BaseUrl$MockBasePath/health" -Headers $headers -Label "mock-health-canonical"
  $legacyMockHealth = Invoke-JsonGet -Uri "$BaseUrl$LegacyMockBasePath/health" -Headers $headers -Label "mock-health-legacy"
  Assert-True ($mockHealth.success -eq $true) "Mock health gagal pada run $run"
  Assert-True ($legacyMockHealth.success -eq $true) "Legacy mock health gagal pada run $run"

  $prices = Invoke-JsonGet -Uri "$BaseUrl$MockBasePath/pihps/prices?commodity=BERAS&region=JABAR&startDate=2026-02-16&endDate=2026-03-17" -Headers $headers -Label "prices-canonical"
  $latest = Invoke-JsonGet -Uri "$BaseUrl$MockBasePath/pihps/prices/BERAS/latest" -Headers $headers -Label "latest-canonical"
  $iasc = Invoke-JsonGet -Uri "$BaseUrl$MockBasePath/iasc/verify/IASC-REF-0001" -Headers $headers -Label "iasc-canonical"

  $legacyPrices = Invoke-JsonGet -Uri "$BaseUrl$LegacyMockBasePath/pihps/prices?commodity=BERAS&region=JABAR&startDate=2026-02-16&endDate=2026-03-17" -Headers $headers -Label "prices-legacy"
  $legacyLatest = Invoke-JsonGet -Uri "$BaseUrl$LegacyMockBasePath/pihps/prices/BERAS/latest" -Headers $headers -Label "latest-legacy"
  $legacyIasc = Invoke-JsonGet -Uri "$BaseUrl$LegacyMockBasePath/iasc/verify/IASC-REF-0001" -Headers $headers -Label "iasc-legacy"

  Assert-True ($prices.success -eq $true) "Endpoint prices gagal pada run $run"
  Assert-True ($latest.success -eq $true) "Endpoint latest gagal pada run $run"
  Assert-True ($iasc.success -eq $true) "Endpoint iasc verify gagal pada run $run"
  Assert-True ($legacyPrices.success -eq $true) "Endpoint legacy prices gagal pada run $run"
  Assert-True ($legacyLatest.success -eq $true) "Endpoint legacy latest gagal pada run $run"
  Assert-True ($legacyIasc.success -eq $true) "Endpoint legacy iasc verify gagal pada run $run"

  Assert-True ($prices.correlationId -eq $cid) "Correlation ID prices mismatch pada run $run"
  Assert-True ($latest.correlationId -eq $cid) "Correlation ID latest mismatch pada run $run"
  Assert-True ($iasc.correlationId -eq $cid) "Correlation ID iasc mismatch pada run $run"

  Assert-True ($prices.data.count -ge 1) "Schema prices.data.count tidak valid pada run $run"
  Assert-True ($latest.data.commodity -eq "BERAS") "Schema latest.data.commodity tidak valid pada run $run"
  Assert-True ([bool]$iasc.data.referenceId) "Schema iasc.data.referenceId tidak valid pada run $run"

  $stablePrices = Convert-StableJson $prices.data
  $stableLatest = Convert-StableJson $latest.data
  $stableIasc = Convert-StableJson $iasc.data

  Assert-True ((Convert-StableJson $legacyPrices.data) -eq $stablePrices) "Legacy/canonical payload prices mismatch pada run $run"
  Assert-True ((Convert-StableJson $legacyLatest.data) -eq $stableLatest) "Legacy/canonical payload latest mismatch pada run $run"
  Assert-True ((Convert-StableJson $legacyIasc.data) -eq $stableIasc) "Legacy/canonical payload iasc mismatch pada run $run"

  if ($run -eq 1) {
    $baselinePrices = $stablePrices
    $baselineLatest = $stableLatest
    $baselineIasc = $stableIasc
  } else {
    Assert-True ($stablePrices -eq $baselinePrices) "Payload prices tidak deterministik pada run $run"
    Assert-True ($stableLatest -eq $baselineLatest) "Payload latest tidak deterministik pada run $run"
    Assert-True ($stableIasc -eq $baselineIasc) "Payload iasc tidak deterministik pada run $run"
  }

  Write-Host "[verify] Run $run PASS" -ForegroundColor Green
}

Write-Host "[verify] PASS 3/3 - Mock API stabil dan deterministik" -ForegroundColor Green
