"use strict";

const crypto = require("crypto");
const { randomUUID } = require("crypto");
const { validatePublicSnapshot } = require("../../schemas/src/lib/validate");
const {
  findForbiddenPublicFields,
} = require("../../schemas/src/lib/forbidden-public-fields");

function sha256Hex(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function createHashReceipt({ bytes, mimeType, receivedAt, privacyClass }) {
  if (!Buffer.isBuffer(bytes) && typeof bytes !== "string") {
    const err = new Error("bytes required");
    err.code = "RECEIPT_BYTES";
    throw err;
  }
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const receipt = {
    id: `E-${randomUUID()}`,
    sha256: sha256Hex(buf),
    size_bytes: buf.length,
    received_at: receivedAt || new Date().toISOString(),
    mime_type: mimeType || "application/octet-stream",
    privacy_class: privacyClass || "P2",
  };
  const forbidden = findForbiddenPublicFields(receipt);
  if (forbidden.length) {
    const err = new Error(forbidden.join("; "));
    err.code = "RECEIPT_PUBLIC_LEAK";
    throw err;
  }
  if (Object.prototype.hasOwnProperty.call(receipt, "storage_key")) {
    const err = new Error("receipt must not include storage_key");
    err.code = "RECEIPT_PUBLIC_LEAK";
    throw err;
  }
  const checked = validatePublicSnapshot("evidence-receipt", receipt);
  if (!checked.ok) {
    const err = new Error(checked.errors.join("; "));
    err.code = "RECEIPT_SCHEMA";
    throw err;
  }
  return receipt;
}

module.exports = { createHashReceipt, sha256Hex };
