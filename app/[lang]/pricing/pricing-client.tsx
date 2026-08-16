"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { SUBSCRIPTION_PLANS } from "../../../lib/subscription-plans";

type Platform = { pricing: { monthly: string; annual: string }; referral: { discountEligible: boolean } };

export default function PricingClient({ lang, signedIn, pricing }: { lang: "en" | "zh"; signedIn: boolean; pricing: Platform["pricing"] }) {
  const [data, setData] = useState<Platform>({ pricing, referral: { discountEligible: false } });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const zh = lang === "zh";
  useEffect(() => { if (signedIn) fetch("/api/platform").then((response) => response.ok ? response.json() : null).then((result) => { if (result) setData(result); }).catch(() => undefined); }, [signedIn]);
  async function subscribe(cadence: "monthly" | "annual") {
    if (!signedIn) { window.location.assign(`/${lang}/auth/login`); return; }
    setBusy(cadence); setError("");
    try { const response = await fetch("/api/billing/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cadence, language: lang }) }); const result = await response.json() as { approvalUrl?: string; error?: string }; if (!response.ok || !result.approvalUrl) throw new Error(result.error || "Unable to start checkout"); window.location.assign(result.approvalUrl); } catch (issue) { setError(issue instanceof Error ? issue.message : "Unable to start checkout"); setBusy(""); }
  }
  return <main className="gg-pricing"><SiteHeader lang={lang}/><section className="gg-pricing-hero"><p className="section-kicker">{zh ? "大爱元宇宙高级会员" : "GREATLOVEMETA.COM PREMIUM"}</p><h1>{zh ? "保留原有会员方案，增加安全的加密支付选择。" : "Keep the existing membership plans, now with secure crypto checkout."}</h1><p>{zh ? "月付与年付价格继续由本站原有套餐配置；PayPal 与加密支付均使用同一套餐。" : "Monthly and annual prices continue to come from this site's existing plan configuration; PayPal and crypto use the same plans."}</p>{data.referral.discountEligible && <div>✓ {zh ? "推荐优惠已应用：首个兼容的 PayPal 付费周期 85 折" : "Referral discount applied: 15% off the first eligible PayPal period"}</div>}</section><section className="gg-plan-grid">
    {SUBSCRIPTION_PLANS.map((plan, index) => <article className={index === 1 ? "recommended" : ""} key={plan.id}>{index === 1 && <b>{zh ? "最超值" : "BEST VALUE"}</b>}<p>{plan.id === "monthly" ? (zh ? "灵活选择" : "FLEXIBLE") : (zh ? "长期进阶" : "COMMITTED")}</p><h2>{plan.label[lang]}</h2><strong>${data.pricing[plan.id] || plan.fallbackPrice.slice(1)}</strong><small>{zh ? ` 美元 / ${plan.months} 个月` : ` USD / ${plan.months} month${plan.months > 1 ? "s" : ""}`}</small><ul>{plan.features[lang].map((feature) => <li key={feature}>{feature}</li>)}</ul><div className="gg-plan-actions"><Link href={`/${lang}/pricing/crypto?plan=${plan.id}`}>{zh ? "使用加密货币" : "Pay with crypto"}</Link><button onClick={() => subscribe(plan.id)} disabled={Boolean(busy)}>{busy === plan.id ? "PayPal…" : (zh ? "使用 PayPal" : "Use PayPal")}</button></div></article>)}
  </section>{error && <p className="gg-pricing-error">{error}</p>}<p className="gg-paypal-note">{zh ? "GreatLoveMeta.com 不保存银行卡号、私钥或助记词。" : "GreatLoveMeta.com never stores card numbers, private keys, or seed phrases."}</p><SiteFooter lang={lang}/></main>;
}
