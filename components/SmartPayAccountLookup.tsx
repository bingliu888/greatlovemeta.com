"use client";

import { useState } from "react";
import type { CryptoPaymentSetting } from "../lib/crypto-settings";
import type { SiteLanguage } from "../lib/site-locale";
import { cryptoSubscriptionPlanForIds } from "../lib/crypto-subscription";

type TransactionRecord = {
  transactionId: string;
  timestamp: number;
  wallet: string;
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

export function SmartPayAccountLookup({ settings, wallet, locale }: { settings: CryptoPaymentSetting[]; wallet: string | null; locale: SiteLanguage }) {
  const zh = locale === "zh";
  const rails = [...new Map(settings.filter(item => Boolean(item.smartPay3Contract)).map(item => [
    `${item.chainId}:${item.smartPay3Contract?.toLowerCase()}`,
    item
  ])).values()];
  const [settingId, setSettingId] = useState(rails[0]?.id || "");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function checkAndActivate() {
    if (!wallet || !settingId) return;
    setBusy(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ settingId, wallet, limit: "100" });
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
        setMessage(zh ? `已按钱包与 RefID 验证并同步 ${synced} 条订阅，正在刷新账户状态…` : `${synced} subscription record(s) matched the wallet and RefID and were synchronized. Refreshing your account…`);
        window.setTimeout(() => window.location.reload(), 900);
        return;
      }
      setMessage(zh ? "最新 100 条钱包交易中没有属于当前 RefID 的未入账订阅付款。" : "The latest 100 wallet transactions contain no unclaimed subscription payment for this RefID.");
    } catch {
      setMessage(zh ? "暂时无法检查链上付款。" : "Unable to check on-chain payments right now.");
    } finally {
      setBusy(false);
    }
  }

  if (!rails.length) return null;
  return <section className="profile-card smartpay-account-lookup">
    <h2>{zh ? "链上付款检查" : "On-chain payment check"}</h2>
    <p>{zh ? "按已保存的钱包免费读取最新 100 条交易，只处理同时匹配当前账户 RefID 且尚未入账的订阅付款。查询无需连接钱包、签名或支付 Gas。" : "Read the latest 100 transactions for the saved wallet for free. Only unclaimed subscription payments that also match this account’s RefID are processed. No wallet connection, signature, or gas is required."}</p>
    {wallet ? <div className="smartpay-account-fields">
      <label><span>{zh ? "付款网络" : "Payment network"}</span><select value={settingId} onChange={event => setSettingId(event.target.value)}>{rails.map(item => <option key={`${item.chainId}:${item.smartPay3Contract}`} value={item.id}>{item.chainName}</option>)}</select></label>
      <button className="button primary" disabled={busy} onClick={() => void checkAndActivate()}>{busy ? "…" : (zh ? "读取最新交易并同步" : "Read latest transactions & sync")}</button>
    </div> : <p className="billing-message">{zh ? "请先在账户资料中保存付款钱包。" : "Save your payer wallet in the profile first."}</p>}
    {transactions.length ? <ul>{transactions.map(record => {
      const recordPlan = cryptoSubscriptionPlanForIds(record.mainId, record.secondId);
      const term = recordPlan === "annual" ? (zh ? "12 个月订阅" : "12-month subscription") : (zh ? "1 个月订阅" : "1-month subscription");
      return <li key={record.transactionId}><span><strong>{term}</strong><small>{record.primaryTokenAmount} · {record.primaryTokenAddress.slice(0, 8)}…{record.primaryTokenAddress.slice(-6)}{BigInt(record.secondaryTokenAmount || "0") > 0n ? ` + ${record.secondaryTokenAmount} · ${record.secondaryTokenAddress.slice(0, 8)}…${record.secondaryTokenAddress.slice(-6)}` : ""}</small><code>{record.transactionId}</code></span><time>{new Date(record.timestamp * 1000).toLocaleString(locale)}</time></li>;
    })}</ul> : null}
    {message ? <p className="billing-message" role="status">{message}</p> : null}
  </section>;
}
