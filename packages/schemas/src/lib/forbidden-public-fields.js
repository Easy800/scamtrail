"use strict";

const fs = require("fs");
const path = require("path");

const LIST_PATH = path.join(__dirname, "..", "..", "json", "forbidden-public-fields.json");

function loadForbiddenPublicFields() {
  const parsed = JSON.parse(fs.readFileSync(LIST_PATH, "utf8"));
  return parsed.fields;
}

const FORBIDDEN_PUBLIC_FIELDS = loadForbiddenPublicFields();

function findForbiddenPublicFields(value, fieldPath = "$") {
  const errors = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      errors.push(...findForbiddenPublicFields(item, `${fieldPath}[${index}]`));
    });
    return errors;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${fieldPath}.${key}`;
      if (FORBIDDEN_PUBLIC_FIELDS.includes(key)) {
        errors.push(`forbidden public field ${childPath}`);
      }
      errors.push(...findForbiddenPublicFields(child, childPath));
    }
  }
  return errors;
}

module.exports = {
  FORBIDDEN_PUBLIC_FIELDS,
  findForbiddenPublicFields,
  loadForbiddenPublicFields,
};
