const { readAllAuditEvents } = require("./auditStore");

function getTraceByCorrelationId(correlationId) {
  const events = readAllAuditEvents()
    .filter((event) => event.correlationId === correlationId)
    .sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));

  return {
    correlationId,
    events,
  };
}

module.exports = {
  getTraceByCorrelationId,
};
