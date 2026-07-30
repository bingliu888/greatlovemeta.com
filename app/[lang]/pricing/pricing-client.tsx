"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";

type Platform = { pricing: { monthly: string; annual: string }; referral: { discountEligible: boolean } };

export default function PricingClient({ lang, signedIn: initialSignedIn, pricing }: { lang: "en" | "zh"; signedIn: boolean; pricing: Platform["pricing"] }) {
  const signedIn = initialSignedIn;
  const [data, setData] = useState<Platform>({ pricing, referral: { discountEligible: false } });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (signedIn) fetch("/api/platform").then(response => response.ok ? response.json() : null).then(result => { if (result) setData(result); }).catch(() => undefined); }, [signedIn]);
  const zh = lang === "zh";
  async function subscribe(cadence: "monthly" | "annual") {
    if (!signedIn) { window.location.assign(`/${lang}/auth/login`); return; }
    setBusy(cadence); setError("");
    try { const response = await fetch("/api/billing/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cadence, language: lang }) }); const result = await response.json() as { approvalUrl?: string; error?: string }; if (!response.ok || !result.approvalUrl) throw new Error(result.error || "Unable to start checkout"); window.location.assign(result.approvalUrl); } catch (issue) { setError(issue instanceof Error ? issue.message : "Unable to start checkout"); setBusy(""); }
  }
  return <main className="gg-pricing"><SiteHeader lang={lang}/><section className="gg-pricing-hero"><p className="section-kicker">{zh ? "大爱元宇宙高级会员" : "GREATLOVEMETA.DIGITAL PREMIUM"}</p><h1>{zh ? "先免费体验 7 天，开启完整数字公民体验。" : "Start with 7 days free. Unlock the complete citizen experience."}</h1><p>{zh ? "需要付款方式，试用期结束前可随时取消。" : "Payment method required. Cancel before the trial ends to avoid a charge."}</p>{data?.referral.discountEligible && <div>✓ {zh ? "推荐优惠已应用：首个付费周期 85 折" : "Referral discount applied: 15% off the first paid period"}</div>}</section><section className="gg-plan-grid">
    <article><p>{zh ? "灵活选择" : "FLEXIBLE"}</p><h2>{zh ? "月度会员" : "Monthly"}</h2><strong>{data?.pricing.monthly ? `$${data.pricing.monthly}` : (zh ? "待公布" : "Price pending")}</strong><small>{data?.pricing.monthly ? (zh ? " 美元 / 月" : " USD / month") : ""}</small><ul><li>{zh ? "7 天免费试用" : "7-day free trial"}</li><li>{zh ? "完整社区、项目与智能助手权益" : "Complete Community, Projects, and Guru access"}</li><li>{zh ? "随时取消" : "Cancel anytime"}</li></ul><button onClick={() => subscribe("monthly")} disabled={Boolean(busy)}>{busy === "monthly" ? "PayPal…" : (zh ? "开始免费试用" : "Start free trial")}</button></article>
    <article className="recommended"><b>{zh ? "最超值" : "BEST VALUE"}</b><p>{zh ? "长期进阶" : "COMMITTED"}</p><h2>{zh ? "年度会员" : "Annual"}</h2><strong>{data?.pricing.annual ? `$${data.pricing.annual}` : (zh ? "待公布" : "Price pending")}</strong><small>{data?.pricing.annual ? (zh ? " 美元 / 年" : " USD / year") : ""}</small><ul><li>{zh ? "7 天免费试用" : "7-day free trial"}</li><li>{zh ? "全年完整会员权益" : "A full year of Premium"}</li><li>{zh ? "推荐用户首年 85 折" : "15% off first year with referral"}</li></ul><button onClick={() => subscribe("annual")} disabled={Boolean(busy)}>{busy === "annual" ? "PayPal…" : (zh ? "选择年度会员" : "Choose annual")}</button></article>
  </section>{error && <p className="gg-pricing-error">{error}</p>}<p className="gg-paypal-note">{zh ? "安全支付由 PayPal 处理；大爱元宇宙不保存银行卡号。" : "Secure checkout by PayPal; GreatLoveMeta.com never stores card numbers."}</p><SiteFooter lang={lang}/></main>;
}
