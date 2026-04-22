const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
} = require("../helpers/gatewayTestUtils");

test("release readiness checklist is derived from governance summary statuses", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-17171717-1717-1717-1717-171717171717";
    await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-READINESS-DERIVE-1",
        commodityCode: "JAGUNG",
        harvestQuantityKg: 380,
        referenceValueIdr: 2100000,
      }),
    });

    const releaseCandidate = "v0.2.0-rc2";
    const summaryRes = await fetch(
      `${baseUrl}/api/v1/governance/summary?period=release&key=${releaseCandidate}`
    );
    const readinessRes = await fetch(
      `${baseUrl}/api/v1/governance/release-readiness?releaseCandidate=${releaseCandidate}`
    );

    assert.equal(summaryRes.status, 200);
    assert.equal(readinessRes.status, 200);

    const summaryBody = await summaryRes.json();
    const readinessBody = await readinessRes.json();

    const statusByDomain = new Map(
      summaryBody.data.controlDomains.map((domain) => [domain.domainCode, domain.status])
    );

    for (const item of readinessBody.data.items) {
      assert.equal(typeof item.evidenceRef, "string");
      assert.equal(item.evidenceRef.length > 0, true);
      if (statusByDomain.has(item.itemCode)) {
        assert.equal(item.status, statusByDomain.get(item.itemCode));
      }
    }
  });
});
