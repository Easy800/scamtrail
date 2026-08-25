# Threat model — 诈迹 · ScamTrail (M0)

| Item | Value |
|---|---|
| Version | 2026-08-24.v1 |
| Scope | M0–MVP controls. Not a pentest report. |
| Spec | ST-DEV-001 §2.3, §24, §31; ST-PLAN-001 §8 |

## Assets

- Evidence Vault (original files, P1/P2)
- HMAC pepper and vault keys
- Public Case / Campaign / Claim snapshots
- Submitter accounts and consent records
- Audit log integrity

## Adversaries

- Fraud rings submitting poisoned reports or malware files
- Impersonators of victims or of law-enforcement recipients
- GitHub contributors treating Issues as an evidence drop
- Insiders with Reviewer git access but no P2 role

## Four MVP controls (M0 exit)

These names are the control IDs. Implementation in later milestones must keep them.

### Control TM-1: 投稿隔离 (intake quarantine)

Every submitted report enters `QUARANTINED` before any public graph write. Unreviewed intake is not production knowledge. Batch accounts and duplicate files do not skip isolation.

### Control TM-2: Publish 人工 (human-only Publish)

Review and Publish are separate actions. AI and matchers emit candidates only. No automatic Claim publish, no automatic “same syndicate” statement, no automatic police send.

### Control TM-3: P2 单人 (P2-only owner)

P2 objects are reachable only by `OWNER_PRIVACY`. GitHub Maintainer is a different permission domain. Reviewer sessions cannot unwrap P2. Every P1/P2 read records an audit event with a purpose code.

### Control TM-4: 警方无后台 (no police backend)

Authorized Agency Recipients never log into Evidence Vault or the admin API. Disclosure is a one-shot minimized package after recipient verification. Thresholds create human review tasks, not outbound sends.

## Additional M0 threats

| Threat | Control |
|---|---|
| Fake reports / defamation | Atomic claims, high identity bar, dispute path (M4) |
| Malware in uploads | Isolated scan, safe preview, no raw open on reviewer laptops (M1) |
| PII leak via public-data | Field whitelist + forbidden public fields in the shipped validator |
| GitHub misuse | CONTRIBUTING.md forbids ID documents, chats, and payment screenshots |
| Law-enforcement impersonation | Independent official-channel verification before any package (M4) |
| HMAC brute force of phones | HMAC-SHA256 with secret pepper, not raw SHA-256 (M3) |
