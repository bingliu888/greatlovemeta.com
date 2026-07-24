import Link from "next/link";
import { LanguageLink } from "./LanguageMemory";

export function SiteFooter({ lang }: { lang: "en" | "zh" }) {
  const zh = lang === "zh";
  return <footer className="global-site-footer"><div className="footer-identity"><strong>GreatLoveMeta.com</strong><span>{zh ? "大爱 · 智慧 · 永续" : "Great Love · Intelligence · Sustainability"}</span><small>© 2026 GreatLoveMeta.com</small></div><nav aria-label="Footer navigation"><Link href={`/${lang}/about`}>{zh ? "关于我们" : "About"}</Link><Link href={`/${lang}/privacy`}>{zh ? "隐私政策" : "Privacy"}</Link><Link href={`/${lang}/terms`}>{zh ? "使用条款" : "Terms"}</Link><Link href={`/${lang}/project`}>{zh ? "项目" : "Project"}</Link><Link href={`/${lang}/github`}>GitHub</Link><LanguageLink lang={lang} compact/></nav></footer>;
}
