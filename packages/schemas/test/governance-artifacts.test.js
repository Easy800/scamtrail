"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");

const ROOT = path.join(__dirname, "..", "..", "..");

describe("M0 governance artifacts", () => {
  it("names the four threat-model controls in the shipped threat-model file", () => {
    const text = fs.readFileSync(
      path.join(ROOT, "docs/governance/threat-model.md"),
      "utf8"
    );
    assert.match(text, /投稿隔离 \(intake quarantine\)/);
    assert.match(text, /Publish 人工 \(human-only Publish\)/);
    assert.match(text, /P2 单人 \(P2-only owner\)/);
    assert.match(text, /警方无后台 \(no police backend\)/);
  });

  it("uses 诈迹 · ScamTrail and Every scam leaves a trail on the README", () => {
    const text = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
    assert.match(text, /诈迹 · ScamTrail/);
    assert.match(text, /Every scam leaves a trail/);
  });

  it("forbids ID, chat, and payment uploads in CONTRIBUTING.md", () => {
    const text = fs.readFileSync(path.join(ROOT, "CONTRIBUTING.md"), "utf8");
    assert.match(text, /身份证/);
    assert.match(text, /聊天/);
    assert.match(text, /付款截图/);
    assert.match(
      text,
      /Do not upload ID documents, chats, or payment screenshots to GitHub/
    );
  });
});
