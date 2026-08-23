import { requestUser } from "../../../lib/request-user";
import { SiteHeader } from "../../../components/SiteHeader";
import { AssistantClient } from "../../../components/AssistantClient";
import "./composer-bottom.css";
import { safeSiteLanguage } from "../../../lib/site-locale";

export const dynamic = "force-dynamic";

export default async function AssistantPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = safeSiteLanguage(raw), contentLang = lang === "zh" ? "zh" : "en";
  const user = await requestUser();
  return <main className="assistant-page"><SiteHeader lang={lang}/><AssistantClient lang={contentLang} signedIn={Boolean(user)}/></main>;
}
