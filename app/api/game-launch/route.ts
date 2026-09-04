import { getSessionUser } from "../../../lib/auth";
import { isSiteLanguage } from "../../../lib/site-locale";

const gameKeys = new Set(["monopoly", "miner"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const game = url.searchParams.get("game") || "";
  const lang = url.searchParams.get("lang") || "";
  if (!gameKeys.has(game) || !isSiteLanguage(lang)) {
    return Response.json({ error: "Invalid game launch" }, { status: 400 });
  }

  const launchPath = `/api/game-launch?game=${encodeURIComponent(game)}&lang=${encodeURIComponent(lang)}`;
  const user = await getSessionUser(request);
  if (!user) {
    const loginPath = `/${lang}/auth/login?returnTo=${encodeURIComponent(launchPath)}`;
    return Response.redirect(new URL(loginPath, request.url), 303);
  }

  const gamePath = game === "monopoly" ? `/${lang}/lucky-wheel` : `/${lang}/games/${game}`;
  return Response.redirect(new URL(`${gamePath}?mode=play`, request.url), 303);
}
