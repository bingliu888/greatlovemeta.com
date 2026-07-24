import { notFound } from "next/navigation";
import { requestUser } from "../../../lib/request-user";
import { SiteHeader } from "../../../components/SiteHeader";
import { AssistantClient } from "../../../components/AssistantClient";
import "./composer-bottom.css";

export const dynamic = "force-dynamic";

export default async function AssistantPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") notFound();
  const user = await requestUser();
  return <main className="assistant-page"><SiteHeader lang={lang}/><AssistantClient lang={lang} signedIn={Boolean(user)}/></main>;
}
