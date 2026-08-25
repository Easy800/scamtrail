# M0 verification audit (ST-PLAN-001 §8.5)

| Item | Value |
|---|---|
| Date | 2026-08-24 |
| Goal | M0 exit + verification audit |
| Spec | ST-DEV-001 v0.10, ST-PLAN-001 v1.0 |
| Capture dir | `/var/folders/z_/76yfpz1n36z7v6nr1b8vz6lh0000gp/T/grok-goal-a56841d089c1/implementer` |

Entry points driven (not reimplemented in the audit):

- `packages/schemas/src/lib/validate.js` (`validatePublicSnapshot`, `loadSection34Examples`)
- `packages/schemas/src/cli/migrate.js`
- `packages/schemas/src/cli/scan-victim-files.js`
- `npm test` (same command as `.github/workflows/test.yml`)

## §8.5 results

### 数据词典与 Schema 能解释 §34 的示例 JSON/YAML

**PASS**

- Dictionary: `docs/data-dictionary.md` maps Case / Campaign / Claim / Decision / Evidence Receipt / Report to §20 and §34.
- Schemas: `packages/schemas/json/public-case.schema.json`, `public-campaign.schema.json`, `public-claim.schema.json`, `public-decision.schema.json`, `evidence-receipt.schema.json`, `report.schema.json`.
- Shipped tests load §34 YAML from `living_scam_intelligence_mvp_dev_spec_zh.md` and call `validatePublicSnapshot`. A poisoned Case (`victim_name`, `full_card_number`, `email`, `phone`, `storage_key`) is rejected by that same function.

Capture: `/var/folders/z_/76yfpz1n36z7v6nr1b8vz6lh0000gp/T/grok-goal-a56841d089c1/implementer/schema-tests.log`

Observed (two consecutive `npm test` runs):

```
ℹ tests 12
ℹ pass 12
ℹ fail 0
ℹ tests 12
ℹ pass 12
ℹ fail 0
```

### 威胁模型有“投稿隔离、Publish 人工、P2 单人、警方无后台”四条对应控制

**PASS**

Artifact: `docs/governance/threat-model.md` control IDs TM-1…TM-4, each labeled with the Chinese name and the English name from the goal.

`CONTRIBUTING.md` contains: “Do not upload ID documents, chats, or payment screenshots to GitHub” and “禁止在 GitHub 上传身份证、聊天记录或付款截图。”

Captures:

- `/var/folders/z_/76yfpz1n36z7v6nr1b8vz6lh0000gp/T/grok-goal-a56841d089c1/implementer/threat-model-controls.log` (all six phrase checks PASS)
- `/var/folders/z_/76yfpz1n36z7v6nr1b8vz6lh0000gp/T/grok-goal-a56841d089c1/implementer/schema-tests.log` (`M0 governance artifacts` tests)

### 空数据库可迁移；CI 绿

**PASS** (validate-only for Postgres)

- Shipped checker parses `packages/schemas/sql/001_first_wave.sql` and requires relations: `users, reports, payments, consents, evidence_objects, evidence_derivatives, evidence_metadata, audit_events`.
- Two `migrate.js validate` runs printed `MIGRATE_VALIDATE_OK` and `MIGRATE_RUN1_EXIT:0` / `MIGRATE_RUN2_EXIT:0`.
- `migrate.js apply` recorded `Postgres launcher: DATABASE_URL unset; Postgres apply skipped`. Intended engine remains PostgreSQL; no fake apply success.

Capture: `/var/folders/z_/76yfpz1n36z7v6nr1b8vz6lh0000gp/T/grok-goal-a56841d089c1/implementer/migrate.log`

CI (same steps as `.github/workflows/test.yml`): two full `npm test && npm run migrate:validate && npm run scan-victim-files` runs, `CI_RUN1_EXIT:0` and `CI_RUN2_EXIT:0`, each with `pass 12` / `fail 0`.

Capture: `/var/folders/z_/76yfpz1n36z7v6nr1b8vz6lh0000gp/T/grok-goal-a56841d089c1/implementer/ci.log`

### 没有真实受害者文件出现在仓库或对象存储

**PASS**

- Shipped `scanVictimFiles` reported `SCAN_OK no victim evidence blobs found` twice (`SCAN_RUN1_EXIT:0`, `SCAN_RUN2_EXIT:0`).
- No `media/`, `evidence/`, `vault/`, or `uploads/` directories.
- No png/jpg/pdf/webp blobs outside `node_modules`.
- No `media/` PAN scan (directory absent).
- Object storage is not provisioned in M0; no vault bucket is attached.

Capture: `/var/folders/z_/76yfpz1n36z7v6nr1b8vz6lh0000gp/T/grok-goal-a56841d089c1/implementer/no-victim-files.log`

## Gaps

None for §8.5. Name clearance, legal review, and M1–M4 product work remain out of this goal (ST-PLAN-001 non-goals).
