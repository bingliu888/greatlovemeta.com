import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "../../../../components/SiteHeader";
import { getSessionUser } from "../../../../lib/auth";
import { safeSiteLanguage } from "../../../../lib/site-locale";

export const dynamic = "force-dynamic";

const games = {
  monopoly: { en: "Lucky Wheel", zh: "幸运轮盘" },
  miner: { en: "Miner", zh: "星际矿工" },
} as const;

type GameKey = keyof typeof games;

export async function generateMetadata({ params }: { params: Promise<{ lang: string; game: string }> }): Promise<Metadata> {
  const { lang: raw, game } = await params;
  const lang = safeSiteLanguage(raw), contentLang = lang === "zh" ? "zh" : "en";
  if (!(game in games)) return {};
  return { title: `${games[game as GameKey][contentLang]} Games` };
}

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; game: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { lang: raw, game } = await params;
  const lang = safeSiteLanguage(raw), contentLang = lang === "zh" ? "zh" : "en";
  const query = await searchParams;
  if (!(game in games)) notFound();
  const mode = query.mode === "play" ? "play" : "trial";
  if (game === "monopoly") redirect(`/${lang}/lucky-wheel?mode=${mode}`);
  if (mode === "play") {
    const user = await getSessionUser();
    if (!user) {
      const returnTo = `/api/game-launch?game=${game}&lang=${lang}`;
      redirect(`/${lang}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }

  const gameTitle = games[game as GameKey][contentLang];
  const frameTitle = contentLang === "zh"
    ? `${gameTitle}${mode === "play" ? "正式游戏" : "试玩"}`
    : `${gameTitle} ${mode === "play" ? "game" : "trial"}`;
  const frameSrc = `/games/${game}.html?mode=${mode}&lang=${contentLang}`;

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
