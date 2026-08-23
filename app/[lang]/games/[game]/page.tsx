import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "../../../../components/SiteHeader";
import { getSessionUser } from "../../../../lib/auth";
import { interfaceText, safeSiteLanguage, type SiteLanguage } from "../../../../lib/site-locale";

export const dynamic = "force-dynamic";

const games = {
  monopoly: { en: "Lucky Wheel", zh: "幸运轮盘" },
  miner: { en: "Miner", zh: "星际矿工" },
} as const;

type GameKey = keyof typeof games;

const modeLabels: Record<SiteLanguage, { game: string; trial: string }> = {
  zh: { game: "正式游戏", trial: "试玩" }, en: { game: "game", trial: "trial" },
  es: { game: "juego", trial: "prueba" }, ja: { game: "ゲーム", trial: "体験版" },
  ko: { game: "게임", trial: "체험판" }, fr: { game: "jeu", trial: "essai" },
  de: { game: "Spiel", trial: "Testversion" }, ru: { game: "игра", trial: "пробная версия" },
  it: { game: "gioco", trial: "prova" }, pt: { game: "jogo", trial: "teste" },
  ar: { game: "لعبة", trial: "نسخة تجريبية" }, hi: { game: "खेल", trial: "परीक्षण" },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string; game: string }> }): Promise<Metadata> {
  const { lang: raw, game } = await params;
  const lang = safeSiteLanguage(raw);
  if (!(game in games)) return {};
  return { title: `${interfaceText(lang, games[game as GameKey].en, games[game as GameKey].zh)} ${modeLabels[lang].game}` };
}

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; game: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { lang: raw, game } = await params;
  const lang = safeSiteLanguage(raw);
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

  const gameTitle = interfaceText(lang, games[game as GameKey].en, games[game as GameKey].zh);
  const frameTitle = `${gameTitle} ${modeLabels[lang][mode === "play" ? "game" : "trial"]}`;
  const frameSrc = `/games/${game}.html?mode=${mode}&lang=${lang}`;

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
