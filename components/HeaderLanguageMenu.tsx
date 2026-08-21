"use client";

import { useEffect, useRef, useState } from "react";

export const HEADER_LANGUAGES = [
  ["zh","中文"],["en","English"],["es","Español"],["ja","日本語"],
  ["ko","한국어"],["fr","Français"],["de","Deutsch"],["ru","Русский"],
  ["it","Italiano"],["pt","Português"],["ar","العربية"],["hi","हिन्दी"],
] as const;

type LanguageCode = typeof HEADER_LANGUAGES[number][0];
const codes = new Set<string>(HEADER_LANGUAGES.map(([code]) => code));
const preferenceKey = "site-interface-language";

export function HeaderLanguageMenu({ lang, mobile = false, onNavigate }: { lang: "en" | "zh"; mobile?: boolean; onNavigate?: () => void }) {
  const [selected, setSelected] = useState<LanguageCode>(lang);
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("uiLocale");
    const stored = window.localStorage.getItem(preferenceKey);
    const value = query || stored;
    if (value && codes.has(value)) setSelected(value as LanguageCode);
  }, []);
  useEffect(() => {
    function dismiss(event: PointerEvent) { if (menuRef.current?.open && !menuRef.current.contains(event.target as Node)) menuRef.current.open = false; }
    function escape(event: KeyboardEvent) { if (event.key === "Escape" && menuRef.current) menuRef.current.open = false; }
    document.addEventListener("pointerdown", dismiss); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, []);
  function choose(code: LanguageCode) {
    window.localStorage.setItem(preferenceKey, code); onNavigate?.();
    const url = new URL(window.location.href); const parts = url.pathname.split("/");
    const routeLanguage = code === "zh" ? "zh" : "en";
    if (parts[1] === "zh" || parts[1] === "en") parts[1] = routeLanguage; else parts.splice(1,0,routeLanguage);
    url.pathname = parts.join("/") || `/${routeLanguage}`;
    if (code === "zh" || code === "en") url.searchParams.delete("uiLocale"); else url.searchParams.set("uiLocale", code);
    window.location.assign(url.pathname + url.search + url.hash);
  }
  const options = HEADER_LANGUAGES.map(([code,label]) => <button key={code} type="button" aria-pressed={selected===code} className={selected===code?"active":""} onClick={() => choose(code)}>{label}</button>);
  if (mobile) return <section className="mobile-language-options" aria-label={lang==="zh"?"语言选择":"Language selection"}><strong><GlobeIcon/>{lang==="zh"?"语言":"Language"}</strong><div>{options}</div></section>;
  return <details ref={menuRef} className="header-language-menu"><summary aria-label={lang==="zh"?"选择语言":"Choose language"}>{HEADER_LANGUAGES.find(([code])=>code===selected)?.[1] || "English"}<span aria-hidden="true">⌄</span></summary><div className="header-language-options"><strong>{lang==="zh"?"语言":"Language"}</strong>{options}</div></details>;
}

function GlobeIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.25"/><path d="M3.9 12h16.2M12 3.75c2.05 2.27 3.1 5.02 3.1 8.25S14.05 17.98 12 20.25C9.95 17.98 8.9 15.23 8.9 12S9.95 6.02 12 3.75Z"/></svg>}

