const express = require("express");
const fs = require("fs");
const path = require("path");

const { buildSuccessResponse } = require("../../common/responseSchema");
const { AUDIT_FILE } = require("../../services/audit/auditStore");

const router = express.Router();

router.get("/traces/:correlationId", (req, res, next) => {
  try {
    if (!fs.existsSync(AUDIT_FILE)) {
      return res.status(200).json(
        buildSuccessResponse({
          correlationId: req.correlationId,
          message: "Audit trace kosong",
          data: {
            trace: [],
          },
        })
      );
    }

    const lines = fs.readFileSync(path.resolve(AUDIT_FILE), "utf8").split("\n").filter(Boolean);
    const trace = lines
      .map((line) => JSON.parse(line))
      .filter((event) => event.correlationId === req.params.correlationId)
      .sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));

    return res.status(200).json(
      buildSuccessResponse({
        correlationId: req.correlationId,
        message: "Audit trace berhasil diambil",
        data: {
          trace,
        },
      })
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
