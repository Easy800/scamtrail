# Privacy classification matrix

Canonical JSON: `packages/schemas/json/privacy-classification.json`.

Public snapshots must stay P0. The shipped validator rejects `victim_name`, `full_card_number`, `email`, `phone`, and `storage_key` on Case/Campaign/Claim/Decision/Evidence Receipt documents.

See ST-DEV-001 §10.2 for the full field table. M0 freezes the classes; M1 applies them at intake.
