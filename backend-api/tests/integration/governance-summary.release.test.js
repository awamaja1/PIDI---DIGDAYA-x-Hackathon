const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("governance summary supports release period view", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-14141414-1414-1414-1414-141414141414";
    await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-RELEASE-1",
        commodityCode: "PADI",
        harvestQuantityKg: 350,
        referenceValueIdr: 1500000,
      }),
    });

    const releaseKey = "v0.1.0";
    const summaryRes = await fetch(
      `${baseUrl}/api/v1/governance/summary?period=release&key=${releaseKey}`
    );
    assert.equal(summaryRes.status, 200);

    const summaryBody = await summaryRes.json();
    assert.equal(summaryBody.data.periodType, "RELEASE");
    assert.equal(summaryBody.data.periodKey, releaseKey);
    assert.equal(summaryBody.data.eventsAnalyzed >= 1, true);
    assert.equal(["pass", "warn", "fail"].includes(summaryBody.data.overallStatus), true);
  });
});
