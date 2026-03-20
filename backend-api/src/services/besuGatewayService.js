const { loadBesuConfig } = require("../config/besu");
const { AppError } = require("../common/appError");
const { readAbiFile } = require("./besu/abiLoader");
const { classifyBesuFailure } = require("./besu/failureClassifier");
const { buildDeterministicFallback } = require("./fallback/deterministicFallback");
const { writeAuditEvent } = require("./audit/auditStore");
const { mintToken } = require("./besu/mintToken");
const { updateTokenStatus } = require("./besu/updateTokenStatus");
const { getTokenStatus } = require("./besu/getTokenStatus");

function prepareContractContext() {
  const config = loadBesuConfig();
  readAbiFile(config.contracts.tokenizationAbiPath);
  readAbiFile(config.contracts.registryAbiPath);
  return config;
}

function throwIfBesuSimulationFailureEnabled() {
  const simulationMode = String(process.env.BESU_SIMULATION_MODE || "success").toLowerCase();
  if (simulationMode === "success") {
    return;
  }

  if (simulationMode === "timeout") {
    const error = new Error("Besu timeout");
    error.code = "ETIMEDOUT";
    throw error;
  }

  if (simulationMode === "abi-mismatch") {
    const error = new Error("Contract ABI mismatch");
    error.code = "INVALID_ARGUMENT";
    throw error;
  }

  const error = new Error("Besu connection unavailable");
  error.code = "ECONNREFUSED";
  throw error;
}

function handleGatewayFailure({ operation, correlationId, error }) {
  const classification = classifyBesuFailure(error);
  const fallback = buildDeterministicFallback({
    operation,
    classification,
    correlationId,
  });

  writeAuditEvent({
    operation,
    status: "FALLBACK",
    correlationId,
    txReference: null,
    fallbackReason: classification.failureClass,
  });

  return fallback;
}

async function tokenize({ correlationId, payload }) {
  try {
    const config = prepareContractContext();
    const minted = await mintToken({
      config,
      correlationId,
      payload,
    });

    writeAuditEvent({
      operation: "tokenize",
      status: "SUCCESS",
      correlationId,
      txReference: minted.txReference,
      fallbackReason: null,
    });

    return {
      statusCode: 200,
      payload: {
        status: "SUCCESS",
        correlationId,
        txReference: minted.txReference,
        data: {
          tokenId: minted.tokenId,
        },
      },
    };
  } catch (error) {
    return handleGatewayFailure({ operation: "tokenize", correlationId, error });
  }
}

async function updateStatus({ correlationId, tokenId, payload }) {
  try {
    prepareContractContext();
    throwIfBesuSimulationFailureEnabled();
    const updated = await updateTokenStatus({ tokenId, payload });

    writeAuditEvent({
      operation: "updateStatus",
      status: "SUCCESS",
      correlationId,
      txReference: updated.txReference,
      fallbackReason: null,
    });

    return {
      statusCode: 200,
      payload: {
        status: "SUCCESS",
        correlationId,
        txReference: updated.txReference,
        data: {
          tokenId: updated.tokenId,
          status: updated.status,
          reason: updated.reason,
        },
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    return handleGatewayFailure({ operation: "updateStatus", correlationId, error });
  }
}

async function verifyStatus({ correlationId, tokenId }) {
  try {
    prepareContractContext();
    throwIfBesuSimulationFailureEnabled();
    const verified = await getTokenStatus({ tokenId });

    writeAuditEvent({
      operation: "verifyStatus",
      status: "SUCCESS",
      correlationId,
      txReference: verified.txReference,
      fallbackReason: null,
    });

    return {
      statusCode: 200,
      payload: {
        status: "SUCCESS",
        correlationId,
        txReference: verified.txReference,
        data: {
          tokenId: verified.tokenId,
          status: verified.status,
        },
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    return handleGatewayFailure({ operation: "verifyStatus", correlationId, error });
  }
}

module.exports = {
  tokenize,
  updateStatus,
  verifyStatus,
};
