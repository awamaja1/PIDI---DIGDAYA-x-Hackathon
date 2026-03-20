const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  withServer,
} = require("../helpers/gatewayTestUtils");

const validPayload = {
  batchId: "BATCH-001",
  commodityCode: "JAGUNG",
  harvestQuantityKg: 1200,
  referenceValueIdr: 8500000,
};

test("POST /api/v1/tokens/tokenize returns 200 with GatewaySuccessResponse shape", async () => {
  clearAuditArtifacts();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-11111111-1111-1111-1111-111111111111";
    const response = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify(validPayload),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "SUCCESS");
    assert.equal(body.correlationId, correlationId);
    assert.equal(typeof body.txReference, "string");
    assert.equal(typeof body.data, "object");
  });
});

test("POST /api/v1/tokens/tokenize returns 503 with GatewayFallbackResponse shape", async () => {
  clearAuditArtifacts();
  applyBesuTestEnv("unavailable");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-22222222-2222-2222-2222-222222222222";
    const response = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify(validPayload),
    });

    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.status, "FALLBACK");
    assert.equal(body.correlationId, correlationId);
    assert.ok(["BESU_UNAVAILABLE", "BESU_TIMEOUT", "CONTRACT_ABI_MISMATCH"].includes(body.errorCode));
    assert.equal(typeof body.fallback, "object");
    assert.equal(typeof body.fallback.reason, "string");
    assert.equal(typeof body.fallback.deterministicKey, "string");
  });
});
