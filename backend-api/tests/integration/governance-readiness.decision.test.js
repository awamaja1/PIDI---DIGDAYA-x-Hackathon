const fs = require("fs");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  clearInMemoryStates,
  withServer,
  AUDIT_FILE,
} = require("../helpers/gatewayTestUtils");

test("critical fail in audit trace forces NO_GO decision", async () => {
  clearAuditArtifacts();
  clearInMemoryStates();
  applyBesuTestEnv("success");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-18181818-1818-1818-1818-181818181818";
    await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        batchId: "BATCH-GOV-READINESS-DECISION-1",
        commodityCode: "PADI",
        harvestQuantityKg: 450,
        referenceValueIdr: 2500000,
      }),
    });

    // Inject invalid record to trigger AUDIT_TRACE fail (critical severity).
    const invalidEvent = {
      eventTime: new Date().toISOString(),
      actor: "backend-gateway",
      operation: "",
      status: "SUCCESS",
      correlationId,
      txReference: null,
      fallbackReason: null,
      complianceTags: ["CR-001"],
    };
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(invalidEvent) + "\n", "utf8");

    const readinessRes = await fetch(
      `${baseUrl}/api/v1/governance/release-readiness?releaseCandidate=v0.2.0-rc3`
    );
    assert.equal(readinessRes.status, 200);

    const readinessBody = await readinessRes.json();
    const auditTraceItem = readinessBody.data.items.find((item) => item.itemCode === "AUDIT_TRACE");

    assert.equal(Boolean(auditTraceItem), true);
    assert.equal(auditTraceItem.severity, "CRITICAL");
    assert.equal(auditTraceItem.status, "fail");
    assert.equal(readinessBody.data.overallDecision, "NO_GO");
  });
});
