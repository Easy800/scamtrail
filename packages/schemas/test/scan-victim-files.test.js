"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { describe, it } = require("node:test");
const { scanVictimFiles } = require("../src/lib/scan-victim-files");

const ROOT = path.join(__dirname, "..", "..", "..");

describe("victim-evidence scanner", () => {
  it("finds no evidence blobs in the repository root", () => {
    const result = scanVictimFiles(ROOT);
    assert.equal(result.ok, true, JSON.stringify(result.findings, null, 2));
    assert.match(result.message, /SCAN_OK/);
  });
});
