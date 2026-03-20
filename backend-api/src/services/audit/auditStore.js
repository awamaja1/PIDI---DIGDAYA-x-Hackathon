const fs = require("fs");
const path = require("path");

const AUDIT_DIR = path.resolve(process.cwd(), "logs");
const AUDIT_FILE = path.join(AUDIT_DIR, "audit-events.ndjson");

function mapComplianceTags(event) {
  const tags = [];

  if (event.operation === "tokenize") {
    tags.push("CR-001");
  }

  if (event.operation === "updateStatus" || event.operation === "verifyStatus") {
    tags.push("CR-005");
  }

  if (event.status === "FALLBACK") {
    tags.push("CR-004");
  }

  return tags;
}

function ensureAuditStore() {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
}

function writeAuditEvent(event) {
  ensureAuditStore();

  const record = {
    eventTime: event.eventTime || new Date().toISOString(),
    actor: event.actor || "backend-gateway",
    operation: event.operation,
    status: event.status,
    correlationId: event.correlationId,
    txReference: event.txReference || null,
    fallbackReason: event.fallbackReason || null,
    complianceTags: mapComplianceTags(event),
  };

  fs.appendFileSync(AUDIT_FILE, JSON.stringify(record) + "\n", "utf8");
  return record;
}

function readAllAuditEvents() {
  if (!fs.existsSync(AUDIT_FILE)) {
    return [];
  }

  return fs
    .readFileSync(AUDIT_FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

module.exports = {
  writeAuditEvent,
  readAllAuditEvents,
  AUDIT_FILE,
};
