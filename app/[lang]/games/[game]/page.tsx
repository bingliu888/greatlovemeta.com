import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { GameExperience } from "../../../../components/GameExperience";
import { SiteFooter } from "../../../../components/SiteFooter";
import { SiteHeader } from "../../../../components/SiteHeader";
import { getSessionUser } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

const games = {
  monopoly: { en: "Monopoly", zh: "大富翁" },
  miner: { en: "Miner", zh: "星际矿工" },
} as const;

type GameKey = keyof typeof games;

export async function generateMetadata({ params }: { params: Promise<{ lang: string; game: string }> }): Promise<Metadata> {
  const { lang, game } = await params;
  if ((lang !== "en" && lang !== "zh") || !(game in games)) return {};
  return { title: `${games[game as GameKey][lang]} Games` };
}

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; game: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { lang, game } = await params;
  const query = await searchParams;
  if ((lang !== "en" && lang !== "zh") || !(game in games)) notFound();
  const mode = query.mode === "play" ? "play" : "trial";
  if (mode === "play") {
    const requestHeaders = await headers();
    const user = await getSessionUser(new Request("https://greatlovemeta.com", { headers: { cookie: requestHeaders.get("cookie") ?? "" } }));
    if (!user) {
      const returnTo = `/${lang}/games/${game}?mode=play`;
      redirect(`/${lang}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }
  return <main className="game-page">
    <SiteHeader lang={lang}/>
    <GameExperience lang={lang} game={game as GameKey} mode={mode}/>
    <SiteFooter lang={lang}/>
  </main>;
}
