# Data dictionary (M0)

Source of truth for column meaning: ST-DEV-001 §10, §20, §34.  
Machine-readable companions: `packages/schemas/json/` and `packages/schemas/sql/001_first_wave.sql`.

Privacy: **P0** public after review; **P1** restricted; **P2** owner-only.

## First-wave tables

### users

| Column | Type | Class | Public | Notes |
|---|---|---|---|---|
| id | uuid | P0 | internal id | |
| role | text | P0 | no | visitor / submitter / reviewer / owner_privacy |
| status | text | P0 | no | |
| email_ciphertext | text | P1/P2 | no | encrypted |
| email_match_hmac | text | P1 | no | HMAC, not raw email |
| created_at | timestamptz | P0 | no | |
| last_login_at | timestamptz | P1 | no | |
| mfa_enabled | boolean | P0 | no | required true for owner_privacy |

### reports

| Column | Type | Class | Public | Notes |
|---|---|---|---|---|
| id | uuid | P0 | no (report itself is not a public page) | |
| submitter_id | uuid | P1 | no | |
| report_type | text | P0 | derived into Case | loss / interaction_no_payment / observation / public_research |
| status | text | P0 | no | starts at quarantined after submit |
| country_code | text | P0 | yes, on Case | |
| region_generalized | text | P0 | maybe coarsened | |
| incident_started_at | timestamptz | P0 | Case.incident.started_at | |
| incident_ended_at | timestamptz | P0 | Case.incident.ended_at | |
| narrative_private | text | P1 | **never** | |
| submitted_at | timestamptz | P0 | no | system time |
| source_channel | text | P0 | no | |
| duplicate_of_report_id | uuid | P0 | no | |

### payments

| Column | Type | Class | Public | Notes |
|---|---|---|---|---|
| id | uuid | P0 | no | |
| report_id | uuid | P0 | no | |
| sequence | int | P0 | Case path | |
| occurred_at | timestamptz | P0 | coarsened date | |
| currency | text | P0 | Case.loss.currency | |
| amount_declared | numeric | P0 | Case.loss.declared | |
| amount_supported | numeric | P0 | Case.loss.supported | |
| method | text | P0 | Case.payment_methods | |
| claimed_reason | text | P0/P1 | summary | |
| recipient_indicator_id | uuid | P0/P1 | Indicator, not account number | |
| evidence_status | text | P0 | | |

### consents

| Column | Type | Class | Public | Notes |
|---|---|---|---|---|
| policy_version | text | P0 | no | see `consent-keys.json` |
| purpose | text | P0 | no | versioned key, e.g. `collective_case.redacted_evidence` |
| granted | boolean | P0 | no | |
| granted_at / revoked_at | timestamptz | P0 | no | |

### evidence_objects / evidence_derivatives / evidence_metadata

Originals and derivatives. `storage_key` is **never** on a public snapshot. Public Evidence Receipt may include `id`, `sha256`, `size_bytes`, `received_at` only.

### audit_events

Append-only. `integrity_hash` chains the row. Logs must not store raw P1/P2 values.

## Public snapshot objects (ST-DEV-001 §34)

These are **views**, not first-wave tables. JSON Schema in `packages/schemas/json/public-*.schema.json`.

| Snapshot | §34 example | Maps from |
|---|---|---|
| Case | `id: CASE-2026-000127` | cases + payments + claims (P0 fields only) |
| Campaign | `id: CAMPAIGN-00042` | campaigns aggregate; `first_observed_at` = Trail first seen |
| Claim | wrapped `claim:` | claims + claim_evidence; no `private_statement` |
| Decision | `DEC-2027-0048` referenced by the Claim | decisions.public_reason only |
| Evidence Receipt | `E-OLD-01` referenced by Claim evidence ids | evidence_objects minus storage_key |
| Report | not public | reports intake shape |

Forbidden keys on any public snapshot: see `forbidden-public-fields.json` (`victim_name`, `full_card_number`, `email`, `phone`, `storage_key`, …).
