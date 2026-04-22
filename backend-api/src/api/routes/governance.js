const express = require("express");

const { AppError } = require("../../common/appError");
const { buildSuccessResponse } = require("../../common/responseSchema");
const {
  getEvidenceBundle,
  getGovernanceSummary,
  getReleaseReadiness,
} = require("../../services/governance");

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

router.get("/summary", (req, res, next) => {
  try {
    const period = (req.query.period || "daily").toLowerCase();
    if (period !== "daily" && period !== "release") {
      throw new AppError(400, "INVALID_PERIOD", "Parameter period harus daily atau release");
    }

    const key = typeof req.query.key === "string" && req.query.key.trim() !== "" ? req.query.key : null;
    const summary = getGovernanceSummary({ period, key });

    return res.status(200).json(
      buildSuccessResponse({
        correlationId: req.correlationId,
        data: summary,
        message: "Governance summary retrieved",
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/release-readiness", (req, res, next) => {
  try {
    const releaseCandidate =
      typeof req.query.releaseCandidate === "string" && req.query.releaseCandidate.trim() !== ""
        ? req.query.releaseCandidate.trim()
        : "current";

    let override = null;
    if (req.query.overrideItem || req.query.overrideStatus || req.query.overrideReason) {
      const status = typeof req.query.overrideStatus === "string" ? req.query.overrideStatus : "";
      if (!status || !["pass", "warn", "fail"].includes(status)) {
        throw new AppError(400, "INVALID_OVERRIDE_STATUS", "overrideStatus harus pass, warn, atau fail");
      }
      const itemCode = typeof req.query.overrideItem === "string" ? req.query.overrideItem.trim() : "";
      if (!itemCode) {
        throw new AppError(400, "INVALID_OVERRIDE_ITEM", "overrideItem wajib diisi saat override digunakan");
      }
      const reason =
        typeof req.query.overrideReason === "string" && req.query.overrideReason.trim() !== ""
          ? req.query.overrideReason.trim()
          : "Manual override";
      const actor =
        typeof req.query.overrideActor === "string" && req.query.overrideActor.trim() !== ""
          ? req.query.overrideActor.trim()
          : "system";

      override = {
        itemCode,
        status,
        reason,
        actor,
      };
    }

    const readiness = getReleaseReadiness({ releaseCandidate, override });

    return res.status(200).json(
      buildSuccessResponse({
        correlationId: req.correlationId,
        data: readiness,
        message: "Release readiness retrieved",
      })
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;