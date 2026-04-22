const { buildEvidenceBundle } = require("./buildEvidenceBundle");
const { buildGovernanceSummary } = require("./buildGovernanceSummary");

function getEvidenceBundle(correlationId) {
  return buildEvidenceBundle(correlationId);
}

function getGovernanceSummary({ period, key }) {
  return buildGovernanceSummary({ period, key });
}

module.exports = {
  getEvidenceBundle,
  getGovernanceSummary,
};