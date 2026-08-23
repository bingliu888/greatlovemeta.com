import { EditorialPage } from "../../../components/EditorialPage";
import { fallbackEvents, getEditorialDocument } from "../../../lib/editorial-content";
import { safeSiteLanguage } from "../../../lib/site-locale";

export const dynamic = "force-dynamic";

export default async function EventsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = safeSiteLanguage(raw), contentLang = lang === "zh" ? "zh" : "en";
  const zh = lang === "zh";
  const document = await getEditorialDocument("events", fallbackEvents);
  return <EditorialPage kind="events" lang={lang} editionDate={document.editionDate} eyebrow={zh ? "全球活动" : "GLOBAL EVENTS"} title={zh ? "找到下一次连接与共建。" : "Find your next connection."} intro={zh ? "参与线上与线下的社区说明会、数字身份讨论和项目共建活动。" : "Join online and in-person orientations, digital identity discussions, and collaborative project sessions."} cards={document[contentLang]}/>;
}
