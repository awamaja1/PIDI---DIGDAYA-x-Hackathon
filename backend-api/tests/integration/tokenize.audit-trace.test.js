const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  withServer,
  AUDIT_FILE,
} = require("../helpers/gatewayTestUtils");

const payload = {
  batchId: "BATCH-AUDIT-1",
  commodityCode: "KOPI",
  harvestQuantityKg: 777,
  referenceValueIdr: 6400000,
};

test("tokenize writes audit trace with matching correlationId and operation", async () => {
  clearAuditArtifacts();
  applyBesuTestEnv("success");

  const correlationId = "GARUDA-55555555-5555-5555-5555-555555555555";

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify(payload),
    });

    assert.equal(response.status, 200);
  });

  assert.equal(fs.existsSync(AUDIT_FILE), true);
  const lines = fs
    .readFileSync(AUDIT_FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const event = lines.find((entry) => entry.correlationId === correlationId && entry.operation === "tokenize");
  assert.equal(Boolean(event), true);
  assert.equal(event.operation, "tokenize");
  assert.equal(event.correlationId, correlationId);
  assert.ok(["SUCCESS", "FALLBACK"].includes(event.status));
});
