"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { describe, it } = require("node:test");
const { main } = require("../src/cli/validate-snapshot");

const ROOT = path.join(__dirname, "..", "..", "..");
const POISONED = path.join(
  __dirname,
  "..",
  "fixtures",
  "poisoned-public-case.yaml"
);

function captureMain(args) {
  const chunks = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (msg) => {
    chunks.push(String(msg));
  };
  console.error = (msg) => {
    chunks.push(String(msg));
  };
  let code;
  try {
    code = main(args);
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  const stdout = chunks.join("\n");
  const jsonStart = stdout.indexOf("{");
  const parsed =
    jsonStart >= 0 ? JSON.parse(stdout.slice(jsonStart)) : null;
  return { code, stdout, parsed };
}

describe("shipped validate-snapshot CLI", () => {
  it("accepts ST-DEV-001 §34 Case, Campaign, and Claim via --from-spec", () => {
    for (const kind of ["case", "campaign", "claim"]) {
      const { code, parsed } = captureMain([kind, "--from-spec"]);
      assert.equal(code, 0, kind);
      assert.equal(parsed.ok, true, `${kind}: ${JSON.stringify(parsed)}`);
    }
  });

  it("rejects the poisoned public Case snapshot with ok false", () => {
    const { code, parsed } = captureMain(["case", POISONED]);
    assert.notEqual(code, 0);
    assert.equal(parsed.ok, false);
    const joined = (parsed.errors || []).join("\n");
    assert.match(joined, /victim_name/);
    assert.match(joined, /storage_key/);
  });

  it("resolves the spec from the repo root", () => {
    assert.ok(
      require("fs").existsSync(
        path.join(ROOT, "living_scam_intelligence_mvp_dev_spec_zh.md")
      )
    );
  });
});
