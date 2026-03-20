const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

const tokenizePayload = {
  batchId: "BATCH-US2-VERIFY-1",
  commodityCode: "JAGUNG",
  harvestQuantityKg: 620,
  referenceValueIdr: 5100000,
};

test("GET /tokens/{id}/verify returns 200 success shape", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const corr = "GARUDA-99999999-9999-9999-9999-999999999999";
    const mintRes = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify(tokenizePayload),
    });
    const mintBody = await mintRes.json();

    const response = await fetch(`${baseUrl}/api/v1/tokens/${mintBody.data.tokenId}/verify`, {
      headers: { "x-correlation-id": corr },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "SUCCESS");
    assert.equal(body.correlationId, corr);
    assert.equal(body.data.tokenId, mintBody.data.tokenId);
  });
});

test("GET /tokens/{id}/verify returns 503 fallback when Besu unavailable", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();

  await withServer(async (baseUrl) => {
    const corr = "GARUDA-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    applyBesuTestEnv("success");
    const mintRes = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify(tokenizePayload),
    });
    const mintBody = await mintRes.json();

    applyBesuTestEnv("unavailable");
    const response = await fetch(`${baseUrl}/api/v1/tokens/${mintBody.data.tokenId}/verify`, {
      headers: { "x-correlation-id": corr },
    });

    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.status, "FALLBACK");
  });
});
