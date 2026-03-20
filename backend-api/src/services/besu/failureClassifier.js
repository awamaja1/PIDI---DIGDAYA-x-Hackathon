function classifyBesuFailure(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  if (message.includes("timeout") || code === "ETIMEDOUT" || code === "ECONNABORTED") {
    return {
      failureClass: "TIMEOUT",
      httpStatus: 503,
      errorCode: "BESU_TIMEOUT",
    };
  }

  if (message.includes("abi") || message.includes("invalid argument") || code === "INVALID_ARGUMENT") {
    return {
      failureClass: "ABI_MISMATCH",
      httpStatus: 503,
      errorCode: "CONTRACT_ABI_MISMATCH",
    };
  }

  if (
    message.includes("connect") ||
    message.includes("network") ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND"
  ) {
    return {
      failureClass: "CONNECTION_ERROR",
      httpStatus: 503,
      errorCode: "BESU_UNAVAILABLE",
    };
  }

  return {
    failureClass: "UNKNOWN",
    httpStatus: 503,
    errorCode: "BESU_UNAVAILABLE",
  };
}

module.exports = {
  classifyBesuFailure,
};
