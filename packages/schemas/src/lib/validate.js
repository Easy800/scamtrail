"use strict";

const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const YAML = require("yaml");
const {
  FORBIDDEN_PUBLIC_FIELDS,
  findForbiddenPublicFields,
} = require("./forbidden-public-fields");

const JSON_DIR = path.join(__dirname, "..", "..", "json");

const KIND_SCHEMA = {
  case: "public-case.schema.json",
  campaign: "public-campaign.schema.json",
  claim: "public-claim.schema.json",
  decision: "public-decision.schema.json",
  report: "report.schema.json",
  "evidence-receipt": "evidence-receipt.schema.json",
};

const PUBLIC_KINDS = new Set([
  "case",
  "campaign",
  "claim",
  "decision",
  "evidence-receipt",
]);

function readSchemaFile(fileName) {
  return JSON.parse(fs.readFileSync(path.join(JSON_DIR, fileName), "utf8"));
}

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, nested) => {
      if (nested instanceof Date) return nested.toISOString();
      return nested;
    })
  );
}

function loadDocument(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (filePath.endsWith(".json")) return JSON.parse(raw);
  return jsonSafe(YAML.parse(raw));
}

function unwrapClaim(data) {
  if (
    data &&
    typeof data === "object" &&
    data.claim &&
    typeof data.claim === "object" &&
    data.id === undefined
  ) {
    return data.claim;
  }
  return data;
}

let ajvSingleton;

function getAjv() {
  if (!ajvSingleton) {
    ajvSingleton = new Ajv({ allErrors: true, strict: true });
    addFormats(ajvSingleton);
    for (const fileName of Object.values(KIND_SCHEMA)) {
      ajvSingleton.addSchema(readSchemaFile(fileName), fileName);
    }
  }
  return ajvSingleton;
}

function validateNamedSchema(kind, data) {
  const schemaId = KIND_SCHEMA[kind];
  if (!schemaId) {
    return { ok: false, errors: [`unknown kind: ${kind}`] };
  }
  const payload = kind === "claim" ? unwrapClaim(data) : data;
  const errors = [];
  if (PUBLIC_KINDS.has(kind)) {
    errors.push(...findForbiddenPublicFields(payload));
  }
  const validate = getAjv().getSchema(schemaId);
  const valid = validate(payload);
  if (!valid) {
    for (const err of validate.errors || []) {
      errors.push(`${err.instancePath || "/"} ${err.message}`);
    }
  }
  return { ok: errors.length === 0, errors, kind };
}

function validatePublicSnapshot(kind, data) {
  return validateNamedSchema(kind, data);
}

function loadSection34Examples(specMarkdown) {
  const start = specMarkdown.indexOf("## 34.");
  if (start < 0) {
    throw new Error("ST-DEV-001 §34 heading not found");
  }
  const endMarker = specMarkdown.indexOf("\n## 35.", start);
  const slice =
    endMarker < 0 ? specMarkdown.slice(start) : specMarkdown.slice(start, endMarker);
  const blocks = [];
  const fence = /```yaml\n([\s\S]*?)```/g;
  let match;
  while ((match = fence.exec(slice))) {
    blocks.push(match[1]);
  }
  if (blocks.length < 3) {
    throw new Error(`expected ≥3 yaml fences in §34, found ${blocks.length}`);
  }
  return {
    case: jsonSafe(YAML.parse(blocks[0])),
    campaign: jsonSafe(YAML.parse(blocks[1])),
    claim: jsonSafe(YAML.parse(blocks[2])),
  };
}

module.exports = {
  KIND_SCHEMA,
  FORBIDDEN_PUBLIC_FIELDS,
  JSON_DIR,
  loadDocument,
  loadSection34Examples,
  validateNamedSchema,
  validatePublicSnapshot,
  unwrapClaim,
};
