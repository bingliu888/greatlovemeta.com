/* eslint-disable @next/next/no-img-element -- Clerk avatar URLs are rendered directly so authenticated images are never proxied or cached. */
"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { AdminMenuLink } from "./AdminMenuLink";
import { useEffect, useRef, useState } from "react";
import styles from "./account-menu.module.css";
import { shellCopyFor, type SiteLanguage } from "../lib/site-locale";

export function HeaderAccount({ lang, initialSignedIn = false }: { lang: SiteLanguage; initialSignedIn?: boolean }) {
  const t=shellCopyFor(lang);
  const clerk = useClerk();
  const [session, setSession] = useState<{ loaded: boolean; signedIn: boolean; imageUrl?: string }>({ loaded: initialSignedIn, signedIn: initialSignedIn });
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) { if (!menuRef.current?.contains(event.target as Node)) setOpen(false); }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(value => setSession({ loaded: true, signedIn: Boolean(value?.signedIn), imageUrl: value?.imageUrl }))
      .catch(() => setSession({ loaded: true, signedIn: initialSignedIn }));
  }, [initialSignedIn]);
  const signedIn = session.signedIn;
  useEffect(() => {
    if (!signedIn) return;
    const load = () => fetch("/api/messages?summary=1", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(value => value && setUnread(Number(value.unread || 0))).catch(() => undefined);
    load(); const timer = setInterval(load, 30000); return () => clearInterval(timer);
  }, [signedIn]);
  if (!session.loaded) return <span className="auth-placeholder" aria-hidden="true"/>;
  if (signedIn) {
    const label=t.account;
    return <div ref={menuRef} className={`${styles.menu} gg-account-menu`}><button className="user-icon" onClick={() => setOpen(value => !value)} aria-label={`${label}${unread ? ` · ${unread} ${t.unread}` : ""}`} title={label} aria-expanded={open}>{session.imageUrl ? <img src={session.imageUrl} alt=""/> : <span className="avatar-glyph" aria-hidden="true"/>}{unread > 0 && <i className={`unread-avatar-badge${unread > 99 ? " dot" : ""}`}>{unread > 99 ? "" : unread}</i>}</button>{open && <nav aria-label={t.accountMenu}><Link onClick={() => setOpen(false)} href={`/${lang}/dashboard`}><b>{t.dashboard}</b><small>→</small></Link><Link onClick={() => setOpen(false)} href={`/${lang}/classes?view=mine`}><b>{t.myCourses}</b><small>→</small></Link><AdminMenuLink lang={lang} onNavigate={() => setOpen(false)}/><Link onClick={() => setOpen(false)} href={`/${lang}/messages`}><b>{t.messages}</b>{unread > 0 ? <i className="menu-unread">{unread > 99 ? "99+" : unread}</i> : <small>→</small>}</Link><Link onClick={() => setOpen(false)} href={`/${lang}/account`}>{t.settings}<small>→</small></Link><Link onClick={() => setOpen(false)} href={`/${lang}/community`}>{t.memberCommunity}<small>→</small></Link><Link onClick={() => setOpen(false)} href={`/${lang}/project`}>{t.projects}<small>→</small></Link><Link onClick={() => setOpen(false)} href={`/${lang}/pricing`}>{t.membership}<small>→</small></Link><button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); await clerk.signOut(); window.location.assign(`/${lang}`); }}>{t.signOut}<small>↗</small></button></nav>}</div>;
  }
  const signInLabel=t.signIn;
  return <Link className="user-icon" href={`/${lang}/auth/login`} aria-label={signInLabel} title={signInLabel}><span className="avatar-glyph" aria-hidden="true"/></Link>;
}
