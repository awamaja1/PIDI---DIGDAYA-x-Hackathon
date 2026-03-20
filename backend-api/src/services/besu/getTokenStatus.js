const { AppError } = require("../../common/appError");
const { getTokenState } = require("./tokenStateStore");

async function getTokenStatus({ tokenId }) {
  const state = getTokenState(tokenId);
  if (!state) {
    throw new AppError(404, "TOKEN_NOT_FOUND", "Token tidak ditemukan");
  }

  return {
    tokenId,
    status: state.status,
    txReference: state.txReference,
  };
}

module.exports = {
  getTokenStatus,
};
