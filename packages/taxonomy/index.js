"use strict";

const fs = require("fs");
const path = require("path");

const ENUMS_PATH = path.join(__dirname, "enums.json");

function loadTaxonomy() {
  return JSON.parse(fs.readFileSync(ENUMS_PATH, "utf8"));
}

module.exports = { loadTaxonomy, ENUMS_PATH };
