"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { createApp } = require("../src/app");
const { login } = require("../src/auth");
const {
  seedUserMap,
  OWNER_EMAIL,
  OWNER_PASSWORD,
  REVIEWER_EMAIL,
  REVIEWER_PASSWORD,
} = require("../src/seed-users");

function cookieFrom(result) {
  const raw = result.headers["set-cookie"];
  return Array.isArray(raw) ? raw[0] : raw;
}

describe("shipped login and session", () => {
  it("logs in a representative owner and returns a signed-in /me body", () => {
    const users = seedUserMap();
    const app = createApp({ users });
    const loginRes = app.handle({
      method: "POST",
      url: "/login",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
    });
    assert.equal(loginRes.status, 200);
    const loginBody = JSON.parse(loginRes.body);
    assert.equal(loginBody.signed_in, true);
    assert.equal(loginBody.role, "owner_privacy");
    assert.equal(loginBody.email, OWNER_EMAIL);
    const me = app.handle({
      method: "GET",
      url: "/me",
      headers: { cookie: cookieFrom(loginRes), accept: "application/json" },
    });
    assert.equal(me.status, 200);
    const meBody = JSON.parse(me.body);
    assert.equal(meBody.signed_in, true);
    assert.equal(meBody.anonymous, false);
    assert.equal(meBody.user.role, "owner_privacy");
    assert.equal(meBody.email, OWNER_EMAIL);
  });

  it("keeps unauthenticated /me anonymous", () => {
    const app = createApp({ users: seedUserMap() });
    const me = app.handle({ method: "GET", url: "/me", headers: {} });
    const body = JSON.parse(me.body);
    assert.equal(me.status, 401);
    assert.equal(body.signed_in, false);
    assert.equal(body.anonymous, true);
  });
});

describe("authenticated intake after login", () => {
  it("submits into quarantine, issues a receipt without storage_key, audits P2 for owner, forbids reviewer", () => {
    const users = seedUserMap();
    const app = createApp({ users });
    const ownerLogin = app.handle({
      method: "POST",
      url: "/login",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
    });
    const ownerCookie = cookieFrom(ownerLogin);
    const submitted = app.handle({
      method: "POST",
      url: "/api/reports/submit",
      headers: {
        cookie: ownerCookie,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ report_type: "loss" }),
    });
    const submittedBody = JSON.parse(submitted.body);
    assert.equal(submitted.status, 202);
    assert.equal(submittedBody.report.status, "quarantined");
    assert.notEqual(submittedBody.report.status, "published");

    const receiptRes = app.handle({
      method: "POST",
      url: "/api/evidence/receipt",
      headers: {
        cookie: ownerCookie,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ bytes_utf8: "synthetic payment screenshot" }),
    });
    const receiptBody = JSON.parse(receiptRes.body);
    assert.equal(receiptRes.status, 200);
    assert.equal(
      Object.prototype.hasOwnProperty.call(receiptBody.receipt, "storage_key"),
      false
    );
    assert.match(receiptBody.receipt.sha256, /^[a-f0-9]{64}$/);

    const p2ok = app.handle({
      method: "POST",
      url: "/api/p2/read",
      headers: {
        cookie: ownerCookie,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        purpose_code: "internal_verification",
        evidence_id: receiptBody.receipt.id,
      }),
    });
    const p2okBody = JSON.parse(p2ok.body);
    assert.equal(p2ok.status, 200);
    assert.equal(p2okBody.allowed, true);
    assert.ok(p2okBody.audit_count >= 1);

    const reviewerLogin = app.handle({
      method: "POST",
      url: "/login",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        email: REVIEWER_EMAIL,
        password: REVIEWER_PASSWORD,
      }),
    });
    const p2deny = app.handle({
      method: "POST",
      url: "/api/p2/read",
      headers: {
        cookie: cookieFrom(reviewerLogin),
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        purpose_code: "internal_verification",
        evidence_id: receiptBody.receipt.id,
      }),
    });
    assert.equal(p2deny.status, 403);
    assert.equal(JSON.parse(p2deny.body).error, "P2_FORBIDDEN");
  });

  it("uses the shipped login() function, not a reimplementation", () => {
    const users = seedUserMap();
    const sessions = new Map();
    const result = login({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      users,
      sessions,
    });
    assert.equal(result.user.role, "owner_privacy");
    assert.ok(sessions.get(result.session.token));
  });
});
