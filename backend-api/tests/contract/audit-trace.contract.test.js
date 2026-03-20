const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("GET /api/v1/audit/traces/{correlationId} returns contract shape", async () => {
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
        batchId: "BATCH-US3-1",
        commodityCode: "JAGUNG",
        harvestQuantityKg: 111,
        referenceValueIdr: 1000000,
      }),
    });

    const response = await fetch(`${baseUrl}/api/v1/audit/traces/${correlationId}`);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.correlationId, correlationId);
    assert.equal(Array.isArray(body.events), true);
    if (body.events.length > 0) {
      const event = body.events[0];
      assert.equal(typeof event.eventTime, "string");
      assert.equal(typeof event.operation, "string");
      assert.equal(typeof event.status, "string");
      assert.ok(Object.prototype.hasOwnProperty.call(event, "txReference"));
      assert.ok(Object.prototype.hasOwnProperty.call(event, "fallbackReason"));
    }
  });
});
