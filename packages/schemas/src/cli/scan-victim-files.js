"use strict";

const path = require("path");
const { scanVictimFiles } = require("../lib/scan-victim-files");

function main() {
  const root = path.resolve(process.argv[2] || process.cwd());
  const result = scanVictimFiles(root);
  console.log(JSON.stringify(result, null, 2));
  console.log(result.message);
  process.exit(result.ok ? 0 : 1);
}

if (require.main === module) {
  main();
}
