"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { interfaceText, isSiteLanguage } from "../lib/site-locale";

export function FloatingAssistant() {
  const pathname = usePathname();
  const segment=pathname.split("/")[1]; const lang=isSiteLanguage(segment)?segment:"en";
  const route = pathname.replace(/^\/[^/]+/, "") || "/";
  const topLevelPages = ["/", "/news", "/events", "/project"];
  if (!topLevelPages.includes(route)) return null;
  const label = interfaceText(lang,"Open AI assistant","打开智能助手");
  return <div className="floating-assistant-layer"><Link className="floating-assistant" href={`/${lang}/assistant`} aria-label={label} title={label}><span aria-hidden="true"/></Link></div>;
}
