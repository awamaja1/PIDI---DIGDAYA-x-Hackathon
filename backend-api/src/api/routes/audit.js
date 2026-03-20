const express = require("express");
const { AppError } = require("../../common/appError");
const { getTraceByCorrelationId } = require("../../services/audit/getTraceByCorrelationId");

const router = express.Router();

const CORRELATION_PATTERN = /^GARUDA-[0-9a-fA-F-]{36}$/;

router.get("/traces/:correlationId", (req, res, next) => {
  try {
    const pathCorrelationId = req.params.correlationId;
    if (!CORRELATION_PATTERN.test(pathCorrelationId)) {
      throw new AppError(400, "INVALID_CORRELATION_ID", "Format correlationId tidak valid");
    }

    const trace = getTraceByCorrelationId(pathCorrelationId);
    return res.status(200).json(trace);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
