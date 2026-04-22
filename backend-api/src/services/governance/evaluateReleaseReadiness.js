const { buildGovernanceSummary } = require("./buildGovernanceSummary");
const { decideGoNoGo } = require("./decideGoNoGo");

const DOMAIN_TO_ITEM = {
  AUDIT_TRACE: {
    itemCode: "AUDIT_TRACE",
    description: "Audit trace lengkap dan valid",
    severity: "CRITICAL",
  },
  FALLBACK_DETERMINISM: {
    itemCode: "FALLBACK_DETERMINISM",
    description: "Fallback determinism tervalidasi",
    severity: "HIGH",
  },
  DATA_PROTECTION: {
    itemCode: "DATA_PROTECTION",
    description: "Field evidence sesuai whitelist data protection",
    severity: "CRITICAL",
  },
  SECURITY_READINESS: {
    itemCode: "SECURITY_READINESS",
    description: "Compliance tags tersedia untuk readiness review",
    severity: "HIGH",
  },
};

function toChecklistItem(domainStatus) {
  const mapping = DOMAIN_TO_ITEM[domainStatus.domainCode] || {
    itemCode: domainStatus.domainCode,
    description: domainStatus.reason,
    severity: "MEDIUM",
  };

  return {
    itemCode: mapping.itemCode,
    description: mapping.description,
    severity: mapping.severity,
    status: domainStatus.status,
    evidenceRef:
      domainStatus.evidenceRefs && domainStatus.evidenceRefs.length > 0
        ? domainStatus.evidenceRefs[0]
        : `summary:${domainStatus.domainCode}`,
    override: null,
  };
}

function applyOverride(items, override) {
  if (!override) {
    return items;
  }

  return items.map((item) => {
    if (item.itemCode !== override.itemCode) {
      return item;
    }

    return {
      ...item,
      status: override.status,
      override: {
        actor: override.actor,
        reason: override.reason,
        timestamp: new Date().toISOString(),
        originalStatus: item.status,
      },
    };
  });
}

function evaluateReleaseReadiness({ releaseCandidate, override = null }) {
  const summary = buildGovernanceSummary({ period: "release", key: releaseCandidate });
  const derivedItems = summary.controlDomains.map(toChecklistItem);
  const items = applyOverride(derivedItems, override);

  return {
    checklistId: `READINESS-${releaseCandidate}`,
    releaseCandidate,
    items,
    overallDecision: decideGoNoGo(items),
    evaluatedBy: override ? override.actor : "system",
    evaluatedAt: new Date().toISOString(),
    summaryRef: summary.summaryId,
  };
}

module.exports = {
  evaluateReleaseReadiness,
};