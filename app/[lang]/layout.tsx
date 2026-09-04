import type { Metadata } from "next";
import { LanguageSync } from "../../components/LanguageMemory";
import { LocaleRuntime } from "../../components/LocaleRuntime";
import { isChineseLanguage, safeSiteLanguage } from "../../lib/site-locale";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const language = safeSiteLanguage(lang);
  if (!isChineseLanguage(language)) return {};
  const traditional = language === "zh-tw";
  const title = traditional ? "大愛元宇宙 — AI、RWA 與全球社群" : "大爱元宇宙 — AI、RWA 与全球社区";
  const description = traditional ? "連結 AI 智慧體、現實世界資產、會員社群與 Web3 應用的中英雙語大愛生態中心。" : "连接 AI 智能体、现实世界资产、会员社区与 Web3 应用的中英双语大爱生态中心。";
  const brand = traditional ? "大愛元宇宙" : "大爱元宇宙";
  return {
    title: { default: title, template: `%s | ${brand}` },
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function LanguageLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  const safeLanguage = safeSiteLanguage(lang);
  return <><LanguageSync lang={safeLanguage}/><LocaleRuntime locale={safeLanguage}/>{children}</>;
}
