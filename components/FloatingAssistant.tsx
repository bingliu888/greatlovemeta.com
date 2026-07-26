"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingAssistant() {
  const pathname = usePathname();
  const lang = pathname.startsWith("/en") ? "en" : "zh";
  const route = pathname.replace(/^\/(en|zh)/, "") || "/";
  const topLevelPages = ["/", "/news", "/events", "/project"];
  if (!topLevelPages.includes(route)) return null;
  const label = lang === "zh" ? "打开 AI 助手" : "Open AI assistant";
  return <Link className="floating-assistant" href={`/${lang}/assistant`} aria-label={label} title={label}><span aria-hidden="true"/></Link>;
}
