"use strict";

const { assertConsentBundle } = require("./consent");
const { loadTaxonomy } = require("../../taxonomy");

const TERMINAL_PUBLIC = new Set(["published"]);

function submitReport({ report, consents }) {
  if (!report || typeof report !== "object") {
    const err = new Error("report required");
    err.code = "REPORT_MISSING";
    throw err;
  }
  const tax = loadTaxonomy();
  if (!tax.report_type.includes(report.report_type)) {
    const err = new Error(`invalid report_type: ${report.report_type}`);
    err.code = "REPORT_TYPE";
    throw err;
  }
  const prior = report.status || "draft";
  if (prior !== "draft") {
    const err = new Error(`cannot submit from status ${prior}`);
    err.code = "REPORT_STATUS";
    throw err;
  }
  const bound = assertConsentBundle(consents);
  const submitted = {
    ...report,
    status: "quarantined",
    submitted_at: new Date().toISOString(),
    consents: bound,
  };
  if (TERMINAL_PUBLIC.has(submitted.status)) {
    const err = new Error("submit must not publish");
    err.code = "SUBMIT_MUST_QUARANTINE";
    throw err;
  }
  if (submitted.status !== "quarantined") {
    const err = new Error("submit must quarantine");
    err.code = "SUBMIT_MUST_QUARANTINE";
    throw err;
  }
  return submitted;
}

module.exports = { submitReport };
