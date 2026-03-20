const express = require("express");

const { buildSuccessResponse } = require("../../common/responseSchema");
const besuGatewayService = require("../../services/besuGatewayService");

const router = express.Router();

router.post("/tokenize", async (req, res, next) => {
  try {
    const result = await besuGatewayService.tokenize({
      correlationId: req.correlationId,
      payload: req.body,
    });

    return res.status(result.statusCode).json(
      buildSuccessResponse({
        correlationId: req.correlationId,
        message: "Gateway tokenize response",
        data: result.payload,
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.patch("/:tokenId/status", async (req, res, next) => {
  try {
    const result = await besuGatewayService.updateStatus({
      correlationId: req.correlationId,
      tokenId: req.params.tokenId,
      payload: req.body,
    });

    return res.status(result.statusCode).json(
      buildSuccessResponse({
        correlationId: req.correlationId,
        message: "Gateway update status response",
        data: result.payload,
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/:tokenId/verify", async (req, res, next) => {
  try {
    const result = await besuGatewayService.verifyStatus({
      correlationId: req.correlationId,
      tokenId: req.params.tokenId,
    });

    return res.status(result.statusCode).json(
      buildSuccessResponse({
        correlationId: req.correlationId,
        message: "Gateway verify status response",
        data: result.payload,
      })
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
