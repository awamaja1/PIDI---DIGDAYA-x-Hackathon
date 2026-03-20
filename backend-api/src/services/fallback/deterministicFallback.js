const FALLBACK_BY_OPERATION = {
  tokenize: {
    status: "FALLBACK",
    message: "Tokenisasi sementara menggunakan mode fallback deterministik",
  },
  updateStatus: {
    status: "FALLBACK",
    message: "Update status sementara menggunakan mode fallback deterministik",
  },
  verifyStatus: {
    status: "FALLBACK",
    message: "Verifikasi status sementara menggunakan mode fallback deterministik",
  },
};

function buildDeterministicFallback({ operation, classification, correlationId }) {
  const operationPreset = FALLBACK_BY_OPERATION[operation] || {
    status: "FALLBACK",
    message: "Operasi menggunakan mode fallback deterministik",
  };

  return {
    statusCode: classification.httpStatus,
    payload: {
      operation,
      status: operationPreset.status,
      message: operationPreset.message,
      correlationId,
      error: {
        code: classification.errorCode,
        class: classification.failureClass,
      },
      txReference: null,
    },
  };
}

module.exports = {
  buildDeterministicFallback,
};
