const { getTraceByCorrelationId } = require("../audit/getTraceByCorrelationId");

function uniqueSorted(list) {
  return [...new Set(list)].sort();
}

function mapAuditEvent(event) {
  return {
    eventTime: event.eventTime,
    actor: event.actor,
    operation: event.operation,
    status: event.status,
    txReference: event.txReference,
    fallbackReason: event.fallbackReason,
    complianceTags: uniqueSorted(event.complianceTags || []),
  };
}

function buildEvidenceBundle(correlationId) {
  const trace = getTraceByCorrelationId(correlationId);
  if (!trace.events || trace.events.length === 0) {
    return null;
  }

  const auditTrace = trace.events.map(mapAuditEvent);
  const firstEvent = auditTrace[0];
  const lastEvent = auditTrace[auditTrace.length - 1];
  const operations = uniqueSorted(auditTrace.map((event) => event.operation));
  const complianceTags = uniqueSorted(auditTrace.flatMap((event) => event.complianceTags));
  const fallbackEvent = auditTrace.find((event) => event.status === "FALLBACK") || null;

  return {
    bundleId: `EVIDENCE-${correlationId}`,
    correlationId,
    transactionMetadata: {
      eventCount: auditTrace.length,
      operations,
      firstEventTime: firstEvent.eventTime,
      lastEventTime: lastEvent.eventTime,
    },
    auditTrace,
    fallbackContext: fallbackEvent
      ? {
          operation: fallbackEvent.operation,
          reason: fallbackEvent.fallbackReason,
        }
      : null,
    complianceStatus: {
      complianceTags,
      hasFallback: Boolean(fallbackEvent),
    },
    generatedAt: lastEvent.eventTime,
    sourceRefs: auditTrace.map((_, index) => `${correlationId}#${index + 1}`),
  };
}

module.exports = {
  buildEvidenceBundle,
};