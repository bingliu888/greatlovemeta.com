import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "./subscription-plans";
export type CryptoPlanId = SubscriptionPlanId;
export const CRYPTO_PLANS = SUBSCRIPTION_PLANS;
export type CryptoPaymentSetting = {
  id:string;label:string;chainType:"evm";chainName:string;chainId:number;tokenSymbol:string;tokenContract:string;tokenDecimals:number;receiverWallet:string;
  monthlyAmountCents:number;annualAmountCents:number;monthlyTokenAmount:string;annualTokenAmount:string;minConfirmations:number;walletConnectProjectId:string|null;enabled:number;
};
export function explorerUrl(chainId:number,kind:"address"|"token"|"tx",value:string){const bases:Record<number,string>={1:"https://etherscan.io",56:"https://bscscan.com",137:"https://polygonscan.com",8453:"https://basescan.org"};const valid=kind==="tx"?/^0x[a-fA-F0-9]{64}$/.test(value):/^0x[a-fA-F0-9]{40}$/.test(value);return bases[chainId]&&valid?`${bases[chainId]}/${kind}/${value}`:null;}
