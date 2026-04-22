const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("governance summary returns daily aggregated controls", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-13131313-1313-1313-1313-131313131313";
    await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-DAILY-1",
        commodityCode: "JAGUNG",
        harvestQuantityKg: 300,
        referenceValueIdr: 1300000,
      }),
    });

    const dayKey = new Date().toISOString().slice(0, 10);
    const summaryRes = await fetch(`${baseUrl}/api/v1/governance/summary?period=daily&key=${dayKey}`);
    assert.equal(summaryRes.status, 200);

    const summaryBody = await summaryRes.json();
    assert.equal(summaryBody.data.periodType, "DAILY");
    assert.equal(summaryBody.data.periodKey, dayKey);
    assert.equal(summaryBody.data.eventsAnalyzed >= 1, true);
    assert.equal(Array.isArray(summaryBody.data.controlDomains), true);

    const domainCodes = summaryBody.data.controlDomains.map((domain) => domain.domainCode);
    assert.equal(domainCodes.includes("AUDIT_TRACE"), true);
    assert.equal(domainCodes.includes("FALLBACK_DETERMINISM"), true);
    assert.equal(domainCodes.includes("DATA_PROTECTION"), true);
    assert.equal(domainCodes.includes("SECURITY_READINESS"), true);
  });
});
