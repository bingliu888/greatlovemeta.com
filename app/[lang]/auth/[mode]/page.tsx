import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClerkAuthForm } from "../../../../components/ClerkAuthForm";
import { LanguageLink } from "../../../../components/LanguageMemory";
import { authInterfaceCopyFor } from "../../../../lib/auth-interface-copy";
import { safeSiteLanguage } from "../../../../lib/site-locale";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; return { title: authInterfaceCopyFor(safeSiteLanguage(lang)).title }; }
export default async function AuthPage({ params, searchParams }: { params: Promise<{ lang: string; mode: string }>; searchParams: Promise<{ returnTo?: string }> }) {
  const { lang: rawLang, mode } = await params; const lang=safeSiteLanguage(rawLang); if(lang!==rawLang)redirect("/en/auth/login"); if (mode !== "login") redirect(`/${lang}/auth/login`); const t = authInterfaceCopyFor(lang);
  const query = await searchParams; const returnTo = query.returnTo && /^\/(?!\/)[A-Za-z0-9/_?&=.%#-]*$/.test(query.returnTo) ? query.returnTo : `/${lang}/dashboard`;
  return <main className="auth-page"><aside className="auth-art gc-auth-art"><Link className="brand inverse" href={`/${lang}`}><span className="brand-seal gc-brand-seal">GL</span><span>{lang === "zh" ? "大爱元宇宙" : "GreatLoveMeta.com"}</span></Link><div className="gc-auth-mark" aria-hidden="true"><span>GL</span><i/><i/><i/></div><blockquote>{t.quote}</blockquote><p>{t.meta}</p></aside><section className="auth-panel"><div className="auth-top"><Link href={`/${lang}`}>← {t.back}</Link><LanguageLink lang={lang}/></div><div className="auth-box"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.continueText}</p><ClerkAuthForm lang={lang} returnTo={returnTo}/></div></section></main>;
}
