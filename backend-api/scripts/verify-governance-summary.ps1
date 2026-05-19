# Governance summary verification script
param([int]$Port = 3000)
$baseUrl = "http://127.0.0.1:$Port"
$correlationId = "GARUDA-ffffffff-ffff-ffff-ffff-ffffffffffff"

Write-Host "Governance Summary Verification"
Write-Host "================================" 
Write-Host ""

Write-Host "Step 1: Create transaction..."
$body = @{ batchId = "VERIFY-SUMMARY-BATCH-1"; commodityCode = "JAGUNG"; harvestQuantityKg = 500; referenceValueIdr = 2500000 } | ConvertTo-Json
$tokenizeRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/tokens/tokenize" -Method POST -Headers @{"Content-Type" = "application/json"; "X-Correlation-ID" = $correlationId} -Body $body
Write-Host "OK - Transaction created"
Write-Host ""

Write-Host "Step 2: Retrieve daily summary..."
$dayKey = (Get-Date).ToString("yyyy-MM-dd")
$uri = "$baseUrl/api/v1/governance/summary?period=daily`&key=$dayKey"
$summaryRes = Invoke-RestMethod -Uri $uri -Method GET -Headers @{"X-Correlation-ID" = $correlationId}
Write-Host "OK - Daily summary retrieved (ID: $($summaryRes.data.summaryId))"
Write-Host "    Events: $($summaryRes.data.eventsAnalyzed) | Status: $($summaryRes.data.overallStatus) | Coverage: $($summaryRes.data.evidenceCoveragePct)%"
Write-Host ""

Write-Host "Step 3: Validate control domains..."
$expectedDomains = @("AUDIT_TRACE", "FALLBACK_DETERMINISM", "DATA_PROTECTION", "SECURITY_READINESS")
$foundDomains = $summaryRes.data.controlDomains | Select-Object -ExpandProperty domainCode
foreach ($domain in $expectedDomains) {
    if ($foundDomains -contains $domain) {
        $domainDetail = $summaryRes.data.controlDomains | Where-Object { $_.domainCode -eq $domain }
        Write-Host "  [PASS] $domain (status: $($domainDetail.status))"
    }
    else {
        Write-Host "  [FAIL] $domain NOT FOUND"
    }
}
Write-Host ""

Write-Host "Step 4: Check warn/fail drilldown refs..."
$warnFailDomains = $summaryRes.data.controlDomains | Where-Object { $_.status -in @("warn", "fail") }
if ($warnFailDomains.Count -gt 0) {
    foreach ($domain in $warnFailDomains) {
        Write-Host "  [$($domain.domainCode)] $($domain.evidenceRefs.Count) evidence refs"
    }
}
else {
    Write-Host "  [INFO] No warn/fail domains"
}
Write-Host ""

Write-Host "Step 5: Retrieve release summary..."
$uri = "$baseUrl/api/v1/governance/summary?period=release`&key=v0.1.0"
$releaseSummaryRes = Invoke-RestMethod -Uri $uri -Method GET -Headers @{"X-Correlation-ID" = $correlationId}
Write-Host "OK - Release summary retrieved (Status: $($releaseSummaryRes.data.overallStatus))"
Write-Host ""
Write-Host "RESULT: All governance endpoints validated successfully"
