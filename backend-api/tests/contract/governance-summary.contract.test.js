const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("GET /api/v1/governance/summary returns contract shape", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-12121212-1212-1212-1212-121212121212";
    await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-SUMMARY-CONTRACT-1",
        commodityCode: "PADI",
        harvestQuantityKg: 201,
        referenceValueIdr: 1000001,
      }),
    });

    const dayKey = new Date().toISOString().slice(0, 10);
    const response = await fetch(`${baseUrl}/api/v1/governance/summary?period=daily&key=${dayKey}`);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.message, "Governance summary retrieved");
    assert.equal(typeof body.timestamp, "string");
    assert.equal(typeof body.data.summaryId, "string");
    assert.equal(body.data.periodType, "DAILY");
    assert.equal(body.data.periodKey, dayKey);
    assert.equal(Array.isArray(body.data.controlDomains), true);
    assert.equal(typeof body.data.overallStatus, "string");
    assert.equal(typeof body.data.evidenceCoveragePct, "number");
  });
});
