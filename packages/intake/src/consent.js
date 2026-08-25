"use strict";

const fs = require("fs");
const path = require("path");

const KEYS_PATH = path.join(
  __dirname,
  "..",
  "..",
  "schemas",
  "json",
  "consent-keys.json"
);

function loadConsentCatalog() {
  return JSON.parse(fs.readFileSync(KEYS_PATH, "utf8"));
}

function assertConsentBundle(bundle) {
  const catalog = loadConsentCatalog();
  if (!bundle || typeof bundle !== "object") {
    const err = new Error("consent bundle required");
    err.code = "CONSENT_MISSING";
    throw err;
  }
  if (bundle.policy_version !== catalog.policy_version) {
    const err = new Error(
      `consent policy_version must be ${catalog.policy_version}`
    );
    err.code = "CONSENT_VERSION";
    throw err;
  }
  const grants = bundle.grants || {};
  const byPurpose = Object.fromEntries(
    catalog.keys.map((row) => [row.purpose, row])
  );
  for (const purpose of Object.keys(grants)) {
    if (!byPurpose[purpose]) {
      const err = new Error(`unknown consent purpose: ${purpose}`);
      err.code = "CONSENT_UNKNOWN_PURPOSE";
      throw err;
    }
  }
  const identity =
    grants["collective_case.identity_and_contact_disclosure"];
  if (identity === true && grants.internal_verification !== true) {
    const err = new Error(
      "identity disclosure requires internal_verification"
    );
    err.code = "CONSENT_IDENTITY_REQUIRES_INTERNAL";
    throw err;
  }
  return {
    policy_version: bundle.policy_version,
    grants: { ...grants },
  };
}

function defaultGrants() {
  const catalog = loadConsentCatalog();
  const grants = {};
  for (const row of catalog.keys) {
    grants[row.purpose] = row.default;
  }
  return {
    policy_version: catalog.policy_version,
    grants,
  };
}

module.exports = {
  KEYS_PATH,
  loadConsentCatalog,
  assertConsentBundle,
  defaultGrants,
};
