# Claim 证据等级规范

Source: ST-DEV-001 §14. Who may change a status: Reviewer proposes; Publish / `OWNER_PRIVACY` records a Decision. AI never sets a public status.

Statuses are not a numeric reputation score and must not be summed into a real-world identity.

| Status | When | Who may set |
|---|---|---|
| `UNVERIFIED` | Statement only, no intake evidence | system on create |
| `REPORTED` | First-party report recorded | Reviewer |
| `SUPPORTED` | Some original material exists | Reviewer |
| `CORROBORATED` | Independent evidence agrees | Reviewer |
| `VERIFIED` | Current evidence chain is strong | Publish Decision |
| `DISPUTED` | Formal counter-evidence or dispute | system on dispute open |
| `UNDER_REVIEW` | Active re-check | Reviewer / Owner |
| `MODIFIED` | Scope or wording changed | Publish Decision |
| `RETRACTED` | Current evidence no longer supports the claim | Publish Decision |
| `SUPERSEDED` | Replaced by a new Claim | Publish Decision |
| `MERGED` | Combined with another Claim | Publish Decision |
| `DUPLICATE` | Duplicate record | Reviewer |
| `INVALIDATED` | Evidence shown irrelevant or bogus | Publish Decision |

`claim_evidence` relations: `SUPPORTS`, `CONTRADICTS`, `CONTEXTUALIZES`, `SUPERSEDES`, `DUPLICATES`.

Identity claims default unpublished. A retracted identity claim does not retract “a scam occurred” or “this account was used”.
