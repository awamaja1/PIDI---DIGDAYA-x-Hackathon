function buildSuccessResponse({ correlationId, data = null, message = "OK" }) {
  return {
    success: true,
    message,
    data,
    correlationId,
    timestamp: new Date().toISOString(),
  };
}

function buildErrorResponse({
  correlationId,
  code = "INTERNAL_SERVER_ERROR",
  message = "Terjadi kesalahan pada server",
  details = null,
}) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    correlationId,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  buildSuccessResponse,
  buildErrorResponse,
};
