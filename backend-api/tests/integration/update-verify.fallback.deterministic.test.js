const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("update/verify fallback responses are deterministic for same failure class", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();

  await withServer(async (baseUrl) => {
    const corr = "GARUDA-cccccccc-cccc-cccc-cccc-cccccccccccc";

    applyBesuTestEnv("success");
    const mintRes = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify({
        batchId: "BATCH-US2-FALLBACK-1",
        commodityCode: "PADI",
        harvestQuantityKg: 250,
        referenceValueIdr: 2200000,
      }),
    });
    const mintBody = await mintRes.json();
    const tokenId = mintBody.data.tokenId;

    applyBesuTestEnv("unavailable");

    const update1 = await fetch(`${baseUrl}/api/v1/tokens/${tokenId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify({ newStatus: "VERIFIED", reason: "Step 1" }),
    });
    const update2 = await fetch(`${baseUrl}/api/v1/tokens/${tokenId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify({ newStatus: "VERIFIED", reason: "Step 1" }),
    });

    const verify1 = await fetch(`${baseUrl}/api/v1/tokens/${tokenId}/verify`, {
      headers: { "x-correlation-id": corr },
    });
    const verify2 = await fetch(`${baseUrl}/api/v1/tokens/${tokenId}/verify`, {
      headers: { "x-correlation-id": corr },
    });

    const u1 = await update1.json();
    const u2 = await update2.json();
    const v1 = await verify1.json();
    const v2 = await verify2.json();

    assert.equal(update1.status, 503);
    assert.equal(update2.status, 503);
    assert.equal(verify1.status, 503);
    assert.equal(verify2.status, 503);

    assert.equal(u1.errorCode, u2.errorCode);
    assert.equal(v1.errorCode, v2.errorCode);
    assert.equal(u1.fallback.deterministicKey, u2.fallback.deterministicKey);
    assert.equal(v1.fallback.deterministicKey, v2.fallback.deterministicKey);
  });
});
