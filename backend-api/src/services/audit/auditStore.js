const fs = require("fs");
const path = require("path");

const AUDIT_DIR = path.resolve(process.cwd(), "logs");
const AUDIT_FILE = path.join(AUDIT_DIR, "audit-events.ndjson");

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
  };

  fs.appendFileSync(AUDIT_FILE, JSON.stringify(record) + "\n", "utf8");
  return record;
}

module.exports = {
  writeAuditEvent,
  AUDIT_FILE,
};
