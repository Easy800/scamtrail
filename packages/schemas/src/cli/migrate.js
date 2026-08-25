"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  validateFirstWaveSql,
  FIRST_WAVE_TABLES,
} = require("../lib/parse-sql");

const SQL_PATH = path.join(
  __dirname,
  "..",
  "..",
  "sql",
  "001_first_wave.sql"
);

function loadSql() {
  return fs.readFileSync(SQL_PATH, "utf8");
}

function tryApplyPostgres(sql) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return {
      ok: false,
      skipped: true,
      error: "DATABASE_URL unset; Postgres apply skipped",
    };
  }
  const psql = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-c", sql], {
    encoding: "utf8",
  });
  if (psql.error) {
    return { ok: false, skipped: true, error: String(psql.error) };
  }
  if (psql.status !== 0) {
    return {
      ok: false,
      skipped: false,
      error: psql.stderr || psql.stdout || `psql exit ${psql.status}`,
    };
  }
  return { ok: true, skipped: false, stdout: psql.stdout };
}

function run(mode = "validate") {
  const sql = loadSql();
  const parsed = validateFirstWaveSql(sql);
  const result = {
    mode,
    sql_path: SQL_PATH,
    ...parsed,
    apply: null,
  };
  if (!parsed.ok) {
    return { exitCode: 1, result };
  }
  if (mode === "apply") {
    result.apply = tryApplyPostgres(sql);
    if (!result.apply.ok) {
      result.postgres_unavailable = true;
    }
  }
  return { exitCode: 0, result };
}

function main() {
  const mode = process.argv[2] || "validate";
  if (mode !== "validate" && mode !== "apply") {
    console.error("usage: migrate.js [validate|apply]");
    process.exit(2);
  }
  const { exitCode, result } = run(mode);
  console.log(JSON.stringify(result, null, 2));
  console.log(`relations: ${FIRST_WAVE_TABLES.join(", ")}`);
  if (result.ok) {
    console.log("MIGRATE_VALIDATE_OK");
  }
  if (result.apply && result.apply.skipped) {
    console.error(`Postgres launcher: ${result.apply.error}`);
  }
  process.exit(exitCode);
}

if (require.main === module) {
  main();
}

module.exports = { run, SQL_PATH, loadSql };
