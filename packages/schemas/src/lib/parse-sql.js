"use strict";

const FIRST_WAVE_TABLES = [
  "users",
  "reports",
  "payments",
  "consents",
  "evidence_objects",
  "evidence_derivatives",
  "evidence_metadata",
  "audit_events",
];

const REQUIRED_COLUMNS = {
  users: [
    "id",
    "role",
    "status",
    "email_ciphertext",
    "email_match_hmac",
    "created_at",
    "last_login_at",
    "mfa_enabled",
  ],
  reports: [
    "id",
    "submitter_id",
    "report_type",
    "status",
    "country_code",
    "region_generalized",
    "incident_started_at",
    "incident_ended_at",
    "narrative_private",
    "submitted_at",
    "source_channel",
    "duplicate_of_report_id",
  ],
  payments: [
    "id",
    "report_id",
    "sequence",
    "occurred_at",
    "currency",
    "amount_declared",
    "amount_supported",
    "method",
    "claimed_reason",
    "recipient_indicator_id",
    "evidence_status",
  ],
  consents: [
    "id",
    "user_id",
    "report_id",
    "policy_version",
    "purpose",
    "granted",
    "granted_at",
    "revoked_at",
  ],
  evidence_objects: [
    "id",
    "report_id",
    "storage_key",
    "sha256",
    "size_bytes",
    "mime_type",
    "privacy_class",
    "submitted_at",
    "ingested_at",
    "hashed_at",
    "malware_status",
    "retention_status",
    "deleted_at",
  ],
  evidence_derivatives: [
    "id",
    "source_evidence_id",
    "operation",
    "tool_version",
    "storage_key",
    "sha256",
    "privacy_class",
    "created_at",
  ],
  evidence_metadata: [
    "id",
    "evidence_id",
    "key",
    "value_ciphertext_or_json",
    "source_type",
    "confidence_note",
    "privacy_class",
  ],
  audit_events: [
    "id",
    "actor_id",
    "action",
    "target_type",
    "target_id",
    "reason_code",
    "metadata_json",
    "created_at",
    "integrity_hash",
  ],
};

function parseCreateTables(sql) {
  const tables = {};
  const re =
    /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)\s*;/gi;
  let match;
  while ((match = re.exec(sql))) {
    const name = match[1].toLowerCase();
    const columns = [];
    for (const line of match[2].split("\n")) {
      const trimmed = line.trim().replace(/,$/, "");
      if (!trimmed || trimmed.startsWith("--")) continue;
      if (
        /^(PRIMARY KEY|UNIQUE|CHECK|CONSTRAINT|FOREIGN KEY)/i.test(trimmed)
      ) {
        continue;
      }
      const column = trimmed.split(/\s+/)[0].replace(/"/g, "").toLowerCase();
      if (column) columns.push(column);
    }
    tables[name] = columns;
  }
  return tables;
}

function validateFirstWaveSql(sql) {
  const tables = parseCreateTables(sql);
  const errors = [];
  const found = Object.keys(tables);
  for (const name of FIRST_WAVE_TABLES) {
    if (!tables[name]) {
      errors.push(`missing relation ${name}`);
      continue;
    }
    for (const column of REQUIRED_COLUMNS[name]) {
      if (!tables[name].includes(column)) {
        errors.push(`relation ${name} missing column ${column}`);
      }
    }
  }
  return {
    ok: errors.length === 0,
    engine: "postgresql",
    relations: found,
    required_relations: FIRST_WAVE_TABLES.slice(),
    tables,
    errors,
  };
}

module.exports = {
  FIRST_WAVE_TABLES,
  REQUIRED_COLUMNS,
  parseCreateTables,
  validateFirstWaveSql,
};
