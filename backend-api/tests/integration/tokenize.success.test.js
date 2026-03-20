const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  withServer,
} = require("../helpers/gatewayTestUtils");

const payload = {
  batchId: "BATCH-SUCCESS-1",
  commodityCode: "GABAH",
  harvestQuantityKg: 950,
  referenceValueIdr: 7200000,
};

test("tokenize success flow returns SUCCESS, txReference, and correlationId echo", async () => {
  clearAuditArtifacts();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-33333333-3333-3333-3333-333333333333";
    const response = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify(payload),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "SUCCESS");
    assert.equal(body.correlationId, correlationId);
    assert.equal(typeof body.txReference, "string");
    assert.match(body.txReference, /^0x[0-9a-f]{64}$/);
  });
});
