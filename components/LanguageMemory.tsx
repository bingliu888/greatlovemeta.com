"use client";

import Link from "next/link";
import { useEffect } from "react";
import { interfaceText, isSiteLanguage, languageHtmlTags, siteLanguages, type SiteLanguage } from "../lib/site-locale";

const storageKey = "greatlovemeta-language";

export function LanguageSync({ lang }: { lang: SiteLanguage }) {
  useEffect(() => {
    window.localStorage.setItem(storageKey, lang);
    document.documentElement.lang = languageHtmlTags[lang];
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  return null;
}

export function LanguageLink({ lang, className }: { lang: SiteLanguage; className?: string; compact?: boolean }) {
  const next = lang === "en" ? "zh" : "en";
  return <Link className={className ?? "language-link"} href={`/${next}`} hrefLang={next} onClick={() => window.localStorage.setItem(storageKey, next)} aria-label={interfaceText(lang,"Switch website language","切换网站语言")}>{next === "zh" ? "中文" : "EN"}</Link>;
}

export function RootLanguageRedirect() {
  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    window.location.replace(saved && isSiteLanguage(saved) ? `/${saved}` : "/zh");
  }, []);
  return <main className="language-loading"><span>大爱元宇宙</span></main>;
}
