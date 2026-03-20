const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyBesuTestEnv,
  clearAuditArtifacts,
  withServer,
} = require("../helpers/gatewayTestUtils");

const payload = {
  batchId: "BATCH-FALLBACK-1",
  commodityCode: "JAGUNG",
  harvestQuantityKg: 500,
  referenceValueIdr: 4100000,
};

test("tokenize fallback is deterministic for repeated identical requests", async () => {
  clearAuditArtifacts();
  applyBesuTestEnv("unavailable");

  await withServer(async (baseUrl) => {
    const correlationId = "GARUDA-44444444-4444-4444-4444-444444444444";
    const send = () =>
      fetch(`${baseUrl}/api/v1/tokens/tokenize`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-correlation-id": correlationId,
        },
        body: JSON.stringify(payload),
      });

    const first = await send();
    const second = await send();
    const third = await send();

    const firstBody = await first.json();
    const secondBody = await second.json();
    const thirdBody = await third.json();

    assert.equal(first.status, 503);
    assert.equal(second.status, 503);
    assert.equal(third.status, 503);

    assert.equal(firstBody.status, "FALLBACK");
    assert.equal(secondBody.status, "FALLBACK");
    assert.equal(thirdBody.status, "FALLBACK");

    assert.equal(firstBody.errorCode, secondBody.errorCode);
    assert.equal(secondBody.errorCode, thirdBody.errorCode);
    assert.equal(firstBody.fallback.deterministicKey, secondBody.fallback.deterministicKey);
    assert.equal(secondBody.fallback.deterministicKey, thirdBody.fallback.deterministicKey);
    assert.deepEqual(Object.keys(firstBody).sort(), Object.keys(secondBody).sort());
    assert.deepEqual(Object.keys(secondBody).sort(), Object.keys(thirdBody).sort());
  });
});
