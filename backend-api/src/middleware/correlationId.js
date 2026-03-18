const crypto = require("crypto");

function generateCorrelationId() {
  return `GARUDA-${crypto.randomUUID()}`;
}

function correlationIdMiddleware(req, res, next) {
  const incoming = req.header("X-Correlation-ID");
  const correlationId = incoming && incoming.trim() ? incoming.trim() : generateCorrelationId();

  req.correlationId = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);

  next();
}

module.exports = {
  correlationIdMiddleware,
};
