"use client";

import { ClerkDualAuthForm } from "./portfolio-auth/ClerkDualAuthForm";
import type { SiteLanguage } from "../lib/site-locale";

export function ClerkAuthForm({ lang, returnTo = `/${lang}/dashboard` }: { lang: SiteLanguage; returnTo?: string }) {
  const effectiveLocale = lang;
  return <ClerkDualAuthForm locale={effectiveLocale} returnTo={returnTo} bridgeEndpoint="/api/auth/clerk-session" />;
}
