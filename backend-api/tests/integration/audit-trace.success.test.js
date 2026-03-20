const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("audit trace includes tokenize, updateStatus, verifyStatus under one correlationId", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  const correlationId = "GARUDA-eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

  await withServer(async (baseUrl) => {
    const mintRes = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-US3-CHAIN-1",
        commodityCode: "PADI",
        harvestQuantityKg: 420,
        referenceValueIdr: 2000000,
      }),
    });
    const minted = await mintRes.json();
    const tokenId = minted.data.tokenId;

    await fetch(`${baseUrl}/api/v1/tokens/${tokenId}/status`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        newStatus: "VERIFIED",
        reason: "Registry sync",
      }),
    });

    await fetch(`${baseUrl}/api/v1/tokens/${tokenId}/verify`, {
      headers: {
        "x-correlation-id": correlationId,
      },
    });

    const traceRes = await fetch(`${baseUrl}/api/v1/audit/traces/${correlationId}`);
    assert.equal(traceRes.status, 200);
    const traceBody = await traceRes.json();

    assert.equal(traceBody.correlationId, correlationId);
    assert.equal(Array.isArray(traceBody.events), true);
    const operations = traceBody.events.map((event) => event.operation);
    assert.equal(operations.includes("tokenize"), true);
    assert.equal(operations.includes("updateStatus"), true);
    assert.equal(operations.includes("verifyStatus"), true);
  });
});
