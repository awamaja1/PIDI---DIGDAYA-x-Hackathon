const express = require("express");

const healthRouter = require("./health");
const tokensRouter = require("./tokens");
const auditRouter = require("./audit");

const router = express.Router();

router.use("/", healthRouter);
router.use("/tokens", tokensRouter);
router.use("/audit", auditRouter);

module.exports = router;
