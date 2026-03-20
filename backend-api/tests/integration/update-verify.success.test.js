const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("update then verify returns consistent status for same token", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const corr = "GARUDA-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const tokenizePayload = {
      batchId: "BATCH-US2-INT-1",
      commodityCode: "KOPI",
      harvestQuantityKg: 300,
      referenceValueIdr: 3000000,
    };

    const mintRes = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify(tokenizePayload),
    });
    const mintBody = await mintRes.json();
    const tokenId = mintBody.data.tokenId;

    const updateRes = await fetch(`${baseUrl}/api/v1/tokens/${tokenId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify({ newStatus: "COLLATERALIZED", reason: "Bank pledge" }),
    });
    assert.equal(updateRes.status, 200);

    const verifyRes = await fetch(`${baseUrl}/api/v1/tokens/${tokenId}/verify`, {
      headers: { "x-correlation-id": corr },
    });
    assert.equal(verifyRes.status, 200);

    const updateBody = await updateRes.json();
    const verifyBody = await verifyRes.json();
    assert.equal(updateBody.data.status, "COLLATERALIZED");
    assert.equal(verifyBody.data.status, "COLLATERALIZED");
  });
});
