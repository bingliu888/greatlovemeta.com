-- SmartPay3 adds contract-owned payment rules and RefID-bound settlement.
-- Existing direct-transfer claims and subscriptions remain intact as history.
ALTER TABLE crypto_payment_settings ADD COLUMN smartpay3_contract TEXT;
ALTER TABLE crypto_payment_settings ADD COLUMN smartpay3_usdt_percent INTEGER NOT NULL DEFAULT 50
  CHECK(smartpay3_usdt_percent BETWEEN 0 AND 100);

CREATE TABLE IF NOT EXISTS smartpay3_payment_claims (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setting_id TEXT NOT NULL REFERENCES crypto_payment_settings(id),
  contract_address TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  payer_wallet TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  main_id TEXT NOT NULL,
  second_id TEXT NOT NULL,
  plan_id TEXT NOT NULL CHECK(plan_id IN ('monthly','annual')),
  primary_token_symbol TEXT NOT NULL,
  primary_token_address TEXT NOT NULL,
  primary_atomic_amount TEXT NOT NULL,
  secondary_token_symbol TEXT,
  secondary_token_address TEXT,
  secondary_atomic_amount TEXT,
  entitlement_status TEXT NOT NULL DEFAULT 'synced' CHECK(entitlement_status IN ('pending_sync','synced','rejected')),
  current_period_ends_at INTEGER,
  created_at INTEGER NOT NULL,
  verified_at INTEGER NOT NULL,
  UNIQUE(contract_address,transaction_id)
);
CREATE INDEX IF NOT EXISTS greatlovemeta_smartpay3_claims_user_idx
  ON smartpay3_payment_claims(user_id,verified_at DESC);
CREATE INDEX IF NOT EXISTS greatlovemeta_smartpay3_claims_ref_id_idx
  ON smartpay3_payment_claims(ref_id,verified_at DESC);

CREATE TABLE IF NOT EXISTS member_wallet_bindings (
  wallet TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  updated_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO member_wallet_bindings(wallet,user_id,updated_at)
SELECT lower(wallet_address),MIN(id),CAST(strftime('%s','now') AS INTEGER)
FROM users
WHERE wallet_address IS NOT NULL AND trim(wallet_address) <> ''
GROUP BY lower(wallet_address)
HAVING COUNT(*)=1;
CREATE INDEX IF NOT EXISTS greatlovemeta_users_wallet_normalized_idx
  ON users(lower(wallet_address))
  WHERE wallet_address IS NOT NULL AND trim(wallet_address) <> '';

CREATE TABLE IF NOT EXISTS smartpay_source_publications (
  id TEXT PRIMARY KEY NOT NULL,
  chain_id INTEGER NOT NULL CHECK(chain_id > 0),
  contract_address TEXT NOT NULL,
  deployment_tx_hash TEXT NOT NULL,
  compiler_version TEXT NOT NULL,
  source_code TEXT NOT NULL,
  standard_json_input TEXT NOT NULL,
  sourcify_verification_id TEXT,
  explorer_verification_id TEXT,
  published_by_admin_user_id TEXT NOT NULL REFERENCES users(id),
  published_at INTEGER NOT NULL,
  sourcify_message TEXT,
  explorer_message TEXT,
  explorer_verified INTEGER NOT NULL DEFAULT 0,
  verification_updated_at INTEGER,
  UNIQUE(chain_id,contract_address)
);
CREATE INDEX IF NOT EXISTS greatlovemeta_smartpay_publications_admin_idx
  ON smartpay_source_publications(published_by_admin_user_id,published_at DESC);

PRAGMA optimize;
