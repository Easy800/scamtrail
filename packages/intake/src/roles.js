"use strict";

const ROLES = Object.freeze([
  "visitor",
  "submitter",
  "reviewer",
  "owner_privacy",
]);

function assertRole(role) {
  if (!ROLES.includes(role)) {
    const err = new Error(`unknown role: ${role}`);
    err.code = "UNKNOWN_ROLE";
    throw err;
  }
  return role;
}

function canReadP2(role) {
  return assertRole(role) === "owner_privacy";
}

function canReviewIntake(role) {
  const r = assertRole(role);
  return r === "reviewer" || r === "owner_privacy";
}

function rolesGrantedByGithubOauth() {
  return Object.freeze(["submitter"]);
}

function githubOauthGrantsReviewOrP2() {
  const granted = rolesGrantedByGithubOauth();
  return (
    granted.includes("reviewer") || granted.includes("owner_privacy")
  );
}

module.exports = {
  ROLES,
  assertRole,
  canReadP2,
  canReviewIntake,
  rolesGrantedByGithubOauth,
  githubOauthGrantsReviewOrP2,
};
