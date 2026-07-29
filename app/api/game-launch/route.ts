import { getSessionUser } from "../../../lib/auth";

const gameKeys = new Set(["monopoly", "miner"]);
const languages = new Set(["en", "zh"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const game = url.searchParams.get("game") || "";
  const lang = url.searchParams.get("lang") || "";
  if (!gameKeys.has(game) || !languages.has(lang)) {
    return Response.json({ error: "Invalid game launch" }, { status: 400 });
  }

  const launchPath = `/api/game-launch?game=${encodeURIComponent(game)}&lang=${encodeURIComponent(lang)}`;
  const user = await getSessionUser(request);
  if (!user) {
    const loginPath = `/${lang}/auth/login?returnTo=${encodeURIComponent(launchPath)}`;
    return Response.redirect(new URL(loginPath, request.url), 303);
  }

  return Response.redirect(new URL(`/${lang}/games/${game}?mode=play`, request.url), 303);
}
