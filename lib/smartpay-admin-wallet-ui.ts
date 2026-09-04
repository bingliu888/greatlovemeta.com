import { interfaceText, type SiteLanguage } from "./site-locale";

export function smartPayOwnerWalletButton(locale: SiteLanguage, busy: string, connectedWallet = "") {
  return {
    label: interfaceText(locale, "Connect wallet", "连接钱包"),
    disabled: Boolean(busy),
    visible: !connectedWallet
  };
}
