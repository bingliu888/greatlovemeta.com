import { atomicTokenAmountToDisplay, tokenAmountToAtomic } from "./crypto-amount";
import type { CryptoPaymentSetting } from "./crypto-settings";
import { cryptoSubscriptionIdsForPlan, type CryptoSubscriptionPlan } from "./crypto-subscription";

const PLAN_ROWS: Array<{
  plan: CryptoSubscriptionPlan;
  months: 1 | 12;
  amount: "monthlyTokenAmount" | "annualTokenAmount";
}> = [
  { plan: "monthly", months: 1, amount: "monthlyTokenAmount" },
  { plan: "annual", months: 12, amount: "annualTokenAmount" }
];

export const SMARTPAY3_MINIMUM_GLC_DISPLAY = "1000000000";
export const SMARTPAY3_GLC_PER_USDT = 1_000_000n;
export const SMARTPAY3_DEFAULT_USDT_PERCENT = 50;
export const SMARTPAY3_NO_SECONDARY_TOKEN = "0x0000000000000000000000000000000000000000";

export type SmartPay3RulePreset = {
  key: string;
  mode: "dual" | "single";
  chainId: number;
  plan: CryptoSubscriptionPlan;
  months: 1 | 12;
  mainId: string;
  secondId: string;
  primarySettingId: string;
  primarySettingLabel: string;
  primaryTokenAddress: string;
  primaryTokenSymbol: string;
  primaryTokenDecimals: number;
  primaryTokenAmount: string;
  primaryTokenAmountAtomic: string;
  secondarySettingId: string;
  secondarySettingLabel: string;
  secondaryTokenAddress: string;
  secondaryTokenSymbol: string;
  secondaryTokenDecimals: number;
  secondaryTokenAmount: string;
  secondaryTokenAmountAtomic: string;
  minimumSecondaryBalance: string;
  minimumSecondaryBalanceAtomic: string;
  primaryPercent: number;
  secondaryPercent: number;
};

export type ComparableSmartPay3Rule = {
  primaryTokenAddress: string;
  secondaryTokenAddress: string;
  mainId: string;
  secondId: string;
  primaryTokenAmount: string;
  secondaryTokenAmount: string;
  minimumSecondaryBalance: string;
  enabled: boolean;
};

export function smartPay3ExpectedTokenPair(
  settings: readonly CryptoPaymentSetting[],
  primarySetting: CryptoPaymentSetting
) {
  if (primarySetting.tokenSymbol.toUpperCase() !== "USDT") {
    return {
      mode: "single" as const,
      secondarySetting: null,
      secondaryTokenAddress: SMARTPAY3_NO_SECONDARY_TOKEN
    };
  }
  const secondarySetting = settings.find(setting => setting.chainId === primarySetting.chainId
    && Boolean(setting.enabled) && setting.tokenSymbol.toUpperCase() === "GLC") || null;
  return secondarySetting ? {
    mode: "dual" as const,
    secondarySetting,
    secondaryTokenAddress: secondarySetting.tokenContract.toLowerCase()
  } : null;
}

export function smartPay3RulePresets(settings: readonly CryptoPaymentSetting[], chainId: number | undefined) {
  if (!chainId) return [] as SmartPay3RulePreset[];
  const active = settings.filter(setting => setting.chainId === chainId && Boolean(setting.enabled));
  const usdtSettings = active.filter(setting => setting.tokenSymbol.toUpperCase() === "USDT");
  const singleTokenSettings = active.filter(setting => setting.tokenSymbol.toUpperCase() !== "USDT");
  const glc = active.find(setting => setting.tokenSymbol.toUpperCase() === "GLC");
  const minimumSecondaryBalanceAtomic = glc
    ? tokenAmountToAtomic(SMARTPAY3_MINIMUM_GLC_DISPLAY, glc.tokenDecimals).toString()
    : "0";
  const dualPresets = glc ? usdtSettings.flatMap(usdt => PLAN_ROWS.map(row => {
    const fullPrimaryAtomic = tokenAmountToAtomic(usdt[row.amount], usdt.tokenDecimals);
    const primaryPercent = Number.isInteger(usdt.smartPay3UsdtPercent) ? usdt.smartPay3UsdtPercent : SMARTPAY3_DEFAULT_USDT_PERCENT;
    if (primaryPercent < 0 || primaryPercent > 100) throw new Error("SMARTPAY3_INVALID_USDT_PERCENT");
    const secondaryPercent = 100 - primaryPercent;
    const primaryAtomic = fullPrimaryAtomic;
    const numerator = fullPrimaryAtomic * SMARTPAY3_GLC_PER_USDT * (10n ** BigInt(glc.tokenDecimals));
    const denominator = 10n ** BigInt(usdt.tokenDecimals);
    if (numerator % denominator !== 0n) throw new Error("SMARTPAY3_SECONDARY_AMOUNT_NOT_EXACT");
    const secondaryAtomic = numerator / denominator;
    const ids = cryptoSubscriptionIdsForPlan(row.plan);
    return {
      key: `${usdt.id}:${glc.id}:${row.plan}`,
      mode: "dual",
      chainId,
      plan: row.plan,
      months: row.months,
      mainId: ids.mainId,
      secondId: ids.secondId,
      primarySettingId: usdt.id,
      primarySettingLabel: usdt.label,
      primaryTokenAddress: usdt.tokenContract,
      primaryTokenSymbol: usdt.tokenSymbol,
      primaryTokenDecimals: usdt.tokenDecimals,
      primaryTokenAmount: atomicTokenAmountToDisplay(primaryAtomic, usdt.tokenDecimals),
      primaryTokenAmountAtomic: primaryAtomic.toString(),
      secondarySettingId: glc.id,
      secondarySettingLabel: glc.label,
      secondaryTokenAddress: glc.tokenContract,
      secondaryTokenSymbol: glc.tokenSymbol,
      secondaryTokenDecimals: glc.tokenDecimals,
      secondaryTokenAmount: atomicTokenAmountToDisplay(secondaryAtomic, glc.tokenDecimals),
      secondaryTokenAmountAtomic: secondaryAtomic.toString(),
      minimumSecondaryBalance: SMARTPAY3_MINIMUM_GLC_DISPLAY,
      minimumSecondaryBalanceAtomic,
      primaryPercent,
      secondaryPercent
    } satisfies SmartPay3RulePreset;
  })) : [];
  const singlePresets = singleTokenSettings.flatMap(setting => PLAN_ROWS.map(row => {
    const primaryAtomic = tokenAmountToAtomic(setting[row.amount], setting.tokenDecimals);
    const ids = cryptoSubscriptionIdsForPlan(row.plan);
    return {
      key: `${setting.id}:single:${row.plan}`,
      mode: "single",
      chainId,
      plan: row.plan,
      months: row.months,
      mainId: ids.mainId,
      secondId: ids.secondId,
      primarySettingId: setting.id,
      primarySettingLabel: setting.label,
      primaryTokenAddress: setting.tokenContract,
      primaryTokenSymbol: setting.tokenSymbol,
      primaryTokenDecimals: setting.tokenDecimals,
      primaryTokenAmount: atomicTokenAmountToDisplay(primaryAtomic, setting.tokenDecimals),
      primaryTokenAmountAtomic: primaryAtomic.toString(),
      secondarySettingId: "",
      secondarySettingLabel: "",
      secondaryTokenAddress: SMARTPAY3_NO_SECONDARY_TOKEN,
      secondaryTokenSymbol: "",
      secondaryTokenDecimals: 0,
      secondaryTokenAmount: "0",
      secondaryTokenAmountAtomic: "0",
      minimumSecondaryBalance: "0",
      minimumSecondaryBalanceAtomic: "0",
      primaryPercent: 100,
      secondaryPercent: 0
    } satisfies SmartPay3RulePreset;
  }));
  return [...dualPresets, ...singlePresets];
}

export function smartPay3RulePresetStatus(preset: SmartPay3RulePreset, rules: readonly ComparableSmartPay3Rule[]) {
  const rule = rules.find(candidate => candidate.primaryTokenAddress.toLowerCase() === preset.primaryTokenAddress.toLowerCase()
    && candidate.secondaryTokenAddress.toLowerCase() === preset.secondaryTokenAddress.toLowerCase()
    && candidate.mainId === preset.mainId && candidate.secondId === preset.secondId) || null;
  if (!rule) return { state: "missing" as const, rule };
  const configured = rule.enabled
    && rule.primaryTokenAmount === preset.primaryTokenAmountAtomic
    && rule.secondaryTokenAmount === preset.secondaryTokenAmountAtomic
    && rule.minimumSecondaryBalance === preset.minimumSecondaryBalanceAtomic;
  return { state: configured ? "configured" as const : "different" as const, rule };
}
