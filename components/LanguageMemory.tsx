"use client";

import Link from "next/link";
import { useEffect } from "react";

export type SiteLanguage = "en" | "zh";
const storageKey = "greatlovemeta-language";

export function LanguageSync({ lang }: { lang: SiteLanguage }) {
  useEffect(() => {
    window.localStorage.setItem(storageKey, lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);
  return null;
}

export function LanguageLink({ lang, className, compact = false }: { lang: SiteLanguage; className?: string; compact?: boolean }) {
  const next = lang === "en" ? "zh" : "en";
  return <Link className={className ?? "language-link"} href={`/${next}`} hrefLang={next} onClick={() => window.localStorage.setItem(storageKey, next)} aria-label={lang === "en" ? "Switch website to Chinese" : "Switch website to English"}><span aria-hidden="true">◎</span>{lang === "en" ? "ZH" : compact ? "EN" : "English"}</Link>;
}

export function RootLanguageRedirect() {
  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    window.location.replace(saved === "en" ? "/en" : "/zh");
  }, []);
  return <main className="language-loading"><span>GreatLoveMeta.com</span></main>;
}
