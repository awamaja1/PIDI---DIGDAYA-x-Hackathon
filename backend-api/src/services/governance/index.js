const { buildEvidenceBundle } = require("./buildEvidenceBundle");
const { buildGovernanceSummary } = require("./buildGovernanceSummary");
const { evaluateReleaseReadiness } = require("./evaluateReleaseReadiness");

function getEvidenceBundle(correlationId) {
  return buildEvidenceBundle(correlationId);
}

function getGovernanceSummary({ period, key }) {
  return buildGovernanceSummary({ period, key });
}

function getReleaseReadiness({ releaseCandidate, override }) {
  return evaluateReleaseReadiness({ releaseCandidate, override });
}

module.exports = {
  getEvidenceBundle,
  getGovernanceSummary,
  getReleaseReadiness,
};