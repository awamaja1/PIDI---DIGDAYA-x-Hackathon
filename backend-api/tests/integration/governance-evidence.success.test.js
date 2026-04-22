const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("governance evidence includes tokenize, updateStatus, verifyStatus under one correlationId", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  const correlationId = "GARUDA-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  await withServer(async (baseUrl) => {
    const mintRes = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-US1-1",
        commodityCode: "PADI",
        harvestQuantityKg: 420,
        referenceValueIdr: 2000000,
      }),
    });
    const mintBody = await mintRes.json();
    const tokenId = mintBody.data.tokenId;

    await fetch(`${baseUrl}/api/v1/tokens/${tokenId}/status`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        newStatus: "VERIFIED",
        reason: "Governance evidence flow",
      }),
    });

    await fetch(`${baseUrl}/api/v1/tokens/${tokenId}/verify`, {
      headers: {
        "x-correlation-id": correlationId,
      },
    });

    const evidenceRes = await fetch(`${baseUrl}/api/v1/governance/evidence/${correlationId}`);
    assert.equal(evidenceRes.status, 200);
    const evidenceBody = await evidenceRes.json();

    assert.equal(evidenceBody.success, true);
    assert.equal(evidenceBody.data.correlationId, correlationId);

    const operations = evidenceBody.data.auditTrace.map((event) => event.operation);
    assert.equal(operations.includes("tokenize"), true);
    assert.equal(operations.includes("updateStatus"), true);
    assert.equal(operations.includes("verifyStatus"), true);

    assert.equal(Array.isArray(evidenceBody.data.complianceStatus.complianceTags), true);
    assert.equal(evidenceBody.data.complianceStatus.complianceTags.includes("CR-001"), true);
  });
});
