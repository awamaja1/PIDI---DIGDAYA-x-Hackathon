const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("governance evidence captures deterministic fallback context", async () => {
  clearAuditArtifacts();
  applyBesuTestEnv("unavailable");

  const correlationId = "GARUDA-cccccccc-cccc-cccc-cccc-cccccccccccc";

  await withServer(async (baseUrl) => {
    const tokenizeRes = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-FALLBACK-1",
        commodityCode: "JAGUNG",
        harvestQuantityKg: 333,
        referenceValueIdr: 1700000,
      }),
    });
    assert.equal(tokenizeRes.status, 503);

    const evidenceRes = await fetch(`${baseUrl}/api/v1/governance/evidence/${correlationId}`);
    assert.equal(evidenceRes.status, 200);
    const evidenceBody = await evidenceRes.json();

    assert.notEqual(evidenceBody.data.fallbackContext, null);
    assert.equal(evidenceBody.data.fallbackContext.operation, "tokenize");
    assert.equal(typeof evidenceBody.data.fallbackContext.reason, "string");
    assert.equal(evidenceBody.data.complianceStatus.hasFallback, true);
  });
});
