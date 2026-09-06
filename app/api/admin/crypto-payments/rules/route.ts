import { boundedJsonBody } from "../../../../../lib/bounded-request-body";
import { activeCryptoSettings } from "../../../../../lib/crypto-settings";
import { cryptoRpcUrl } from "../../../../../lib/crypto-rpc";
import { getDatabase } from "../../../../../lib/auth";
import { requirePermanentAdmin } from "../../../../../lib/smartpay-access";
import { smartPay5PresetFingerprint } from "../../../../../lib/smartpay5-confirmation-control";
import { smartPay5PaymentItemDatabaseState } from "../../../../../lib/smartpay5-confirmation-store";
import { smartPay5RulePresets, smartPay5RulePresetStatus } from "../../../../../lib/smartpay5-presets";
import { smartPay5PaymentRules } from "../../../../../lib/smartpay5-server";

export const dynamic = "force-dynamic";
const validChainId = (value: unknown) => Number.isInteger(Number(value)) && Number(value) > 0;

export async function GET(request: Request) {
  try {
    await requirePermanentAdmin();
    const chainId = Number(new URL(request.url).searchParams.get("chainId"));
    if (!validChainId(chainId)) return Response.json({ error: "Choose a valid chain" }, { status: 400 });
    const presets = smartPay5RulePresets(await activeCryptoSettings(), chainId);
    const state = await smartPay5PaymentItemDatabaseState(chainId, presets);
    return Response.json({ enabledPresetKeys: [...state.enabledPresetKeys], knownPresetKeys: [...state.knownPresetKeys], stalePresetKeys: [...state.stalePresetKeys] }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unable to read SmartPay confirmation state" }, { status: 500 });
  }
}
export async function PATCH(request: Request) {
  try {
    const admin = await requirePermanentAdmin();
    const input = await boundedJsonBody<{ chainId?: unknown; presetKey?: unknown; action?: unknown }>(request, 8_192);
    const chainId = Number(input.chainId);
    const presetKey = String(input.presetKey || "").trim();
    const action = String(input.action || "");
    if (!validChainId(chainId) || !presetKey || presetKey.length > 500 || !["stop", "confirm"].includes(action)) return Response.json({ error: "Invalid SmartPay confirmation request" }, { status: 400 });
    const settings = await activeCryptoSettings();
    const preset = smartPay5RulePresets(settings, chainId).find(candidate => candidate.key === presetKey);
    if (!preset) return Response.json({ error: "Payment item is unavailable" }, { status: 404 });
    if (action === "confirm") {
      const contractAddress = settings.find(setting => setting.id === preset.primarySettingId)?.smartPay5Contract;
      const rpcUrl = await cryptoRpcUrl(chainId);
      if (!contractAddress || !rpcUrl) return Response.json({ error: "SmartPay contract is unavailable" }, { status: 503 });
      const rules = await smartPay5PaymentRules(rpcUrl, contractAddress as `0x${string}`);
      if (smartPay5RulePresetStatus(preset, rules).state !== "configured") return Response.json({ error: "Current on-chain rule does not match this payment item" }, { status: 409 });
    }
    const now = Math.floor(Date.now() / 1_000);
    const enabled = action === "confirm";
    const db = getDatabase();
    await db.batch([
      db.prepare(`INSERT INTO smartpay5_payment_item_states
        (chain_id,preset_key,preset_fingerprint,enabled,updated_by_admin_id,confirmed_at,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?)
        ON CONFLICT(chain_id,preset_key) DO UPDATE SET
          preset_fingerprint=excluded.preset_fingerprint,enabled=excluded.enabled,
          updated_by_admin_id=excluded.updated_by_admin_id,confirmed_at=excluded.confirmed_at,updated_at=excluded.updated_at`)
        .bind(chainId, presetKey, smartPay5PresetFingerprint(preset), enabled ? 1 : 0, String(admin.id), enabled ? now : null, now, now),
      db.prepare(`INSERT INTO crypto_payment_admin_audit (id,admin_user_id,action,setting_id,created_at) VALUES (?,?,?,?,?)`).bind(crypto.randomUUID(), admin.id, `${enabled ? "confirm" : "stop"}_smartpay5_payment_item`, `${chainId}:${presetKey}`, now)
    ]);
    return Response.json(enabled ? { confirmed: true, selectable: true } : { stopped: true, selectable: false });
  } catch (error) {
    if (error instanceof Response) return error;
    console.warn("SmartPay confirmation state update failed", error instanceof Error ? error.message.slice(0, 160) : "unknown");
    return Response.json({ error: "Unable to update SmartPay confirmation state" }, { status: 500 });
  }
}
