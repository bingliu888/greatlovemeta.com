"use client";

import { useEffect, useRef, useState } from "react";
import { shellCopyFor, siteLanguages, type SiteLanguage } from "../lib/site-locale";

export const HEADER_LANGUAGES = siteLanguages;

type LanguageCode = typeof HEADER_LANGUAGES[number][0];
const codes = new Set<string>(HEADER_LANGUAGES.map(([code]) => code));
const preferenceKey = "site-interface-language";

export function HeaderLanguageMenu({ lang, mobile = false, onNavigate }: { lang: SiteLanguage; mobile?: boolean; onNavigate?: () => void }) {
  const [selected, setSelected] = useState<LanguageCode>(lang);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const t=shellCopyFor(lang);
  useEffect(() => { setSelected(lang); }, [lang]);
  useEffect(() => {
    function dismiss(event: PointerEvent) { if (menuRef.current?.open && !menuRef.current.contains(event.target as Node)) menuRef.current.open = false; }
    function escape(event: KeyboardEvent) { if (event.key === "Escape" && menuRef.current) menuRef.current.open = false; }
    document.addEventListener("pointerdown", dismiss); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, []);
  function choose(code: LanguageCode) {
    window.localStorage.setItem(preferenceKey, code); onNavigate?.();
    const url = new URL(window.location.href); const parts = url.pathname.split("/");
    if (codes.has(parts[1])) parts[1] = code; else parts.splice(1,0,code);
    url.pathname = parts.join("/") || `/${code}`;
    url.searchParams.delete("uiLocale");
    window.location.assign(url.pathname + url.search + url.hash);
  }
  const options = HEADER_LANGUAGES.map(([code,label]) => <button key={code} type="button" aria-pressed={selected===code} className={selected===code?"active":""} onClick={() => choose(code)}>{label}</button>);
  if (mobile) return <section className="mobile-language-options" aria-label={t.chooseLanguage}><strong><GlobeIcon/>{t.language}</strong><div>{options}</div></section>;
  return <details ref={menuRef} className="header-language-menu"><summary aria-label={t.chooseLanguage}>{HEADER_LANGUAGES.find(([code])=>code===selected)?.[1] || "English"}<span aria-hidden="true">⌄</span></summary><div className="header-language-options"><strong>{t.language}</strong>{options}</div></details>;
}

function GlobeIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.25"/><path d="M3.9 12h16.2M12 3.75c2.05 2.27 3.1 5.02 3.1 8.25S14.05 17.98 12 20.25C9.95 17.98 8.9 15.23 8.9 12S9.95 6.02 12 3.75Z"/></svg>}
