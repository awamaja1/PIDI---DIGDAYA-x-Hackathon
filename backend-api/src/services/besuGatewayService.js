const { loadBesuConfig } = require("../config/besu");
const { readAbiFile } = require("./besu/abiLoader");
const { classifyBesuFailure } = require("./besu/failureClassifier");
const { buildDeterministicFallback } = require("./fallback/deterministicFallback");
const { writeAuditEvent } = require("./audit/auditStore");
const { mintToken } = require("./besu/mintToken");

function prepareContractContext() {
  const config = loadBesuConfig();
  readAbiFile(config.contracts.tokenizationAbiPath);
  readAbiFile(config.contracts.registryAbiPath);
  return config;
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

async function updateStatus({ correlationId }) {
  try {
    prepareContractContext();
    throw new Error("BESU_UPDATE_STATUS_NOT_IMPLEMENTED");
  } catch (error) {
    return handleGatewayFailure({ operation: "updateStatus", correlationId, error });
  }
}

async function verifyStatus({ correlationId }) {
  try {
    prepareContractContext();
    throw new Error("BESU_VERIFY_STATUS_NOT_IMPLEMENTED");
  } catch (error) {
    return handleGatewayFailure({ operation: "verifyStatus", correlationId, error });
  }
}

module.exports = {
  tokenize,
  updateStatus,
  verifyStatus,
};
