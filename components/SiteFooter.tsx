import Link from "next/link";
import { shellCopyFor, type SiteLanguage } from "../lib/site-locale";
import { disclaimerFor } from "../lib/disclaimer-copy";
import { subscriptionLabelFor } from "../lib/subscription-copy";

export function SiteFooter({ lang }: { lang: SiteLanguage }) {
  const t=shellCopyFor(lang);
  return <footer className="global-site-footer"><div className="footer-identity"><strong>{lang === "zh" ? "大爱元宇宙" : "GreatLoveMeta.com"}</strong><span>{t.footerTag}</span><small>© 2026 {lang === "zh" ? "大爱元宇宙" : "GreatLoveMeta.com"}</small></div><nav aria-label={t.footerNav}><Link href={`/${lang}/about`}>{t.about}</Link><Link href={`/${lang}/privacy`}>{t.privacy}</Link><Link href={`/${lang}/terms`}>{t.terms}</Link><Link href={`/${lang}/disclaimer`}>{disclaimerFor(lang).label}</Link><Link href={`/${lang}/pricing`}>{subscriptionLabelFor(lang)}</Link><Link href={`/${lang}/project`}>{t.project}</Link></nav></footer>;
}
