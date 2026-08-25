"use strict";

const fs = require("fs");
const path = require("path");
const {
  loadDocument,
  loadSection34Examples,
  validatePublicSnapshot,
} = require("../lib/validate");

const SPEC_NAME = "living_scam_intelligence_mvp_dev_spec_zh.md";

function repoRootFromCli() {
  return path.join(__dirname, "..", "..", "..", "..");
}

function loadPayload(kind, sourceArg) {
  if (sourceArg === "--from-spec") {
    const specPath = path.join(repoRootFromCli(), SPEC_NAME);
    const examples = loadSection34Examples(fs.readFileSync(specPath, "utf8"));
    if (!examples[kind]) {
      throw new Error(`§34 has no example for kind ${kind}`);
    }
    return examples[kind];
  }
  const resolved = path.resolve(sourceArg);
  if (!fs.existsSync(resolved)) {
    throw new Error(`missing file ${resolved}`);
  }
  return loadDocument(resolved);
}

function main(argv = process.argv.slice(2)) {
  const kind = argv[0];
  const sourceArg = argv[1];
  if (!kind || !sourceArg) {
    console.error(
      "usage: validate-snapshot.js <kind> <file|--from-spec>"
    );
    return 2;
  }
  let data;
  try {
    data = loadPayload(kind, sourceArg);
  } catch (err) {
    console.error(String(err.message || err));
    return 2;
  }
  const result = validatePublicSnapshot(kind, data);
  console.log(JSON.stringify(result, null, 2));
  return result.ok ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { main, loadPayload };
