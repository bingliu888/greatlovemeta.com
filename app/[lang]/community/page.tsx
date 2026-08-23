import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CommunityClient } from "../../../components/CommunityClient";
import "./community-profile.css";
import "./live-profile.css";
import "./member-drawer.css";
import "./responsive.css";
import "./active-header.css";
import "./message-link.css";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { getSessionUser } from "../../../lib/auth";
import { safeSiteLanguage } from "../../../lib/site-locale";

export const dynamic = "force-dynamic";

export default async function CommunityPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params; const lang = safeSiteLanguage(raw), contentLang = lang === "zh" ? "zh" : "en";
  const incoming = await headers(); const user = await getSessionUser(new Request("https://greatlovemeta.com", { headers: { cookie: incoming.get("cookie") || "" } }));
  if (!user) redirect(`/${lang}/auth/login?returnTo=/${lang}/community`);
  return <main className="community-page"><SiteHeader lang={lang}/><CommunityClient lang={contentLang}/><SiteFooter lang={lang}/></main>;
}
