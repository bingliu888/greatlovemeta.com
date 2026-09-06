import { getDatabase } from "./auth";
import { smartPay5PaymentItemStateSets, smartPay5PresetFingerprint, type SmartPay5ConfirmablePreset, type SmartPay5PaymentItemStateRow } from "./smartpay5-confirmation-control";

const paymentDatabase = () => getDatabase();

export async function smartPay5PaymentItemDatabaseState(chainId: number, presets: readonly SmartPay5ConfirmablePreset[]) {
  const result = await paymentDatabase().prepare(`SELECT preset_key AS presetKey, preset_fingerprint AS presetFingerprint, enabled FROM smartpay5_payment_item_states WHERE chain_id=?`).bind(chainId).run<SmartPay5PaymentItemStateRow>();
  return smartPay5PaymentItemStateSets(presets, result.results || []);
}
export async function writeSmartPay5PaymentItemState(input: { chainId: number; preset: SmartPay5ConfirmablePreset; adminId: string | number; enabled: boolean }) {
  const now = Math.floor(Date.now() / 1000);
  await paymentDatabase().prepare(`INSERT INTO smartpay5_payment_item_states
    (chain_id,preset_key,preset_fingerprint,enabled,updated_by_admin_id,confirmed_at,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(chain_id,preset_key) DO UPDATE SET
      preset_fingerprint=excluded.preset_fingerprint,enabled=excluded.enabled,
      updated_by_admin_id=excluded.updated_by_admin_id,confirmed_at=excluded.confirmed_at,updated_at=excluded.updated_at`)
    .bind(input.chainId, input.preset.key, smartPay5PresetFingerprint(input.preset), input.enabled ? 1 : 0, String(input.adminId), input.enabled ? now : null, now, now).run();
}
