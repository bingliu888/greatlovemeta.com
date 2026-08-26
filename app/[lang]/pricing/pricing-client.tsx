"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import type { SiteLanguage } from "../../../lib/site-locale";

type Platform = { pricing: { monthly: string; annual: string }; referral: { discountEligible: boolean } };

export default function PricingClient({ lang, signedIn: initialSignedIn, pricing }: { lang: SiteLanguage; signedIn: boolean; pricing: Platform["pricing"] }) {
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
  return <main className="gg-pricing"><SiteHeader lang={lang}/><section className="gg-pricing-hero"><p className="section-kicker">{zh ? "大爱元宇宙高级会员" : "GREATLOVEMETA PREMIUM"}</p><h1>{zh ? "先免费体验 7 天，开启完整会员与社区体验。" : "Start with 7 days free. Unlock the complete member and Community experience."}</h1><p>{zh ? "需要付款方式，试用期结束前可随时取消。" : "Payment method required. Cancel before the trial ends to avoid a charge."}</p>{data?.referral.discountEligible && <div>✓ {zh ? "推荐优惠已应用：首个付费周期 85 折" : "Referral discount applied: 15% off the first paid period"}</div>}</section><section className="gg-plan-grid">
    <article><p>{zh ? "灵活选择" : "FLEXIBLE"}</p><h2>{zh ? "月度会员" : "Monthly"}</h2><strong>{data?.pricing.monthly ? `$${data.pricing.monthly}` : (zh ? "待公布" : "Price pending")}</strong><small>{data?.pricing.monthly ? (zh ? " 美元 / 月" : " USD / month") : ""}</small><ul><li>{zh ? "内置专属小组音视频与沟通中心" : "Built-in private group audio/video and communication center"}</li><li>{zh ? "公开网络研讨会与 HLS 广播" : "Open webinars and HLS broadcasting"}</li><li>{zh ? "DeepSeek V4 Flash 默认，可选 OpenAI" : "DeepSeek V4 Flash by default, OpenAI optional"}</li><li>{zh ? "大爱元宇宙社区、项目与人工智能助手" : "GreatLoveMeta Community, projects, and AI assistant"}</li></ul><button onClick={() => subscribe("monthly")} disabled={Boolean(busy)}>{busy === "monthly" ? "PayPal…" : (zh ? "开始免费试用" : "Start free trial")}</button><a className="crypto-checkout-link" href={`/${lang}/pricing/crypto?plan=monthly`}>{zh?"使用加密货币结账":"Checkout with crypto"}</a></article>
    <article className="recommended"><b>{zh ? "最超值" : "BEST VALUE"}</b><p>{zh ? "长期进阶" : "COMMITTED"}</p><h2>{zh ? "年度会员" : "Annual"}</h2><strong>{data?.pricing.annual ? `$${data.pricing.annual}` : (zh ? "待公布" : "Price pending")}</strong><small>{data?.pricing.annual ? (zh ? " 美元 / 年" : " USD / year") : ""}</small><ul><li>{zh ? "内置专属小组音视频与沟通中心" : "Built-in private group audio/video and communication center"}</li><li>{zh ? "公开网络研讨会与 HLS 广播" : "Open webinars and HLS broadcasting"}</li><li>{zh ? "DeepSeek V4 Flash 默认，可选 OpenAI" : "DeepSeek V4 Flash by default, OpenAI optional"}</li><li>{zh ? "全年大爱元宇宙会员与推荐权益" : "A full year of GreatLoveMeta membership and referral benefits"}</li></ul><button onClick={() => subscribe("annual")} disabled={Boolean(busy)}>{busy === "annual" ? "PayPal…" : (zh ? "选择年度会员" : "Choose annual")}</button><a className="crypto-checkout-link" href={`/${lang}/pricing/crypto?plan=annual`}>{zh?"使用加密货币结账":"Checkout with crypto"}</a></article>
  </section>{error && <p className="gg-pricing-error">{error}</p>}<p className="gg-paypal-note">{zh ? "安全支付由 PayPal 处理；GreatLoveMeta.com 不保存银行卡号。" : "Secure checkout by PayPal; GreatLoveMeta.com never stores card numbers."}</p><SiteFooter lang={lang}/></main>;
}
