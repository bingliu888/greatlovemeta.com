import type { Address } from "viem";
import { atomicTokenAmountToDisplay } from "./crypto-amount";
import { cryptoRpcUrl } from "./crypto-rpc";
import { activeCryptoSettings, type CryptoPaymentSetting } from "./crypto-settings";
import { availableSmartPayCheckoutIdentity, configuredSmartPay5CheckoutScopes, type SmartPayCheckoutOption } from "./smartpay-checkout";
import type { CryptoSubscriptionPlan } from "./crypto-subscription";
import { smartPay5RulePresets, smartPay5RulePresetStatus } from "./smartpay5-presets";
import {
  smartPay5PaymentRules,
  smartPay5PayoutConfigurationRaw,
  verifySmartPay5Identity
} from "./smartpay5-server";

export async function currentSmartPayCheckoutOptions(inputSettings?: readonly CryptoPaymentSetting[]) {
  const settings = inputSettings ? [...inputSettings] : await activeCryptoSettings();
  const smartPay5Options = (await Promise.all(configuredSmartPay5CheckoutScopes(settings).map(async scope => {
    const rpcUrl = await cryptoRpcUrl(scope.chainId);
    if (!rpcUrl) return [] as SmartPayCheckoutOption[];
    const contractAddress = scope.contractAddress as Address;
    const identity = await availableSmartPayCheckoutIdentity(() => verifySmartPay5Identity(rpcUrl, contractAddress));
    if (!identity || identity.paused) return [] as SmartPayCheckoutOption[];
    const [payouts, rules] = await Promise.all([
      smartPay5PayoutConfigurationRaw(rpcUrl, contractAddress),
      smartPay5PaymentRules(rpcUrl, contractAddress)
    ]);
    if (!payouts.length) return [] as SmartPayCheckoutOption[];
    return smartPay5RulePresets(settings, scope.chainId).flatMap(preset => {
      const status = smartPay5RulePresetStatus(preset, rules);
      const rule = status.rule;
      if (!rule?.enabled || BigInt(rule.primaryTokenAmount) <= 0n) return [];
      const fullPrimaryAtomic = BigInt(rule.primaryTokenAmount);
      const fullSecondaryAtomic = BigInt(rule.secondaryTokenAmount);
      if (preset.mode === "dual" && fullSecondaryAtomic <= 0n) return [];
      if (preset.mode === "single" && fullSecondaryAtomic !== 0n) return [];
      const primaryNumerator = fullPrimaryAtomic * BigInt(preset.primaryPercent);
      const secondaryNumerator = fullSecondaryAtomic * BigInt(preset.secondaryPercent);
      if (primaryNumerator % 100n !== 0n || secondaryNumerator % 100n !== 0n) return [];
      const primaryAtomic = primaryNumerator / 100n;
      const secondaryAtomic = secondaryNumerator / 100n;
      const primarySetting = settings.find(candidate => candidate.id === preset.primarySettingId);
      const secondarySetting = preset.mode === "dual"
        ? settings.find(candidate => candidate.id === preset.secondarySettingId)
        : null;
      if (!primarySetting || (preset.mode === "dual" && !secondarySetting)) return [];
      const minConfirmations = secondarySetting
        ? Math.max(primarySetting.minConfirmations, secondarySetting.minConfirmations)
        : primarySetting.minConfirmations;
      const offer = {
        mode: preset.mode,
        contractAddress,
        primaryTokenAddress: preset.primaryTokenAddress,
        primaryTokenSymbol: preset.primaryTokenSymbol,
        primaryTokenDecimals: preset.primaryTokenDecimals,
        primaryTokenAmountAtomic: primaryAtomic.toString(),
        primaryTokenAmount: atomicTokenAmountToDisplay(primaryAtomic, preset.primaryTokenDecimals),
        primaryPercent: preset.primaryPercent,
        secondaryTokenAddress: preset.secondaryTokenAddress,
        secondaryTokenSymbol: preset.secondaryTokenSymbol,
        secondaryTokenDecimals: preset.secondaryTokenDecimals,
        secondaryTokenAmountAtomic: secondaryAtomic.toString(),
        secondaryTokenAmount: atomicTokenAmountToDisplay(secondaryAtomic, preset.secondaryTokenDecimals),
        secondaryPercent: preset.secondaryPercent,
        minimumSecondaryBalanceAtomic: rule.minimumSecondaryBalance,
        minimumSecondaryBalance: atomicTokenAmountToDisplay(BigInt(rule.minimumSecondaryBalance), preset.secondaryTokenDecimals),
        mainId: preset.mainId,
        secondId: preset.secondId,
        minConfirmations
      };
      return [{
        key: `smartpay5:${preset.key}`,
        settingId: primarySetting.id,
        plan: preset.plan,
        months: preset.months,
        chainId: primarySetting.chainId,
        chainName: primarySetting.chainName,
        contractAddress,
        tokenAddress: preset.primaryTokenAddress,
        tokenSymbol: preset.primaryTokenSymbol,
        tokenDecimals: preset.primaryTokenDecimals,
        tokenAmountAtomic: fullPrimaryAtomic.toString(),
        tokenAmount: atomicTokenAmountToDisplay(fullPrimaryAtomic, preset.primaryTokenDecimals),
        mainId: preset.mainId,
        secondId: preset.secondId,
        minConfirmations,
        smartPay5Offer: offer
      } satisfies SmartPayCheckoutOption];
    });
  }))).flat();
  return smartPay5Options;
}

export async function currentSmartPayCheckoutOption(settingId: string, plan: CryptoSubscriptionPlan) {
  const settings = await activeCryptoSettings();
  const setting = settings.find(candidate => candidate.id === settingId);
  if (!setting) return null;
  const options = await currentSmartPayCheckoutOptions(settings);
  return options.find(option => option.settingId === settingId && option.plan === plan) || null;
}
