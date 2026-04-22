const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("GET /api/v1/governance/release-readiness returns contract shape", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-16161616-1616-1616-1616-161616161616";
    await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-READINESS-CONTRACT-1",
        commodityCode: "PADI",
        harvestQuantityKg: 415,
        referenceValueIdr: 2001000,
      }),
    });

    const response = await fetch(
      `${baseUrl}/api/v1/governance/release-readiness?releaseCandidate=v0.2.0-rc1`
    );
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.message, "Release readiness retrieved");
    assert.equal(typeof body.data.checklistId, "string");
    assert.equal(body.data.releaseCandidate, "v0.2.0-rc1");
    assert.equal(Array.isArray(body.data.items), true);
    assert.equal(typeof body.data.overallDecision, "string");
    assert.equal(typeof body.data.summaryRef, "string");

    const item = body.data.items[0];
    assert.equal(typeof item.itemCode, "string");
    assert.equal(typeof item.description, "string");
    assert.equal(typeof item.severity, "string");
    assert.equal(typeof item.status, "string");
    assert.equal(typeof item.evidenceRef, "string");
    assert.ok(Object.prototype.hasOwnProperty.call(item, "override"));
  });
});
