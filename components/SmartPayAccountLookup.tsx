"use client";

import { useState } from "react";
import type { CryptoPaymentSetting } from "../lib/crypto-settings";
import type { SiteLanguage } from "../lib/site-locale";
import { cryptoSubscriptionPlanForIds } from "../lib/crypto-subscription";

type TransactionRecord = {
  transactionId: string;
  timestamp: number;
  wallet: string;
  payerId: string;
  refId: string;
  mainId: string;
  secondId: string;
  primaryTokenAddress: string;
  primaryTokenAmount: string;
  secondaryTokenAddress: string;
  secondaryTokenAmount: string;
  settingId: string | null;
  subscriptionRecorded?: boolean;
};

type LookupResponse = {
  transactions?: TransactionRecord[];
  totalTransactions?: number;
  error?: string;
};

export function SmartPayAccountLookup({ settings, locale }: { settings: CryptoPaymentSetting[]; locale: SiteLanguage }) {
  const zh = locale === "zh";
  const rails = [...new Map(settings.filter(item => Boolean(item.smartPay5Contract)).map(item => [
    `${item.chainId}:${item.smartPay5Contract?.toLowerCase()}`,
    item
  ])).values()];
  const [settingId, setSettingId] = useState(rails[0]?.id || "");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function checkAndActivate() {
    if (!settingId) return;
    setBusy(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ settingId, limit: "100" });
      const lookup = await fetch(`/api/billing/crypto/smartpay/records?${params}`, { cache: "no-store" });
      const lookupData = await lookup.json().catch(() => ({})) as LookupResponse;
      if (!lookup.ok) throw new Error(lookupData.error || "LOOKUP_FAILED");
      const pending = lookupData.transactions || [];
      setTransactions(pending);
      let synced = 0;
      for (const record of pending) {
        if (!record.settingId || record.subscriptionRecorded) continue;
        const response = await fetch("/api/billing/crypto/smartpay/claim", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ settingId: record.settingId, paymentId: record.transactionId })
        });
        const result = await response.json().catch(() => ({})) as { verified?: boolean; alreadyRecorded?: boolean; error?: string };
        if (!response.ok || !result.verified) throw new Error(result.error || "VERIFY_FAILED");
        if (!result.alreadyRecorded) synced += 1;
      }
      if (synced) {
        setMessage(zh ? `已按付款人 ID、产品所有者 RefID 与套餐验证并同步 ${synced} 条订阅，正在刷新账户状态…` : `${synced} subscription record(s) matched the PayerID, product-owner RefID, and package and were synchronized. Refreshing your account…`);
        window.setTimeout(() => window.location.reload(), 900);
        return;
      }
      setMessage(zh ? "尚未找到符合此账户付款人 ID 和产品的付款。" : "No payment matching this account PayerID and product was found.");
    } catch {
      setMessage(zh ? "暂时无法检查链上付款。" : "Unable to check on-chain payments right now.");
    } finally {
      setBusy(false);
    }
  }

  if (!rails.length) return null;
  return <section className="profile-card smartpay-account-lookup">
    <h2>{zh ? "链上付款检查" : "On-chain payment check"}</h2>
    <p>{zh ? "按当前登录账户的付款人 ID 读取近期付款，并应用产品所有者 RefID 与套餐匹配的未入账交易；无需连接钱包、签名或支付 Gas。" : "Read recent payments by this signed-in account's PayerID and apply unclaimed transactions matching the product-owner RefID and package. No wallet connection, signature, or gas is required."}</p>
    <div className="smartpay-account-fields">
      <label><span>{zh ? "付款网络" : "Payment network"}</span><select value={settingId} onChange={event => setSettingId(event.target.value)}>{rails.map(item => <option key={`${item.chainId}:${item.smartPay5Contract}`} value={item.id}>{item.chainName}</option>)}</select></label>
      <button className="button primary" disabled={busy} onClick={() => void checkAndActivate()}>{busy ? "…" : (zh ? "读取最新交易并同步" : "Read latest transactions & sync")}</button>
    </div>
    {transactions.length ? <ul>{transactions.map(record => {
      const recordPlan = cryptoSubscriptionPlanForIds(record.mainId, record.secondId);
      const term = recordPlan === "annual" ? (zh ? "12 个月订阅" : "12-month subscription") : (zh ? "1 个月订阅" : "1-month subscription");
      return <li key={record.transactionId}><span><strong>{term}</strong><small>{record.primaryTokenAmount} · {record.primaryTokenAddress.slice(0, 8)}…{record.primaryTokenAddress.slice(-6)}{BigInt(record.secondaryTokenAmount || "0") > 0n ? ` + ${record.secondaryTokenAmount} · ${record.secondaryTokenAddress.slice(0, 8)}…${record.secondaryTokenAddress.slice(-6)}` : ""}</small><code>{record.transactionId}</code></span><time>{new Date(record.timestamp * 1000).toLocaleString(locale)}</time></li>;
    })}</ul> : null}
    {message ? <p className="billing-message" role="status">{message}</p> : null}
  </section>;
}
