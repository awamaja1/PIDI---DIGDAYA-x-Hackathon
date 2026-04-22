const { readAllAuditEvents } = require("../audit/auditStore");
const { mapControlDomains } = require("./mapControlDomains");

function formatDateKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function resolvePeriodKey(period, key, events) {
  if (key) {
    return key;
  }

  if (period === "daily") {
    return new Date().toISOString().slice(0, 10);
  }

  if (events.length === 0) {
    return "current";
  }

  const latestEvent = events.reduce((latest, event) => {
    if (!latest) {
      return event;
    }
    return new Date(event.eventTime) > new Date(latest.eventTime) ? event : latest;
  }, null);

  return `release-${formatDateKey(latestEvent.eventTime)}`;
}

function filterEventsByPeriod(events, period, periodKey) {
  if (period === "daily") {
    return events.filter((event) => formatDateKey(event.eventTime) === periodKey);
  }

  // Release mode groups by all available events for PoC scope.
  return events;
}

function statusRank(status) {
  if (status === "fail") {
    return 3;
  }
  if (status === "warn") {
    return 2;
  }
  return 1;
}

function deriveOverallStatus(controlDomains) {
  const highest = controlDomains.reduce((rank, domain) => {
    const currentRank = statusRank(domain.status);
    return currentRank > rank ? currentRank : rank;
  }, 1);

  if (highest === 3) {
    return "fail";
  }
  if (highest === 2) {
    return "warn";
  }
  return "pass";
}

function calculateCoverage(events) {
  if (events.length === 0) {
    return 0;
  }

  const covered = events.filter(
    (event) =>
      Boolean(event.eventTime) &&
      Boolean(event.operation) &&
      Boolean(event.status) &&
      Boolean(event.correlationId) &&
      Array.isArray(event.complianceTags) &&
      event.complianceTags.length > 0
  ).length;

  return Number(((covered / events.length) * 100).toFixed(2));
}

function buildGovernanceSummary({ period, key }) {
  const allEvents = readAllAuditEvents();
  const periodType = period === "release" ? "RELEASE" : "DAILY";
  const periodKey = resolvePeriodKey(period, key, allEvents);
  const scopedEvents = filterEventsByPeriod(allEvents, period, periodKey);
  const controlDomains = mapControlDomains(scopedEvents);

  return {
    summaryId: `GOV-SUMMARY-${periodType}-${periodKey}`,
    periodType,
    periodKey,
    controlDomains,
    overallStatus: deriveOverallStatus(controlDomains),
    evaluatedAt: new Date().toISOString(),
    evidenceCoveragePct: calculateCoverage(scopedEvents),
    eventsAnalyzed: scopedEvents.length,
  };
}

module.exports = {
  buildGovernanceSummary,
};