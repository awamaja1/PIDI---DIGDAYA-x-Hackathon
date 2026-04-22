const express = require("express");

const { AppError } = require("../../common/appError");
const { buildSuccessResponse } = require("../../common/responseSchema");
const { getEvidenceBundle } = require("../../services/governance");

const router = express.Router();

const CORRELATION_PATTERN = /^GARUDA-[0-9a-fA-F-]{36}$/;

router.get("/evidence/:correlationId", (req, res, next) => {
  try {
    const pathCorrelationId = req.params.correlationId;
    if (!CORRELATION_PATTERN.test(pathCorrelationId)) {
      throw new AppError(400, "INVALID_CORRELATION_ID", "Format correlationId tidak valid");
    }

    const evidenceBundle = getEvidenceBundle(pathCorrelationId);
    if (!evidenceBundle) {
      throw new AppError(404, "EVIDENCE_NOT_FOUND", "Evidence bundle tidak ditemukan");
    }

    return res.status(200).json(
      buildSuccessResponse({
        correlationId: req.correlationId,
        data: evidenceBundle,
        message: "Evidence bundle retrieved",
      })
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;