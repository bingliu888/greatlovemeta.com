import type { Address } from "viem";
import { atomicTokenAmountToDisplay } from "./crypto-amount";
import { activeCryptoSettings, type CryptoPaymentSetting } from "./crypto-settings";
import { smartPay5EnabledPresets } from "./smartpay5-confirmation-control";
import { smartPay5PaymentItemDatabaseState } from "./smartpay5-confirmation-store";
import { configuredSmartPay5CheckoutScopes, type SmartPayCheckoutOption } from "./smartpay-checkout";
import type { CryptoSubscriptionPlan } from "./crypto-subscription";
import { smartPay5RulePresets } from "./smartpay5-presets";

export async function currentSmartPayCheckoutOptions(inputSettings?: readonly CryptoPaymentSetting[]) {
  const settings = inputSettings ? [...inputSettings] : await activeCryptoSettings();
  const smartPay5Options = (await Promise.all(configuredSmartPay5CheckoutScopes(settings).map(async scope => {
    const contractAddress = scope.contractAddress as Address;
    const presets = smartPay5RulePresets(settings, scope.chainId);
    const state = await smartPay5PaymentItemDatabaseState(scope.chainId, presets);
    return smartPay5EnabledPresets(presets, state.enabledPresetKeys).flatMap(preset => {
      const fullPrimaryAtomic = BigInt(preset.primaryTokenAmountAtomic);
      const fullSecondaryAtomic = BigInt(preset.secondaryTokenAmountAtomic);
      if (fullPrimaryAtomic <= 0n) return [];
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
        minimumSecondaryBalanceAtomic: preset.minimumSecondaryBalanceAtomic,
        minimumSecondaryBalance: atomicTokenAmountToDisplay(BigInt(preset.minimumSecondaryBalanceAtomic), preset.secondaryTokenDecimals),
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
