const express = require("express");
const { buildSuccessResponse } = require("../../common/responseSchema");

const router = express.Router();

router.get("/health", (req, res) => {
  return res.status(200).json(
    buildSuccessResponse({
      correlationId: req.correlationId,
      message: "GARUDA-LINK backend-api healthy",
      data: {
        backend: "healthy",
        mockLayer: "ready",
      },
    })
  );
});

module.exports = router;
