"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { describe, it } = require("node:test");
const {
  ROLES,
  canReadP2,
  canReviewIntake,
  rolesGrantedByGithubOauth,
  githubOauthGrantsReviewOrP2,
  loadConsentCatalog,
  defaultGrants,
  assertConsentBundle,
  submitReport,
  createHashReceipt,
  sha256Hex,
  createAuditLog,
  readP2,
  reviewerPreview,
  classifySyntheticPaymentScreenshot,
} = require("../src");
const { validatePublicSnapshot } = require("../../schemas/src/lib/validate");

describe("M1 roles", () => {
  it("treats OWNER_PRIVACY as the only P2 reader", () => {
    assert.equal(canReadP2("owner_privacy"), true);
    assert.equal(canReadP2("reviewer"), false);
    assert.equal(canReadP2("submitter"), false);
    assert.equal(canReadP2("visitor"), false);
    assert.ok(ROLES.includes("owner_privacy"));
  });

  it("does not grant reviewer or P2 from GitHub OAuth", () => {
    assert.deepEqual([...rolesGrantedByGithubOauth()], ["submitter"]);
    assert.equal(githubOauthGrantsReviewOrP2(), false);
    assert.equal(canReviewIntake("reviewer"), true);
    assert.equal(canReviewIntake("submitter"), false);
  });
});

describe("M1 versioned consent", () => {
  it("binds grants to the shipped policy_version", () => {
    const catalog = loadConsentCatalog();
    const bundle = defaultGrants();
    assert.equal(bundle.policy_version, catalog.policy_version);
    const ok = assertConsentBundle(bundle);
    assert.equal(ok.policy_version, "2026-08-24.v1");
    assert.equal(
      ok.grants["collective_case.identity_and_contact_disclosure"],
      false
    );
  });

  it("rejects a mismatched policy_version", () => {
    const bundle = defaultGrants();
    bundle.policy_version = "not-a-real-policy";
    assert.throws(() => assertConsentBundle(bundle), /policy_version/);
  });
});

describe("M1 quarantine submit", () => {
  it("moves draft reports to quarantined and never published", () => {
    const submitted = submitReport({
      report: { id: "RPT-SYNTH-1", report_type: "loss", status: "draft" },
      consents: defaultGrants(),
    });
    assert.equal(submitted.status, "quarantined");
    assert.ok(submitted.submitted_at);
    assert.notEqual(submitted.status, "published");
  });
});

describe("M1 hash receipt", () => {
  it("hashes bytes and validates as a public receipt without storage_key", () => {
    const bytes = Buffer.from("synthetic payment screenshot fixture");
    const receipt = createHashReceipt({
      bytes,
      mimeType: "image/png",
      privacyClass: "P2",
    });
    assert.equal(receipt.sha256, sha256Hex(bytes));
    assert.equal(receipt.sha256, crypto.createHash("sha256").update(bytes).digest("hex"));
    assert.equal(receipt.size_bytes, bytes.length);
    assert.equal(Object.prototype.hasOwnProperty.call(receipt, "storage_key"), false);
    const checked = validatePublicSnapshot("evidence-receipt", receipt);
    assert.equal(checked.ok, true, checked.errors && checked.errors.join("; "));
  });
});

describe("M1 append-only P2 audit", () => {
  it("records a P2 read for owner_privacy and forbids reviewer", () => {
    const log = createAuditLog();
    const allowed = readP2({
      log,
      role: "owner_privacy",
      purposeCode: "internal_verification",
      evidenceId: "E-SYNTH-1",
      actorId: "owner-1",
    });
    assert.equal(allowed.allowed, true);
    assert.equal(log.list().length, 1);
    assert.equal(log.list()[0].action, "p2_read");
    assert.throws(
      () =>
        readP2({
          log,
          role: "reviewer",
          purposeCode: "internal_verification",
          evidenceId: "E-SYNTH-1",
        }),
      /P2_FORBIDDEN/
    );
    assert.throws(() => log.replace(), /append-only/);
    const preview = reviewerPreview({
      role: "reviewer",
      payload: { id: "E-SYNTH-1", storage_key: "s3://vault/secret" },
    });
    assert.equal(preview.storage_key, undefined);
    assert.equal(preview.preview, "redacted");
  });
});

describe("M1 §29.1 synthetic fixture", () => {
  it("classifies a named+PAN screenshot as P2 and keeps those keys off public snapshots", () => {
    const classified = classifySyntheticPaymentScreenshot({
      containsVictimName: true,
      containsFullCard: true,
      amount: 52,
      date: "2026-07-03",
      method: "card",
    });
    assert.equal(classified.privacy_class, "P2");
    const poisoned = {
      id: "CASE-2026-000127",
      title: "synthetic",
      status: "active_knowledge",
      incident: { country: "US", started_at: "2026-07-03" },
      loss: { currency: "USD", declared: 52, supported: 52 },
      entry_channel: "social_bot",
      communication_channels: ["telegram"],
      payment_methods: ["card"],
      public_claims: [],
      last_knowledge_update_at: "2026-08-24T06:20:00Z",
      victim_name: "synthetic",
      full_card_number: "XXXX-TEST-CARD",
      storage_key: "s3://vault/synthetic",
    };
    const result = validatePublicSnapshot("case", poisoned);
    assert.equal(result.ok, false);
    const joined = result.errors.join("\n");
    assert.match(joined, /victim_name/);
    assert.match(joined, /full_card_number/);
    assert.match(joined, /storage_key/);
  });
});
