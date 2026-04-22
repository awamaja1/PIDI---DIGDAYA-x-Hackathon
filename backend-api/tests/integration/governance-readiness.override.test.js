const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("release readiness override keeps traceability metadata", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-19191919-1919-1919-1919-191919191919";
    await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-READINESS-OVERRIDE-1",
        commodityCode: "JAGUNG",
        harvestQuantityKg: 320,
        referenceValueIdr: 1800000,
      }),
    });

    const readinessRes = await fetch(
      `${baseUrl}/api/v1/governance/release-readiness?releaseCandidate=v0.2.0-rc4&overrideItem=AUDIT_TRACE&overrideStatus=pass&overrideReason=Manual%20waiver%20for%20demo&overrideActor=qa-user`
    );
    assert.equal(readinessRes.status, 200);

    const readinessBody = await readinessRes.json();
    const item = readinessBody.data.items.find((entry) => entry.itemCode === "AUDIT_TRACE");

    assert.equal(Boolean(item), true);
    assert.equal(item.override !== null, true);
    assert.equal(item.override.actor, "qa-user");
    assert.equal(item.override.reason, "Manual waiver for demo");
    assert.equal(typeof item.override.timestamp, "string");
    assert.equal(typeof item.override.originalStatus, "string");
    assert.equal(item.status, "pass");
  });
});
