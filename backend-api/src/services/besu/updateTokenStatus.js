const { AppError } = require("../../common/appError");
const { getTokenState, saveTokenState } = require("./tokenStateStore");

async function updateTokenStatus({ tokenId, payload }) {
  const current = getTokenState(tokenId);
  if (!current) {
    throw new AppError(404, "TOKEN_NOT_FOUND", "Token tidak ditemukan");
  }

  const updated = saveTokenState({
    tokenId,
    status: payload.newStatus,
    txReference: current.txReference,
  });

  return {
    tokenId,
    status: updated.status,
    reason: payload.reason,
    txReference: updated.txReference,
  };
}

module.exports = {
  updateTokenStatus,
};
