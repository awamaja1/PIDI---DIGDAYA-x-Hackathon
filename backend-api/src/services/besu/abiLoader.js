const fs = require("fs");
const path = require("path");

const { AppError } = require("../../common/appError");

function readAbiFile(abiFilePath) {
  const resolvedPath = path.resolve(process.cwd(), abiFilePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new AppError(500, "ABI_FILE_NOT_FOUND", "File ABI contract tidak ditemukan", {
      abiFilePath,
      resolvedPath,
    });
  }

  const raw = fs.readFileSync(resolvedPath, "utf-8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new AppError(500, "ABI_JSON_INVALID", "Format JSON ABI tidak valid", {
      abiFilePath,
      reason: error.message,
    });
  }

  const abi = Array.isArray(parsed) ? parsed : parsed.abi;
  if (!Array.isArray(abi) || abi.length === 0) {
    throw new AppError(500, "ABI_CONTENT_INVALID", "Konten ABI harus berupa array non-kosong", {
      abiFilePath,
    });
  }

  return {
    abi,
    resolvedPath,
  };
}

module.exports = {
  readAbiFile,
};
