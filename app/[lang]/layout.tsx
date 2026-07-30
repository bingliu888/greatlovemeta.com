import type { Metadata } from "next";
import { LanguageSync, type SiteLanguage } from "../../components/LanguageMemory";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (lang !== "zh") return {};
  const title = "大爱元宇宙 — AI、RWA 与全球社区";
  const description = "连接 AI 智能体、现实世界资产、会员社区与 Web3 应用的中英双语大爱生态中心。";
  return {
    title: { default: title, template: "%s | 大爱元宇宙" },
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function LanguageLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  const safeLanguage: SiteLanguage = lang === "zh" ? "zh" : "en";
  return <><LanguageSync lang={safeLanguage}/>{children}</>;
}
