import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MembersDirectory } from "../../../components/MembersDirectory";
import { SiteFooter } from "../../../components/SiteFooter";
import { SiteHeader } from "../../../components/SiteHeader";
import { getSessionUser } from "../../../lib/auth";
import { safeSiteLanguage } from "../../../lib/site-locale";

export const dynamic = "force-dynamic";

export default async function MembersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = safeSiteLanguage(raw), contentLang = lang === "zh" ? "zh" : "en";
  const incoming = await headers();
  const user = await getSessionUser(new Request("https://greatlovemeta.com", { headers: { cookie: incoming.get("cookie") || "" } }));
  if (!user) redirect(`/${lang}/auth/login?returnTo=/${lang}/members`);
  return <main className="members-page-shell"><SiteHeader lang={lang}/><MembersDirectory lang={contentLang}/><SiteFooter lang={lang}/></main>;
}
