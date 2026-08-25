"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");
const {
  loadDocument,
  loadSection34Examples,
  validateNamedSchema,
  validatePublicSnapshot,
} = require("../src/lib/validate");

const ROOT = path.join(__dirname, "..", "..", "..");
const SPEC = path.join(ROOT, "living_scam_intelligence_mvp_dev_spec_zh.md");
const FIXTURES = path.join(__dirname, "..", "fixtures");

describe("shipped public snapshot validator", () => {
  const examples = loadSection34Examples(fs.readFileSync(SPEC, "utf8"));

  it("accepts the ST-DEV-001 §34 Case snapshot", () => {
    const result = validatePublicSnapshot("case", examples.case);
    assert.equal(result.ok, true, result.errors.join("; "));
  });

  it("accepts the ST-DEV-001 §34 Campaign snapshot", () => {
    const result = validatePublicSnapshot("campaign", examples.campaign);
    assert.equal(result.ok, true, result.errors.join("; "));
  });

  it("accepts the ST-DEV-001 §34 Claim snapshot", () => {
    const result = validatePublicSnapshot("claim", examples.claim);
    assert.equal(result.ok, true, result.errors.join("; "));
  });

  it("accepts Decision, Evidence Receipt, and Report fixtures via the same validator", () => {
    const decision = validateNamedSchema(
      "decision",
      loadDocument(path.join(FIXTURES, "public-decision.yaml"))
    );
    const receipt = validateNamedSchema(
      "evidence-receipt",
      loadDocument(path.join(FIXTURES, "evidence-receipt.yaml"))
    );
    const report = validateNamedSchema(
      "report",
      loadDocument(path.join(FIXTURES, "report.yaml"))
    );
    assert.equal(decision.ok, true, decision.errors.join("; "));
    assert.equal(receipt.ok, true, receipt.errors.join("; "));
    assert.equal(report.ok, true, report.errors.join("; "));
  });

  it("rejects a public Case snapshot that injects P1/P2 fields", () => {
    const poisoned = loadDocument(
      path.join(FIXTURES, "poisoned-public-case.yaml")
    );
    const result = validatePublicSnapshot("case", poisoned);
    assert.equal(result.ok, false);
    const joined = result.errors.join("\n");
    assert.match(joined, /victim_name/);
    assert.match(joined, /full_card_number/);
    assert.match(joined, /email/);
    assert.match(joined, /phone/);
    assert.match(joined, /storage_key/);
  });
});
