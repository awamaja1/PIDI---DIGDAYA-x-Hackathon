const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

const tokenizePayload = {
  batchId: "BATCH-US2-CONTRACT-1",
  commodityCode: "PADI",
  harvestQuantityKg: 1000,
  referenceValueIdr: 9000000,
};

test("PATCH /tokens/{id}/status returns 200 on success", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const corr = "GARUDA-66666666-6666-6666-6666-666666666666";
    const mintRes = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify(tokenizePayload),
    });
    const mintBody = await mintRes.json();

    const response = await fetch(`${baseUrl}/api/v1/tokens/${mintBody.data.tokenId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify({ newStatus: "VERIFIED", reason: "KYC complete" }),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "SUCCESS");
    assert.equal(body.correlationId, corr);
    assert.equal(body.data.status, "VERIFIED");
  });
});

test("PATCH /tokens/{id}/status returns 404 when token not found", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const corr = "GARUDA-77777777-7777-7777-7777-777777777777";
    const response = await fetch(`${baseUrl}/api/v1/tokens/TKN-NOTFOUND/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify({ newStatus: "VERIFIED", reason: "KYC complete" }),
    });

    assert.equal(response.status, 404);
  });
});

test("PATCH /tokens/{id}/status returns 503 fallback on Besu unavailable", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();

  await withServer(async (baseUrl) => {
    const corr = "GARUDA-88888888-8888-8888-8888-888888888888";

    applyBesuTestEnv("success");
    const mintRes = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify(tokenizePayload),
    });
    const mintBody = await mintRes.json();

    applyBesuTestEnv("unavailable");
    const response = await fetch(`${baseUrl}/api/v1/tokens/${mintBody.data.tokenId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-correlation-id": corr },
      body: JSON.stringify({ newStatus: "VERIFIED", reason: "KYC complete" }),
    });

    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.status, "FALLBACK");
  });
});
