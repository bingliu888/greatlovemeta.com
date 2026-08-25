import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../../components/SiteHeader";
import { getSessionUser } from "../../../lib/auth";
import { interfaceText, safeSiteLanguage, type SiteLanguage } from "../../../lib/site-locale";

export const dynamic = "force-dynamic";

const modeLabels: Record<SiteLanguage, { game: string; trial: string }> = {
  zh: { game: "正式游戏", trial: "试玩" }, en: { game: "game", trial: "trial" },
  es: { game: "juego", trial: "prueba" }, ja: { game: "ゲーム", trial: "体験版" },
  ko: { game: "게임", trial: "체험판" }, fr: { game: "jeu", trial: "essai" },
  de: { game: "Spiel", trial: "Testversion" }, ru: { game: "игра", trial: "пробная версия" },
  it: { game: "gioco", trial: "prova" }, pt: { game: "jogo", trial: "teste" },
  ar: { game: "لعبة", trial: "نسخة تجريبية" }, hi: { game: "खेल", trial: "परीक्षण" },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang = safeSiteLanguage(raw);
  return { title: interfaceText(lang, "Lucky Wheel", "幸运轮盘") };
}

export default async function LuckyWheelPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { lang: raw } = await params;
  const lang = safeSiteLanguage(raw);
  const query = await searchParams;
  const mode = query.mode === "play" ? "play" : "trial";
  if (mode === "play") {
    const user = await getSessionUser();
    if (!user) {
      const returnTo = `/api/game-launch?game=monopoly&lang=${lang}`;
      redirect(`/${lang}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }

  const gameTitle = interfaceText(lang, "Lucky Wheel", "幸运轮盘");
  const frameTitle = `${gameTitle} ${modeLabels[lang][mode === "play" ? "game" : "trial"]}`;
  const frameSrc = `/games/monopoly.html?mode=${mode}&lang=${lang}`;

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
