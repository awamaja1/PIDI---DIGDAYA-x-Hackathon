const { AppError } = require("../../common/appError");

function validateTokenizeRequest(payload) {
  const errors = [];

  if (typeof payload?.batchId !== "string" || payload.batchId.trim().length === 0) {
    errors.push("batchId wajib berupa string non-kosong");
  }

  if (typeof payload?.commodityCode !== "string" || payload.commodityCode.trim().length === 0) {
    errors.push("commodityCode wajib berupa string non-kosong");
  }

  const harvestQuantityKg = Number(payload?.harvestQuantityKg);
  if (!Number.isFinite(harvestQuantityKg) || harvestQuantityKg <= 0) {
    errors.push("harvestQuantityKg wajib berupa angka > 0");
  }

  const referenceValueIdr = Number(payload?.referenceValueIdr);
  if (!Number.isFinite(referenceValueIdr) || referenceValueIdr < 1) {
    errors.push("referenceValueIdr wajib berupa angka >= 1");
  }

  if (errors.length > 0) {
    throw new AppError(400, "INVALID_TOKENIZE_REQUEST", "Payload tokenisasi tidak valid", {
      errors,
    });
  }
}

module.exports = {
  validateTokenizeRequest,
};
