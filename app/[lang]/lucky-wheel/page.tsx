import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "../../../components/SiteHeader";
import { getSessionUser } from "../../../lib/auth";
import { safeSiteLanguage } from "../../../lib/site-locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang = safeSiteLanguage(raw);
  return { title: lang === "zh" ? "幸运轮盘" : "Lucky Wheel" };
}

export default async function LuckyWheelPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { lang: raw } = await params;
  const lang = safeSiteLanguage(raw), contentLang = lang === "zh" ? "zh" : "en";
  const query = await searchParams;
  const mode = query.mode === "play" ? "play" : "trial";
  if (mode === "play") {
    const user = await getSessionUser();
    if (!user) {
      const returnTo = `/api/game-launch?game=monopoly&lang=${lang}`;
      redirect(`/${lang}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }

  const gameTitle = contentLang === "zh" ? "幸运轮盘" : "Lucky Wheel";
  const frameTitle = contentLang === "zh"
    ? `${gameTitle}${mode === "play" ? "正式游戏" : "试玩"}`
    : `${gameTitle} ${mode === "play" ? "game" : "trial"}`;
  const frameSrc = `/games/monopoly.html?mode=${mode}&lang=${contentLang}`;

  return <>
    <SiteHeader lang={lang}/>
    <main className="game-frame-page">
      <h1 className="sr-only">{frameTitle}</h1>
      <div className="game-frame-shell">
        <iframe src={frameSrc} title={frameTitle}/>
      </div>
    </main>
  </>;
}
