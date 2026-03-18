const express = require("express");
const { aes256DummyMiddleware } = require("../../middleware/aes256Dummy");
const { AppError } = require("../../common/appError");
const { buildSuccessResponse } = require("../../common/responseSchema");

const router = express.Router();

router.post("/transfer", aes256DummyMiddleware, (req, res, next) => {
  try {
    const amount = Number(req.body?.amount);
    const beneficiaryAccount = req.body?.beneficiaryAccount;

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError(400, "INVALID_AMOUNT", "amount harus berupa angka positif");
    }

    if (typeof beneficiaryAccount !== "string" || beneficiaryAccount.trim().length < 5) {
      throw new AppError(400, "INVALID_BENEFICIARY_ACCOUNT", "beneficiaryAccount tidak valid");
    }

    const now = new Date();
    const transferId = `TRX-${now.getTime()}`;

    return res.status(200).json(
      buildSuccessResponse({
        correlationId: req.correlationId,
        message: "Pencairan dana berhasil",
        data: {
          transferId,
          status: "SUCCESS",
          amount,
          beneficiaryAccount,
          disbursedAt: now.toISOString(),
          encryption: {
            algorithm: req.encryptedPayload.algorithm,
            iv: req.encryptedPayload.iv,
            ciphertextPreview: `${req.encryptedPayload.ciphertext.slice(0, 32)}...`,
          },
        },
      })
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
