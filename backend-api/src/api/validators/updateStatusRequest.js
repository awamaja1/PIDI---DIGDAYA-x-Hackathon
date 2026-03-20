const { AppError } = require("../../common/appError");

const ALLOWED_STATUS = new Set(["VERIFIED", "COLLATERALIZED", "REJECTED", "RELEASED"]);

function validateUpdateStatusRequest(payload) {
  const newStatus = payload?.newStatus;
  const reason = payload?.reason;
  const errors = [];

  if (typeof newStatus !== "string" || !ALLOWED_STATUS.has(newStatus)) {
    errors.push("newStatus wajib salah satu: VERIFIED|COLLATERALIZED|REJECTED|RELEASED");
  }

  if (typeof reason !== "string" || reason.trim().length === 0) {
    errors.push("reason wajib berupa string non-kosong");
  }

  if (errors.length > 0) {
    throw new AppError(400, "INVALID_UPDATE_STATUS_REQUEST", "Payload update status tidak valid", {
      errors,
    });
  }
}

module.exports = {
  validateUpdateStatusRequest,
};
