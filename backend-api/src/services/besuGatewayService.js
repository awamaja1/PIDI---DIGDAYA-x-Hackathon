const { loadBesuConfig } = require("../config/besu");
const { readAbiFile } = require("./besu/abiLoader");
const { classifyBesuFailure } = require("./besu/failureClassifier");
const { buildDeterministicFallback } = require("./fallback/deterministicFallback");
const { writeAuditEvent } = require("./audit/auditStore");

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

async function tokenize({ correlationId }) {
  try {
    prepareContractContext();
    throw new Error("BESU_TOKENIZE_NOT_IMPLEMENTED");
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
