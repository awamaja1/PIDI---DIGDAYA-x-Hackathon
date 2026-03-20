const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("audit trace records fallback reason for failed operation", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();

  const correlationId = "GARUDA-ffffffff-ffff-ffff-ffff-ffffffffffff";

  await withServer(async (baseUrl) => {
    applyBesuTestEnv("unavailable");

    const fallbackRes = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-US3-FALLBACK-1",
        commodityCode: "KOPI",
        harvestQuantityKg: 90,
        referenceValueIdr: 800000,
      }),
    });
    assert.equal(fallbackRes.status, 503);

    const traceRes = await fetch(`${baseUrl}/api/v1/audit/traces/${correlationId}`);
    assert.equal(traceRes.status, 200);

    const traceBody = await traceRes.json();
    const fallbackEvent = traceBody.events.find((event) => event.status === "FALLBACK");
    assert.equal(Boolean(fallbackEvent), true);
    assert.equal(typeof fallbackEvent.fallbackReason, "string");
    assert.equal(Array.isArray(fallbackEvent.complianceTags), true);
    assert.equal(fallbackEvent.complianceTags.includes("CR-004"), true);
  });
});
