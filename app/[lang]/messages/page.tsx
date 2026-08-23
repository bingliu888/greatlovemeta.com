import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MessageCenter } from "../../../components/MessageCenter";
import { SiteHeader } from "../../../components/SiteHeader";
import { getSessionUser } from "../../../lib/auth";
import "./messages.css";
import { safeSiteLanguage } from "../../../lib/site-locale";

export const dynamic = "force-dynamic";

export default async function MessagesPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ member?: string }> }) {
  const { lang: raw } = await params; const lang = safeSiteLanguage(raw), contentLang = lang === "zh" ? "zh" : "en";
  const requestHeaders = await headers(); const user = await getSessionUser(new Request("https://greatlovemeta.com", { headers: { cookie: requestHeaders.get("cookie") || "" } }));
  if (!user) redirect(`/${lang}/auth/login`);
  const { member } = await searchParams;
  return <main className="messages-page"><SiteHeader lang={lang}/><MessageCenter lang={contentLang} initialMemberId={member || ""}/></main>;
}
