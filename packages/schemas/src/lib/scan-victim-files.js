"use strict";

const fs = require("fs");
const path = require("path");

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".postgres-data",
  "vault-local",
]);

const EVIDENCE_DIR_NAMES = new Set(["media", "evidence", "vault", "uploads"]);
const BINARY_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".pdf",
  ".zip",
  ".docx",
  ".xlsx",
  ".mp4",
  ".mov",
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function scanVictimFiles(rootDir) {
  const findings = [];
  const files = walk(rootDir);
  for (const filePath of files) {
    const rel = path.relative(rootDir, filePath);
    const parts = rel.split(path.sep);
    const ext = path.extname(filePath).toLowerCase();
    const inEvidenceDir = parts.some((part) => EVIDENCE_DIR_NAMES.has(part));
    if (inEvidenceDir && BINARY_EXT.has(ext)) {
      findings.push({ file: rel, reason: "binary_in_evidence_dir" });
      continue;
    }
    if (inEvidenceDir && ext === ".png") {
      findings.push({ file: rel, reason: "image_in_evidence_dir" });
    }
  }
  return {
    ok: findings.length === 0,
    scanned_files: files.length,
    findings,
    message:
      findings.length === 0
        ? "SCAN_OK no victim evidence blobs found"
        : `SCAN_FAIL ${findings.length} suspect file(s)`,
  };
}

module.exports = { scanVictimFiles, EVIDENCE_DIR_NAMES, BINARY_EXT };
