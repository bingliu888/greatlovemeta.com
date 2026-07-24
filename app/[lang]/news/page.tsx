import { notFound } from "next/navigation";
import { EditorialPage } from "../../../components/EditorialPage";
import { fallbackNews, getEditorialDocument } from "../../../lib/editorial-content";

export const dynamic = "force-dynamic";

export default async function NewsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") notFound();
  const zh = lang === "zh";
  const document = await getEditorialDocument("news", fallbackNews);
  return <EditorialPage kind="news" lang={lang} editionDate={document.editionDate} eyebrow={zh ? "全球公民动态" : "GREATLOVE META NEWS"} title={zh ? "了解正在发生的改变。" : "See what is moving forward."} intro={zh ? "关注数字身份、全球社区、生态合作与共建项目的重要进展。" : "Follow meaningful progress in digital identity, global community, ecosystem partnerships, and citizen-led projects."} cards={document[lang]}/>;
}
