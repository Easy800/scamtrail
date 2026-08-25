"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");

const JSON_DIR = path.join(__dirname, "..", "json");

describe("versioned consent keys and privacy classification", () => {
  it("ships consent keys with a policy_version", () => {
    const consent = JSON.parse(
      fs.readFileSync(path.join(JSON_DIR, "consent-keys.json"), "utf8")
    );
    assert.ok(consent.policy_version);
    const purposes = consent.keys.map((row) => row.purpose);
    for (const required of [
      "internal_verification",
      "public_sanitized_case",
      "cross_case_matching",
      "collective_case.identity_and_contact_disclosure",
    ]) {
      assert.ok(purposes.includes(required), required);
    }
  });

  it("classifies victim_name, phone, email, full_card_number as non-P0", () => {
    const matrix = JSON.parse(
      fs.readFileSync(path.join(JSON_DIR, "privacy-classification.json"), "utf8")
    );
    const byField = Object.fromEntries(
      matrix.fields.map((row) => [row.field, row])
    );
    for (const field of ["victim_name", "phone", "email", "full_card_number"]) {
      assert.ok(byField[field], field);
      assert.notEqual(byField[field].class, "P0");
      assert.match(byField[field].public, /Not public/i);
    }
  });
});
