"use strict";

const crypto = require("crypto");
const { assertRole } = require("../../intake/src/roles");

const SCRYPT = { N: 4096, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

function hashPassword(password, salt = crypto.randomBytes(16)) {
  const hash = crypto.scryptSync(password, salt, 32, SCRYPT);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string" || !stored.includes(":")) {
    return false;
  }
  const [saltHex, hashHex] = stored.split(":");
  const candidate = crypto.scryptSync(
    password,
    Buffer.from(saltHex, "hex"),
    32,
    SCRYPT
  );
  const expected = Buffer.from(hashHex, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: assertRole(user.role),
  };
}

function issueSession(user, store) {
  const token = crypto.randomBytes(32).toString("hex");
  const session = {
    token,
    user: publicUser(user),
    created_at: new Date().toISOString(),
  };
  store.set(token, session);
  return session;
}

function lookupSession(token, store) {
  if (!token) return null;
  return store.get(token) || null;
}

function login({ email, password, users, sessions }) {
  const key = String(email || "").trim().toLowerCase();
  const user = users.get(key);
  if (!user || !verifyPassword(String(password || ""), user.password_hash)) {
    const err = new Error("INVALID_CREDENTIALS");
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }
  const session = issueSession(user, sessions);
  return { session, user: publicUser(user) };
}

module.exports = {
  hashPassword,
  verifyPassword,
  publicUser,
  issueSession,
  lookupSession,
  login,
};
