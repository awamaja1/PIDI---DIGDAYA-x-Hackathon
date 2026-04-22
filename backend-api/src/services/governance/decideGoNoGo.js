function decideGoNoGo(items) {
  const hasCriticalFail = items.some((item) => item.severity === "CRITICAL" && item.status === "fail");
  if (hasCriticalFail) {
    return "NO_GO";
  }

  const hasAnyFail = items.some((item) => item.status === "fail");
  const hasAnyWarn = items.some((item) => item.status === "warn");
  if (hasAnyFail || hasAnyWarn) {
    return "CONDITIONAL_GO";
  }

  return "GO";
}

module.exports = {
  decideGoNoGo,
};