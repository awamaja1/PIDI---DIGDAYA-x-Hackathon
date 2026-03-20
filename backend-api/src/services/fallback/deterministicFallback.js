const crypto = require("crypto");

const FALLBACK_BY_OPERATION = {
  tokenize: "Tokenisasi sementara menggunakan mode fallback deterministik",
  updateStatus: "Update status sementara menggunakan mode fallback deterministik",
  verifyStatus: "Verifikasi status sementara menggunakan mode fallback deterministik",
};

function buildDeterministicFallback({ operation, classification, correlationId }) {
  const reason = FALLBACK_BY_OPERATION[operation] || "Operasi menggunakan mode fallback deterministik";
  const deterministicKey = crypto
    .createHash("sha256")
    .update(`${operation}:${classification.failureClass}`)
    .digest("hex")
    .slice(0, 16);

  return {
    statusCode: classification.httpStatus,
    payload: {
      status: "FALLBACK",
      errorCode: classification.errorCode,
      correlationId,
      fallback: {
        reason,
        deterministicKey,
      },
    },
  };
}

module.exports = {
  buildDeterministicFallback,
};
