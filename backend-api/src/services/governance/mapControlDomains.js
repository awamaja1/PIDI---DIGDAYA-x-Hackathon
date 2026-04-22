const REQUIRED_EVENT_FIELDS = ["eventTime", "operation", "status", "correlationId"];
const ALLOWED_EVENT_FIELDS = [
  "eventTime",
  "actor",
  "operation",
  "status",
  "correlationId",
  "txReference",
  "fallbackReason",
  "complianceTags",
];

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function toEvidenceRef(event) {
  return `${event.correlationId}:${event.operation}:${event.eventTime}`;
}

function classifyAuditTrace(events) {
  const invalidEvents = events.filter((event) =>
    REQUIRED_EVENT_FIELDS.some((field) => !event[field] || String(event[field]).trim() === "")
  );

  if (events.length === 0) {
    return {
      domainCode: "AUDIT_TRACE",
      status: "fail",
      reason: "No audit events found for selected period",
      affectedCorrelations: [],
      evidenceRefs: [],
    };
  }

  if (invalidEvents.length > 0) {
    return {
      domainCode: "AUDIT_TRACE",
      status: "fail",
      reason: "Audit events missing required fields",
      affectedCorrelations: uniqueSorted(invalidEvents.map((event) => event.correlationId)),
      evidenceRefs: uniqueSorted(invalidEvents.map(toEvidenceRef)),
    };
  }

  return {
    domainCode: "AUDIT_TRACE",
    status: "pass",
    reason: "All events contain required audit trace fields",
    affectedCorrelations: [],
    evidenceRefs: uniqueSorted(events.map(toEvidenceRef)),
  };
}

function classifyFallbackDeterminism(events) {
  const fallbackEvents = events.filter((event) => event.status === "FALLBACK");

  if (fallbackEvents.length === 0) {
    return {
      domainCode: "FALLBACK_DETERMINISM",
      status: "warn",
      reason: "No fallback event in selected period; determinism not exercised",
      affectedCorrelations: uniqueSorted(events.map((event) => event.correlationId)),
      evidenceRefs: uniqueSorted(events.map(toEvidenceRef)),
    };
  }

  const invalidFallback = fallbackEvents.filter(
    (event) => !event.fallbackReason || String(event.fallbackReason).trim() === ""
  );

  if (invalidFallback.length > 0) {
    return {
      domainCode: "FALLBACK_DETERMINISM",
      status: "fail",
      reason: "Fallback event missing fallback reason",
      affectedCorrelations: uniqueSorted(invalidFallback.map((event) => event.correlationId)),
      evidenceRefs: uniqueSorted(invalidFallback.map(toEvidenceRef)),
    };
  }

  return {
    domainCode: "FALLBACK_DETERMINISM",
    status: "pass",
    reason: "Fallback events include deterministic reason context",
    affectedCorrelations: [],
    evidenceRefs: uniqueSorted(fallbackEvents.map(toEvidenceRef)),
  };
}

function classifyDataProtection(events) {
  const disallowed = events.filter((event) =>
    Object.keys(event).some((field) => !ALLOWED_EVENT_FIELDS.includes(field))
  );

  if (disallowed.length > 0) {
    return {
      domainCode: "DATA_PROTECTION",
      status: "fail",
      reason: "Audit events include non-whitelisted fields",
      affectedCorrelations: uniqueSorted(disallowed.map((event) => event.correlationId)),
      evidenceRefs: uniqueSorted(disallowed.map(toEvidenceRef)),
    };
  }

  return {
    domainCode: "DATA_PROTECTION",
    status: "pass",
    reason: "Audit events stay within field whitelist",
    affectedCorrelations: [],
    evidenceRefs: uniqueSorted(events.map(toEvidenceRef)),
  };
}

function classifySecurityReadiness(events) {
  if (events.length === 0) {
    return {
      domainCode: "SECURITY_READINESS",
      status: "warn",
      reason: "No events available for security readiness evaluation",
      affectedCorrelations: [],
      evidenceRefs: [],
    };
  }

  const missingTags = events.filter(
    (event) => !Array.isArray(event.complianceTags) || event.complianceTags.length === 0
  );

  if (missingTags.length > 0) {
    return {
      domainCode: "SECURITY_READINESS",
      status: "fail",
      reason: "One or more events missing compliance tags",
      affectedCorrelations: uniqueSorted(missingTags.map((event) => event.correlationId)),
      evidenceRefs: uniqueSorted(missingTags.map(toEvidenceRef)),
    };
  }

  return {
    domainCode: "SECURITY_READINESS",
    status: "pass",
    reason: "Compliance tags available for all events",
    affectedCorrelations: [],
    evidenceRefs: uniqueSorted(events.map(toEvidenceRef)),
  };
}

function mapControlDomains(events) {
  return [
    classifyAuditTrace(events),
    classifyFallbackDeterminism(events),
    classifyDataProtection(events),
    classifySecurityReadiness(events),
  ];
}

module.exports = {
  mapControlDomains,
};