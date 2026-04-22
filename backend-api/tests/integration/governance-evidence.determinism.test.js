const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("governance evidence is deterministic for repeated requests on same correlationId", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  const correlationId = "GARUDA-dddddddd-dddd-dddd-dddd-dddddddddddd";

  await withServer(async (baseUrl) => {
    await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-DETERMINISM-1",
        commodityCode: "PADI",
        harvestQuantityKg: 510,
        referenceValueIdr: 2300000,
      }),
    });

    const first = await fetch(`${baseUrl}/api/v1/governance/evidence/${correlationId}`);
    const second = await fetch(`${baseUrl}/api/v1/governance/evidence/${correlationId}`);
    const third = await fetch(`${baseUrl}/api/v1/governance/evidence/${correlationId}`);

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(third.status, 200);

    const firstBody = await first.json();
    const secondBody = await second.json();
    const thirdBody = await third.json();

    assert.deepEqual(firstBody.data, secondBody.data);
    assert.deepEqual(secondBody.data, thirdBody.data);
  });
});
