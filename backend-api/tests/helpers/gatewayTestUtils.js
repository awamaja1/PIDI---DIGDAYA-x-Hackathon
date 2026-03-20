const fs = require("fs");
const path = require("path");
const http = require("http");

const { app } = require("../../src/app");
const { AUDIT_FILE } = require("../../src/services/audit/auditStore");

function applyBesuTestEnv(simulationMode = "success") {
  process.env.BESU_RPC_URL = "http://127.0.0.1:8545";
  process.env.BESU_CHAIN_ID = "1337";
  process.env.BESU_PRIVATE_KEY = "0xabc123";
  process.env.BESU_TOKEN_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000001";
  process.env.BESU_REGISTRY_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000002";
  process.env.BESU_TOKEN_CONTRACT_ABI_PATH = "./contracts/abi/GarudaLinkTokenization.json";
  process.env.BESU_REGISTRY_CONTRACT_ABI_PATH = "./contracts/abi/GarudaLinkRegistry.json";
  process.env.BESU_FALLBACK_TIMEOUT_MS = "2000";
  process.env.BESU_FALLBACK_POLICY = "DETERMINISTIC";
  process.env.BESU_SIMULATION_MODE = simulationMode;
}

function clearAuditArtifacts() {
  if (fs.existsSync(AUDIT_FILE)) {
    fs.unlinkSync(AUDIT_FILE);
  }

  const logDir = path.dirname(AUDIT_FILE);
  if (fs.existsSync(logDir) && fs.readdirSync(logDir).length === 0) {
    fs.rmdirSync(logDir);
  }
}

async function withServer(runTest) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await runTest(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

module.exports = {
  applyBesuTestEnv,
  clearAuditArtifacts,
  withServer,
  AUDIT_FILE,
};
