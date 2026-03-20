const crypto = require("crypto");

function createDeterministicHash(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function mintToken({ config, correlationId, payload }) {
  const simulationMode = String(process.env.BESU_SIMULATION_MODE || "success").toLowerCase();

  if (simulationMode === "timeout") {
    const error = new Error("Besu timeout");
    error.code = "ETIMEDOUT";
    throw error;
  }

  if (simulationMode === "unavailable") {
    const error = new Error("Besu connection unavailable");
    error.code = "ECONNREFUSED";
    throw error;
  }

  if (simulationMode === "abi-mismatch") {
    const error = new Error("Contract ABI mismatch");
    error.code = "INVALID_ARGUMENT";
    throw error;
  }

  const hashBase = createDeterministicHash(
    JSON.stringify({
      correlationId,
      batchId: payload.batchId,
      commodityCode: payload.commodityCode,
      harvestQuantityKg: payload.harvestQuantityKg,
      referenceValueIdr: payload.referenceValueIdr,
      rpcUrl: config.rpcUrl,
      chainId: config.chainId,
    })
  );

  return {
    txReference: `0x${hashBase.slice(0, 64)}`,
    tokenId: `TKN-${hashBase.slice(0, 12).toUpperCase()}`,
  };
}

module.exports = {
  mintToken,
};
