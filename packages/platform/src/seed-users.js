"use strict";

const { randomUUID } = require("crypto");
const { hashPassword } = require("./auth");

const OWNER_EMAIL = "owner@scamtrail.local";
const REVIEWER_EMAIL = "reviewer@scamtrail.local";
const OWNER_PASSWORD = process.env.SCAMTRAIL_OWNER_PASSWORD || "gray-owner-change-me";
const REVIEWER_PASSWORD =
  process.env.SCAMTRAIL_REVIEWER_PASSWORD || "gray-reviewer-change-me";

function seedUserMap() {
  const users = new Map();
  users.set(OWNER_EMAIL, {
    id: randomUUID(),
    email: OWNER_EMAIL,
    role: "owner_privacy",
    password_hash: hashPassword(OWNER_PASSWORD),
  });
  users.set(REVIEWER_EMAIL, {
    id: randomUUID(),
    email: REVIEWER_EMAIL,
    role: "reviewer",
    password_hash: hashPassword(REVIEWER_PASSWORD),
  });
  return users;
}

module.exports = {
  seedUserMap,
  OWNER_EMAIL,
  REVIEWER_EMAIL,
  OWNER_PASSWORD,
  REVIEWER_PASSWORD,
};
