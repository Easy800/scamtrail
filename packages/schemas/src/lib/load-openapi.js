"use strict";

const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

const OPENAPI_PATH = path.join(__dirname, "..", "..", "openapi", "openapi.yaml");

function loadOpenApi() {
  return YAML.parse(fs.readFileSync(OPENAPI_PATH, "utf8"));
}

function listPathKeys(doc) {
  return Object.keys(doc.paths || {});
}

function listTagNames(doc) {
  return (doc.tags || []).map((tag) => tag.name);
}

module.exports = { OPENAPI_PATH, loadOpenApi, listPathKeys, listTagNames };
