-- SmartPay5 replaces SmartPay3 for membership settlement. The new contract
-- binds entitlement to PayerID, keeps the funding wallet as audit data, and
-- supports fee-on-transfer tokens without recipient balance-delta checks.
ALTER TABLE crypto_payment_settings ADD COLUMN smartpay5_contract TEXT;
ALTER TABLE crypto_payment_settings ADD COLUMN smartpay5_usdt_percent INTEGER NOT NULL DEFAULT 50
  CHECK(smartpay5_usdt_percent BETWEEN 0 AND 100);
UPDATE crypto_payment_settings
SET smartpay5_usdt_percent=smartpay3_usdt_percent;
-- Retired SmartPay3 columns remain as inert historical schema because this
-- repository uses additive migrations.

ALTER TABLE smartpay3_payment_claims RENAME TO smartpay5_payment_claims;
ALTER TABLE smartpay5_payment_claims ADD COLUMN payer_id TEXT;
UPDATE smartpay5_payment_claims SET payer_id=upper(ref_id)
WHERE payer_id IS NULL OR trim(payer_id)='';
DROP INDEX IF EXISTS greatlovemeta_smartpay3_claims_user_idx;
DROP INDEX IF EXISTS greatlovemeta_smartpay3_claims_ref_id_idx;
CREATE INDEX IF NOT EXISTS greatlovemeta_smartpay5_claims_user_idx
  ON smartpay5_payment_claims(user_id,verified_at DESC);
CREATE INDEX IF NOT EXISTS greatlovemeta_smartpay5_claims_payer_id_idx
  ON smartpay5_payment_claims(payer_id,verified_at DESC);
CREATE INDEX IF NOT EXISTS greatlovemeta_smartpay5_claims_ref_id_idx
  ON smartpay5_payment_claims(ref_id,verified_at DESC);

CREATE TABLE IF NOT EXISTS account_request_limits (
  scope TEXT NOT NULL,
  actor_key TEXT NOT NULL,
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  blocked_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(scope,actor_key)
);
CREATE INDEX IF NOT EXISTS greatlovemeta_account_request_limits_updated_idx
  ON account_request_limits(updated_at);

PRAGMA optimize;
