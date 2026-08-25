# Consent keys (policy_version `2026-08-24.v1`)

Machine-readable copy: `packages/schemas/json/consent-keys.json`.

Each grant is one `consents` row (`purpose`, `granted`, `policy_version`). Users may change grants before disclosure. Completed lawful disclosure cannot be recalled from the recipient; the submit form must say so.

| purpose | Default | Meaning |
|---|---|---|
| internal_verification | true | Staff may use the report to verify |
| public_sanitized_case | true | P0 fields may appear on a Case page |
| cross_case_matching | true | Identifiers may generate match candidates |
| aggregate_statistics | true | Counts and amounts in Campaign stats |
| collective_case.anonymous_count_and_amount | true | Anonymous inclusion in a jurisdiction package |
| collective_case.redacted_evidence | false | Redacted attachments in a package |
| collective_case.contact_me_if_escalated | true | Re-contact if a Collective Case is considered |
| collective_case.identity_and_contact_disclosure | false | Identity to a verified recipient |
| research_recontact | false | Later research contact |

Identity and full evidence are off by default.
