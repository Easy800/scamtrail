"use strict";

const roles = require("./roles");
const consent = require("./consent");
const { submitReport } = require("./submit");
const { createHashReceipt, sha256Hex } = require("./hash-receipt");
const audit = require("./audit");
const { classifySyntheticPaymentScreenshot } = require("./classify-pii");

module.exports = {
  ...roles,
  ...consent,
  submitReport,
  createHashReceipt,
  sha256Hex,
  ...audit,
  classifySyntheticPaymentScreenshot,
};
