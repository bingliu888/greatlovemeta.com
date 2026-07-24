"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./account-menu.module.css";

export function HeaderAccount({ lang, initialSignedIn = false, variant = "icon" }: { lang: "en" | "zh"; initialSignedIn?: boolean; variant?: "icon" | "text" }) {
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
    const label = lang === "zh" ? "我的账户" : "My account";
    return <div ref={menuRef} className={`${styles.menu} gg-account-menu ${variant === "text" ? "text-trigger" : ""}`}><button className={variant === "icon" ? "user-icon" : "gg-account-text"} onClick={() => setOpen(value => !value)} aria-label={`${label}${unread ? ` · ${unread} unread` : ""}`} aria-expanded={open}>{variant === "icon" ? <>{session.imageUrl ? <img src={session.imageUrl} alt=""/> : <span className="avatar-glyph" aria-hidden="true"/>}{unread > 0 && <i className={`unread-avatar-badge${unread > 99 ? " dot" : ""}`}>{unread > 99 ? "" : unread}</i>}</> : label}</button>{open && <nav aria-label={lang === "zh" ? "账户菜单" : "Account menu"}><Link onClick={() => setOpen(false)} href={`/${lang}/dashboard`}><b>{lang === "zh" ? "用户面板" : "Dashboard"}</b><small>→</small></Link><Link onClick={() => setOpen(false)} href={`/${lang}/messages`}><b>{lang === "zh" ? "消息中心" : "Messages"}</b>{unread > 0 ? <i className="menu-unread">{unread > 99 ? "99+" : unread}</i> : <small>→</small>}</Link><Link onClick={() => setOpen(false)} href={`/${lang}/account`}>{lang === "zh" ? "账户与个人资料" : "Account & profile"}<small>→</small></Link><Link onClick={() => setOpen(false)} href={`/${lang}/community`}>{lang === "zh" ? "会员社区" : "Member community"}<small>→</small></Link><Link onClick={() => setOpen(false)} href={`/${lang}/project`}>{lang === "zh" ? "共建项目" : "Ecosystem projects"}<small>→</small></Link><Link onClick={() => setOpen(false)} href={`/${lang}/pricing`}>{lang === "zh" ? "会员方案" : "Membership"}<small>→</small></Link><button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); await clerk.signOut(); window.location.assign(`/${lang}`); }}>{lang === "zh" ? "退出登录" : "Sign out"}<small>↗</small></button></nav>}</div>;
  }
  return <Link className={variant === "icon" ? "header-cta" : undefined} href={`/${lang}/auth/login`}>{lang === "zh" ? "登录" : "Sign in"}</Link>;
}
