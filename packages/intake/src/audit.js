"use strict";

const crypto = require("crypto");
const { randomUUID } = require("crypto");
const { canReadP2 } = require("./roles");

function integrityHash(previousHash, payload) {
  return crypto
    .createHash("sha256")
    .update(`${previousHash || ""}:${JSON.stringify(payload)}`)
    .digest("hex");
}

function createAuditLog() {
  const events = [];
  return {
    append(event) {
      const previous = events.length
        ? events[events.length - 1].integrity_hash
        : "";
      const body = {
        actor_id: event.actor_id || null,
        actor_role: event.actor_role,
        action: event.action,
        target_type: event.target_type,
        target_id: event.target_id,
        reason_code: event.reason_code || null,
      };
      const row = Object.freeze({
        id: randomUUID(),
        ...body,
        created_at: new Date().toISOString(),
        integrity_hash: integrityHash(previous, body),
      });
      events.push(row);
      return row;
    },
    replace() {
      const err = new Error("audit log is append-only");
      err.code = "AUDIT_APPEND_ONLY";
      throw err;
    },
    list() {
      return events.slice();
    },
  };
}

function readP2({ log, role, purposeCode, evidenceId, actorId }) {
  if (!purposeCode) {
    const err = new Error("purpose_code required for P1/P2 read");
    err.code = "PURPOSE_REQUIRED";
    throw err;
  }
  if (!canReadP2(role)) {
    const err = new Error("P2_FORBIDDEN");
    err.code = "P2_FORBIDDEN";
    throw err;
  }
  log.append({
    actor_id: actorId || null,
    actor_role: role,
    action: "p2_read",
    target_type: "evidence",
    target_id: evidenceId,
    reason_code: purposeCode,
  });
  return { allowed: true, view: "original" };
}

function reviewerPreview({ role, payload }) {
  if (role === "owner_privacy") {
    return payload;
  }
  const { storage_key: _omit, ...rest } = payload;
  return {
    ...rest,
    preview: "redacted",
    storage_key: undefined,
  };
}

module.exports = {
  createAuditLog,
  readP2,
  reviewerPreview,
  integrityHash,
};
