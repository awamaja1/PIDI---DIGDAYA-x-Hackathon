const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("governance summary includes drilldown refs for warn/fail domains", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-15151515-1515-1515-1515-151515151515";
    await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-DRILLDOWN-1",
        commodityCode: "JAGUNG",
        harvestQuantityKg: 312,
        referenceValueIdr: 1990000,
      }),
    });

    const dayKey = new Date().toISOString().slice(0, 10);
    const summaryRes = await fetch(`${baseUrl}/api/v1/governance/summary?period=daily&key=${dayKey}`);
    assert.equal(summaryRes.status, 200);

    const summaryBody = await summaryRes.json();
    const warnOrFail = summaryBody.data.controlDomains.filter(
      (domain) => domain.status === "warn" || domain.status === "fail"
    );

    assert.equal(warnOrFail.length >= 1, true);
    for (const domain of warnOrFail) {
      assert.equal(Array.isArray(domain.evidenceRefs), true);
      assert.equal(domain.evidenceRefs.length >= 1, true);
      assert.equal(typeof domain.reason, "string");
    }
  });
});
