const { buildEvidenceBundle } = require("./buildEvidenceBundle");

function getEvidenceBundle(correlationId) {
  return buildEvidenceBundle(correlationId);
}

module.exports = {
  getEvidenceBundle,
};