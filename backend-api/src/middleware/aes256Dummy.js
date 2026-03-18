const crypto = require("crypto");
const { AppError } = require("../common/appError");

function getAesKeyBuffer() {
  const keyHex = process.env.AES256_KEY_HEX;

  if (keyHex && /^[0-9a-fA-F]{64}$/.test(keyHex)) {
    return Buffer.from(keyHex, "hex");
  }

  // Fallback deterministik untuk PoC lokal jika env key belum diisi.
  return crypto.createHash("sha256").update("GARUDA-LINK-POC-DUMMY-KEY").digest();
}

function encryptPayload(payload) {
  const iv = crypto.randomBytes(16);
  const key = getAesKeyBuffer();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  const plaintext = JSON.stringify(payload ?? {});
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return {
    algorithm: "AES-256-CBC",
    iv: iv.toString("hex"),
    ciphertext: encrypted.toString("hex"),
  };
}

function aes256DummyMiddleware(req, res, next) {
  try {
    req.encryptedPayload = encryptPayload(req.body);
    return next();
  } catch (error) {
    return next(
      new AppError(500, "AES256_DUMMY_ENCRYPTION_FAILED", "Gagal mengenkripsi payload")
    );
  }
}

module.exports = {
  aes256DummyMiddleware,
};
