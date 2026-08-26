"use client";

import { PortfolioPasswordSettings } from "./portfolio-auth/PortfolioPasswordSettings";

export function PasswordSettings({ lang }: { lang: string }) {
  return <PortfolioPasswordSettings locale={lang} />;
}
