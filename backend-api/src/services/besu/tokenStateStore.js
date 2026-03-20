const tokenStates = new Map();

function saveTokenState({ tokenId, status, txReference }) {
  tokenStates.set(tokenId, {
    tokenId,
    status,
    txReference,
    updatedAt: new Date().toISOString(),
  });
  return tokenStates.get(tokenId);
}

function getTokenState(tokenId) {
  return tokenStates.get(tokenId) || null;
}

function clearTokenStates() {
  tokenStates.clear();
}

module.exports = {
  saveTokenState,
  getTokenState,
  clearTokenStates,
};
