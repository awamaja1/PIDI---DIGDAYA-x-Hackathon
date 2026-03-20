const { AppError } = require("../common/appError");

const REQUIRED_ENV_KEYS = [
  "BESU_RPC_URL",
  "BESU_PRIVATE_KEY",
  "BESU_TOKEN_CONTRACT_ADDRESS",
  "BESU_REGISTRY_CONTRACT_ADDRESS",
  "BESU_TOKEN_CONTRACT_ABI_PATH",
  "BESU_REGISTRY_CONTRACT_ABI_PATH",
];

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function loadBesuConfig(env = process.env) {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !env[key] || String(env[key]).trim().length === 0);
  if (missingKeys.length > 0) {
    throw new AppError(500, "BESU_CONFIG_INVALID", "Konfigurasi Besu belum lengkap", {
      missingKeys,
    });
  }

  return {
    rpcUrl: String(env.BESU_RPC_URL),
    privateKey: String(env.BESU_PRIVATE_KEY),
    chainId: parsePositiveInteger(env.BESU_CHAIN_ID, 1337),
    contracts: {
      tokenizationAddress: String(env.BESU_TOKEN_CONTRACT_ADDRESS),
      registryAddress: String(env.BESU_REGISTRY_CONTRACT_ADDRESS),
      tokenizationAbiPath: String(env.BESU_TOKEN_CONTRACT_ABI_PATH),
      registryAbiPath: String(env.BESU_REGISTRY_CONTRACT_ABI_PATH),
    },
    fallback: {
      timeoutMs: parsePositiveInteger(env.BESU_FALLBACK_TIMEOUT_MS, 2000),
      policy: String(env.BESU_FALLBACK_POLICY || "DETERMINISTIC").toUpperCase(),
    },
  };
}

module.exports = {
  loadBesuConfig,
};
