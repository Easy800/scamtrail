"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");
const { loadTaxonomy } = require(path.join(__dirname, "..", "..", "taxonomy"));
const {
  loadOpenApi,
  listPathKeys,
  listTagNames,
} = require("../src/lib/load-openapi");

const ROOT = path.join(__dirname, "..", "..", "..");

function readDoc(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

describe("remaining M0 artifacts", () => {
  it("loads shipped taxonomy enums including report_type", () => {
    const tax = loadTaxonomy();
    assert.equal(tax.version, "2026-08-24.v1");
    for (const value of [
      "loss",
      "interaction_no_payment",
      "observation",
      "public_research",
    ]) {
      assert.ok(tax.report_type.includes(value), value);
    }
    assert.ok(tax.indicator_type.includes("phone_hmac"));
    assert.ok(tax.match_method.includes("hmac_exact"));
  });

  it("parses the shipped OpenAPI draft with four auth-domain tags and §22 paths", () => {
    const doc = loadOpenApi();
    const tags = listTagNames(doc);
    for (const tag of [
      "public-read",
      "submitter-write",
      "internal-review",
      "disclosure",
    ]) {
      assert.ok(tags.includes(tag), tag);
    }
    const paths = listPathKeys(doc);
    for (const p of [
      "/public/cases",
      "/public/cases/{id}",
      "/reports",
      "/reports/{id}/submit",
      "/claims/{claimId}/disputes",
      "/internal/intake",
      "/internal/decisions",
      "/internal/collective-cases",
      "/internal/recipients/verify",
      "/internal/disclosure-packages/{id}/mark-disclosed",
    ]) {
      assert.ok(paths.includes(p), p);
    }
  });

  it("ships claim grades, editorial, dispute, disclosure, retention, and AT-29 names", () => {
    const grades = readDoc("docs/methodology/claim-evidence-grades.md");
    for (const status of [
      "UNVERIFIED",
      "VERIFIED",
      "DISPUTED",
      "RETRACTED",
      "INVALIDATED",
    ]) {
      assert.ok(grades.includes(status), status);
    }
    const editorial = readDoc("docs/governance/editorial-policy.md");
    assert.match(editorial, /Review and Publish/);
    assert.match(editorial, /Publish 人工/);
    const dispute = readDoc("docs/governance/dispute-policy.md");
    assert.match(dispute, /Claims/);
    assert.match(dispute, /IDENTITY_MISATTRIBUTION/);
    const disclosure = readDoc("docs/governance/collective-case-disclosure.md");
    assert.match(disclosure, /never send data to police/);
    assert.match(disclosure, /警方无后台/);
    const retention = readDoc("docs/privacy/retention-deletion.md");
    assert.match(retention, /Tombstone/);
    const outline = readDoc("docs/methodology/mvp-acceptance-tests.md");
    for (const id of ["AT-29.1", "AT-29.2", "AT-29.3", "AT-29.4", "AT-29.5"]) {
      assert.ok(outline.includes(id), id);
    }
  });
});
