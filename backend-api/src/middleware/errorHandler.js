const { AppError } = require("../common/appError");
const { buildErrorResponse } = require("../common/responseSchema");

function notFoundHandler(req, res) {
  return res.status(404).json(
    buildErrorResponse({
      correlationId: req.correlationId,
      code: "NOT_FOUND",
      message: "Endpoint tidak ditemukan",
      details: {
        method: req.method,
        path: req.originalUrl,
      },
    })
  );
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      buildErrorResponse({
        correlationId: req.correlationId,
        code: err.code,
        message: err.message,
        details: err.details,
      })
    );
  }

  return res.status(500).json(
    buildErrorResponse({
      correlationId: req.correlationId,
      code: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan internal server",
      details: process.env.NODE_ENV === "production" ? null : { reason: err.message },
    })
  );
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
