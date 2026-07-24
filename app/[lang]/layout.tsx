import { LanguageSync, type SiteLanguage } from "../../components/LanguageMemory";

export default async function LanguageLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  const safeLanguage: SiteLanguage = lang === "zh" ? "zh" : "en";
  return <><LanguageSync lang={safeLanguage}/>{children}</>;
}
