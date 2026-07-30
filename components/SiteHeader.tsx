"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LanguageLink } from "./LanguageMemory";
import { HeaderAccount } from "./HeaderAccount";

const labels = {
  en: { academy: "BingAcademy", claw: "MyClaw", real: "WhatsReal" },
  zh: { academy: "BingAcademy", claw: "MyClaw", real: "WhatsReal" },
};

function GlobalLinks({ lang }: { lang: "en" | "zh" }) {
  const copy = labels[lang];
  return <><a href="https://bingacademy.com">{copy.academy}</a><a href="https://myclaw.one">{copy.claw}</a><a href="https://whatsreal.com">{copy.real}</a></>;
}

export function SiteHeader({ lang }: { lang: "en" | "zh" }) {
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function dismiss(event: PointerEvent) { if (mobileMenu.current?.open && !mobileMenu.current.contains(event.target as Node)) mobileMenu.current.open = false; }
    function escape(event: KeyboardEvent) { if (event.key === "Escape" && mobileMenu.current) mobileMenu.current.open = false; }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, []);
  return (
    <header className="site-header">
      <Link className="brand" href={`/${lang}`} aria-label={lang === "zh" ? "大爱元宇宙首页" : "GreatLoveMeta.com home"}>
        <span className="brand-seal gc-brand-seal" aria-hidden="true">GL</span>
        <span>{lang === "zh" ? "大爱元宇宙" : "GreatLoveMeta.com"}</span>
      </Link>
      <nav className="desktop-nav" aria-label={lang === "zh" ? "主要导航" : "Primary navigation"}>
        <GlobalLinks lang={lang}/>
      </nav>
      <div className="header-actions">
        <HeaderAccount lang={lang}/>
      </div>
      <details ref={mobileMenu} className="mobile-menu">
        <summary aria-label={lang === "zh" ? "打开菜单" : "Open menu"}><span /><span /><span /></summary>
        <div onClick={event => { if ((event.target as HTMLElement).closest("a")) mobileMenu.current!.open = false; }}>
          <GlobalLinks lang={lang}/>
          <HeaderAccount lang={lang}/>
        </div>
      </details>
      <LanguageLink lang={lang} compact />
    </header>
  );
}
