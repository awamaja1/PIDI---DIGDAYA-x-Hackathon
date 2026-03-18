param(
  [string]$BaseUrl = "http://localhost:3000"
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

Write-Host "[verify] Memulai verifikasi mock 3 putaran pada $BaseUrl" -ForegroundColor Cyan

$baselinePrices = $null
$baselineLatest = $null
$baselineIasc = $null

for ($run = 1; $run -le 3; $run++) {
  $cid = "GARUDA-VERIFY-$run"
  $headers = @{ "X-Correlation-ID" = $cid }

  $health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/v1/health" -Headers $headers
  Assert-True ($health.success -eq $true) "Health check gagal pada run $run"

  $mockHealth = Invoke-RestMethod -Method Get -Uri "$BaseUrl/mock/health" -Headers $headers
  Assert-True ($mockHealth.success -eq $true) "Mock health gagal pada run $run"

  $prices = Invoke-RestMethod -Method Get -Uri "$BaseUrl/mock/pihps/prices?commodity=BERAS&region=JABAR&startDate=2026-02-16&endDate=2026-03-17" -Headers $headers
  $latest = Invoke-RestMethod -Method Get -Uri "$BaseUrl/mock/pihps/prices/BERAS/latest" -Headers $headers
  $iasc = Invoke-RestMethod -Method Get -Uri "$BaseUrl/mock/iasc/verify/IASC-REF-0001" -Headers $headers

  Assert-True ($prices.success -eq $true) "Endpoint prices gagal pada run $run"
  Assert-True ($latest.success -eq $true) "Endpoint latest gagal pada run $run"
  Assert-True ($iasc.success -eq $true) "Endpoint iasc verify gagal pada run $run"

  Assert-True ($prices.correlationId -eq $cid) "Correlation ID prices mismatch pada run $run"
  Assert-True ($latest.correlationId -eq $cid) "Correlation ID latest mismatch pada run $run"
  Assert-True ($iasc.correlationId -eq $cid) "Correlation ID iasc mismatch pada run $run"

  $stablePrices = Convert-StableJson $prices.data
  $stableLatest = Convert-StableJson $latest.data
  $stableIasc = Convert-StableJson $iasc.data

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
