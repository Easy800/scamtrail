# 诈迹 · ScamTrail

每个骗局，都会留下痕迹。  
Every scam leaves a trail.

This repository is the M0 baseline: schemas, first-wave SQL, privacy/consent keys, threat model, and validators. It is **not** an evidence drop box.

- Follow the trail. / 追踪诈迹。
- Public snapshots are P0 only. Raw evidence stays in a future Evidence Vault, never in `public-data/`.

## Develop

```bash
npm install
npm test
npm run migrate:validate
npm run scan-victim-files
npm run validate:snapshot -- case --from-spec
npm run validate:snapshot -- case packages/schemas/fixtures/poisoned-public-case.yaml
npm run login-launch
npm start
```

Gray login (CA): see `deploy/gray/README.md`. Local default: http://127.0.0.1:3000/login  
`owner@scamtrail.local` / `gray-owner-change-me`

`--from-spec` loads ST-DEV-001 §34. The poisoned Case must print `"ok": false`.

Postgres is the intended engine. If `DATABASE_URL` is unset or `psql` cannot start, `migrate:validate` still checks that `packages/schemas/sql/001_first_wave.sql` defines the required relations.

## Do not

Do not open Issues with ID documents, chats, or payment screenshots. See [CONTRIBUTING.md](CONTRIBUTING.md).
