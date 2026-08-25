-- ScamTrail first-wave empty schema (ST-DEV-001 §20, ST-PLAN-001 M1/M0).
-- Engine: PostgreSQL. Apply with: node packages/schemas/src/cli/migrate.js apply
-- No victim payloads. Ciphertext columns stay empty until M1.

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('visitor', 'submitter', 'reviewer', 'owner_privacy')),
  status text NOT NULL CHECK (status IN ('active', 'disabled', 'pending')),
  email_ciphertext text,
  email_match_hmac text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  mfa_enabled boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY,
  submitter_id uuid REFERENCES users (id),
  report_type text NOT NULL CHECK (report_type IN (
    'loss', 'interaction_no_payment', 'observation', 'public_research'
  )),
  status text NOT NULL CHECK (status IN (
    'draft', 'submitted', 'quarantined', 'triage', 'needs_information',
    'structured', 'partially_verified', 'verified', 'published',
    'not_published', 'withdrawn'
  )),
  country_code text,
  region_generalized text,
  incident_started_at timestamptz,
  incident_ended_at timestamptz,
  narrative_private text,
  submitted_at timestamptz,
  source_channel text,
  duplicate_of_report_id uuid REFERENCES reports (id)
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES reports (id),
  sequence integer NOT NULL,
  occurred_at timestamptz,
  currency text,
  amount_declared numeric,
  amount_supported numeric,
  method text,
  claimed_reason text,
  recipient_indicator_id uuid,
  evidence_status text
);

CREATE TABLE IF NOT EXISTS consents (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users (id),
  report_id uuid REFERENCES reports (id),
  policy_version text NOT NULL,
  purpose text NOT NULL,
  granted boolean NOT NULL,
  granted_at timestamptz,
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS evidence_objects (
  id uuid PRIMARY KEY,
  report_id uuid REFERENCES reports (id),
  storage_key text NOT NULL,
  sha256 text NOT NULL,
  size_bytes bigint NOT NULL,
  mime_type text,
  privacy_class text NOT NULL CHECK (privacy_class IN ('P0', 'P1', 'P2')),
  submitted_at timestamptz NOT NULL,
  ingested_at timestamptz,
  hashed_at timestamptz,
  malware_status text,
  retention_status text,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS evidence_derivatives (
  id uuid PRIMARY KEY,
  source_evidence_id uuid NOT NULL REFERENCES evidence_objects (id),
  operation text NOT NULL,
  tool_version text,
  storage_key text NOT NULL,
  sha256 text,
  privacy_class text NOT NULL CHECK (privacy_class IN ('P0', 'P1', 'P2')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence_metadata (
  id uuid PRIMARY KEY,
  evidence_id uuid NOT NULL REFERENCES evidence_objects (id),
  key text NOT NULL,
  value_ciphertext_or_json text,
  source_type text,
  confidence_note text,
  privacy_class text NOT NULL CHECK (privacy_class IN ('P0', 'P1', 'P2'))
);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  reason_code text,
  metadata_json text,
  created_at timestamptz NOT NULL DEFAULT now(),
  integrity_hash text NOT NULL
);
