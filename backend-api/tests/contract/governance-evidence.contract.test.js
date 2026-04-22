const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("GET /api/v1/governance/evidence/{correlationId} returns contract shape", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  const correlationId = "GARUDA-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  await withServer(async (baseUrl) => {
    const mintRes = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-CONTRACT-1",
        commodityCode: "JAGUNG",
        harvestQuantityKg: 250,
        referenceValueIdr: 1200000,
      }),
    });
    assert.equal(mintRes.status, 200);

    const response = await fetch(`${baseUrl}/api/v1/governance/evidence/${correlationId}`);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.message, "Evidence bundle retrieved");
    assert.equal(typeof body.timestamp, "string");
    assert.equal(typeof body.correlationId, "string");
    assert.equal(/^GARUDA-[0-9a-fA-F-]{36}$/.test(body.correlationId), true);

    assert.equal(body.data.correlationId, correlationId);
    assert.equal(Array.isArray(body.data.auditTrace), true);
    assert.equal(Array.isArray(body.data.sourceRefs), true);
    assert.equal(typeof body.data.bundleId, "string");
    assert.equal(typeof body.data.generatedAt, "string");

    const metadata = body.data.transactionMetadata;
    assert.equal(typeof metadata.eventCount, "number");
    assert.equal(Array.isArray(metadata.operations), true);
    assert.equal(typeof metadata.firstEventTime, "string");
    assert.equal(typeof metadata.lastEventTime, "string");
  });
});
