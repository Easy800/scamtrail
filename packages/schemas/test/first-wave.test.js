"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");
const {
  FIRST_WAVE_TABLES,
  validateFirstWaveSql,
} = require("../src/lib/parse-sql");
const { run, SQL_PATH, loadSql } = require("../src/cli/migrate");

describe("first-wave schema checker", () => {
  it("loads the shipped SQL file and reports every required relation", () => {
    const sql = loadSql();
    assert.ok(sql.includes("CREATE TABLE"));
    const parsed = validateFirstWaveSql(sql);
    assert.equal(parsed.ok, true, parsed.errors.join("; "));
    for (const name of FIRST_WAVE_TABLES) {
      assert.ok(parsed.relations.includes(name), `missing ${name}`);
      assert.ok(
        parsed.required_relations.includes(name),
        `required list missing ${name}`
      );
    }
  });

  it("exposes validate/apply through the shipped migrate entry point", () => {
    const { exitCode, result } = run("validate");
    assert.equal(exitCode, 0);
    assert.equal(result.ok, true, (result.errors || []).join("; "));
    assert.equal(result.engine, "postgresql");
    assert.equal(path.basename(SQL_PATH), "001_first_wave.sql");
    assert.ok(fs.existsSync(SQL_PATH));
    for (const name of FIRST_WAVE_TABLES) {
      assert.ok(result.relations.includes(name), `entry point missing ${name}`);
    }
  });
});
