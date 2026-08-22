"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeaderLanguageMenu } from "./HeaderLanguageMenu";
import { HeaderAccount } from "./HeaderAccount";
import { shellCopyFor, type SiteLanguage } from "../lib/site-locale";

const labels = {
  en: { academy: "BingAcademy", claw: "MyClaw", real: "WhatsReal" },
  zh: { academy: "BingAcademy", claw: "MyClaw", real: "WhatsReal" },
};

function GlobalLinks({ lang }: { lang: SiteLanguage }) {
  const copy = labels[lang === "zh" ? "zh" : "en"];
  return <><a href="https://bingacademy.com">{copy.academy}</a><a href="https://myclaw.one">{copy.claw}</a><a href="https://whatsreal.com">{copy.real}</a></>;
}

export function SiteHeader({ lang }: { lang: SiteLanguage }) {
  const shell=shellCopyFor(lang);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!mobileOpen) return;
    function escape(event: KeyboardEvent) { if (event.key === "Escape") setMobileOpen(false); }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [mobileOpen]);
  return (
    <header className="site-header">
      <Link className="brand" href={`/${lang}`} aria-label={shell.home}>
        <span className="brand-seal gc-brand-seal" aria-hidden="true">GL</span>
        <span>{lang === "zh" ? "大爱元宇宙" : "GreatLoveMeta.com"}</span>
      </Link>
      <nav className="desktop-nav" aria-label={shell.primaryNav}>
        <GlobalLinks lang={lang}/>
      </nav>
      <div className="header-actions">
        <HeaderAccount lang={lang}/>
      </div>
      <HeaderLanguageMenu lang={lang}/>
      <button className={`hamburger-button${mobileOpen ? " open" : ""}`} type="button" aria-label={mobileOpen ? shell.closeMenu : shell.openMenu} aria-expanded={mobileOpen} aria-controls="mobile-header-menu" onClick={()=>setMobileOpen(value=>!value)}><span/><span/><span/></button>
      {mobileOpen ? <div className="mobile-header-menu" id="mobile-header-menu"><nav aria-label={shell.primaryNav} onClick={()=>setMobileOpen(false)}><GlobalLinks lang={lang}/></nav><HeaderLanguageMenu lang={lang} mobile onNavigate={()=>setMobileOpen(false)}/><div className="mobile-account"><HeaderAccount lang={lang}/></div></div> : null}
    </header>
  );
}
