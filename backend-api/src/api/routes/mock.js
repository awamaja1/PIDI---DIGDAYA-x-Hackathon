const express = require("express");
const { AppError } = require("../../common/appError");
const { buildSuccessResponse } = require("../../common/responseSchema");
const {
  getPrices,
  getLatestPriceByCommodity,
  verifyIascTrace,
  getMockHealth,
} = require("../../mock/mockServer");

const router = express.Router();

router.get("/health", (req, res) => {
  return res.status(200).json(
    buildSuccessResponse({
      correlationId: req.correlationId,
      message: "Mock layer healthy",
      data: getMockHealth(),
    })
  );
});

router.get("/pihps/prices", (req, res) => {
  const { commodity, region, startDate, endDate } = req.query;
  const rows = getPrices({
    commodity,
    region,
    startDate,
    endDate,
  });

  return res.status(200).json(
    buildSuccessResponse({
      correlationId: req.correlationId,
      message: "Data harga PIHPS mock berhasil diambil",
      data: {
        count: rows.length,
        rows,
      },
    })
  );
});

router.get("/pihps/prices/:commodity/latest", (req, res, next) => {
  try {
    const latest = getLatestPriceByCommodity(req.params.commodity);

    if (!latest) {
      throw new AppError(404, "COMMODITY_NOT_FOUND", "Komoditas tidak ditemukan pada data mock");
    }

    return res.status(200).json(
      buildSuccessResponse({
        correlationId: req.correlationId,
        message: "Data harga terbaru berhasil diambil",
        data: latest,
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/iasc/verify/:referenceId", (req, res, next) => {
  try {
    const record = verifyIascTrace(req.params.referenceId);

    if (!record) {
      throw new AppError(404, "REFERENCE_ID_NOT_FOUND", "Reference ID tidak ditemukan");
    }

    return res.status(200).json(
      buildSuccessResponse({
        correlationId: req.correlationId,
        message: "Verifikasi IASC mock berhasil",
        data: record,
      })
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
