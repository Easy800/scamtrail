"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { seedIntakeFixtures } = require("../src/seed-fixtures");
const { createApp } = require("../src/app");
const { seedUserMap, OWNER_EMAIL, OWNER_PASSWORD } = require("../src/seed-users");
const { validatePublicSnapshot } = require("../../schemas/src/lib/validate");

describe("public-source gray fixtures", () => {
  it("quarantines regulator-inspired reports without victim PII keys", () => {
    const { reports, receipts, campaigns } = seedIntakeFixtures();
    assert.ok(reports.length >= 8);
    assert.ok(receipts.length === reports.length);
    assert.ok(campaigns.length >= 3);
    assert.ok(reports.some((row) => (row.indicators || []).join(" ").includes("echelonmark")));
    assert.ok(reports.some((row) => row.public_source.includes("dfpi.ca.gov")));
    assert.ok(reports.some((row) => row.public_source.includes("fbi.gov")));
    for (const row of reports) {
      assert.equal(row.status, "quarantined");
      const blob = JSON.stringify(row);
      assert.equal(/victim_name|full_card_number|"email":|"phone":|storage_key/.test(blob), false);
    }
    for (const rec of receipts) {
      assert.equal(Object.prototype.hasOwnProperty.call(rec, "storage_key"), false);
      assert.equal(validatePublicSnapshot("evidence-receipt", rec).ok, true);
    }
  });

  it("renders seeded trails on /app after login", () => {
    const app = createApp({ users: seedUserMap() });
    const loginRes = app.handle({
      method: "POST",
      url: "/login",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
    });
    const cookie = (loginRes.headers["set-cookie"] || "").split(";")[0];
    const page = app.handle({
      method: "GET",
      url: "/app",
      headers: { cookie },
    });
    assert.match(page.body, /关联痕迹/);
    assert.match(page.body, /RPT-SEED-0002/);
    assert.match(page.body, /dfpi\.ca\.gov/);
    assert.match(page.body, /假交易平台/);
  });
});
