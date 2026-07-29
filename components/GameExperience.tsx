"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GameDailyLog } from "./GameDailyLog";

type GameKey = "monopoly" | "miner";
type GameMode = "trial" | "play";
type PlayState = "loading" | "ready" | "limit" | "error";

const DAILY_PLAY_LIMIT = 1;
const POINT_VALUE = 10_000;

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function GameExperience({ lang, game, mode, autoStart = false }: { lang: "en" | "zh"; game: GameKey; mode: GameMode; autoStart?: boolean }) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const recordedAttempts = useRef(new Set<string>());
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [playState, setPlayState] = useState<PlayState>(mode === "play" ? "loading" : "ready");
  const [playsRemaining, setPlaysRemaining] = useState(mode === "play" ? 0 : DAILY_PLAY_LIMIT);
  const zh = lang === "zh";
  const title = game === "monopoly" ? (zh ? "大富翁" : "Monopoly") : (zh ? "星际矿工" : "Miner");
  const playReturnTo = `/${lang}/games/${game}?mode=play${game === "miner" ? "&start=1" : ""}`;

  useEffect(() => {
    if (mode !== "play") return;
    let cancelled = false;
    const loadUsage = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/game-results?date=${localDate()}&game=${game}`, { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign(`/${lang}/auth/login?returnTo=${encodeURIComponent(playReturnTo)}`);
          return;
        }
        const result = await response.json().catch(() => ({})) as {
          entries?: unknown[];
          playsRemaining?: number;
          limitReached?: boolean;
        };
        if (!response.ok) throw new Error();
        if (cancelled) return;
        const remaining = Math.max(0, result.playsRemaining ?? DAILY_PLAY_LIMIT - (result.entries?.length ?? 0));
        setPlaysRemaining(remaining);
        setPlayState(result.limitReached || remaining === 0 ? "limit" : "ready");
      } catch {
        if (!cancelled) setPlayState("error");
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(loadUsage);
    };
  }, [game, lang, mode, playReturnTo]);

  useEffect(() => {
    async function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== iframe.current?.contentWindow) return;
      const data = event.data as { type?: string; game?: string; rawScore?: number; attemptId?: string };
      if (data?.type !== "greatlove:game-result" || data.game !== game) return;
      const rawScore = Number(data.rawScore);
      const attemptId = String(data.attemptId || "");
      if (!Number.isInteger(rawScore) || !/^[A-Za-z0-9-]{16,80}$/.test(attemptId)) return;
      if (recordedAttempts.current.has(attemptId)) return;
      recordedAttempts.current.add(attemptId);
      if (mode === "trial") {
        setStatus(zh ? `试玩完成：${(rawScore * POINT_VALUE).toLocaleString()} GLC。正式 Play 登录后会保存成绩。` : `Trial complete: ${(rawScore * POINT_VALUE).toLocaleString()} GLC. Sign in through Play to save results.`);
        return;
      }
      setSaving(true);
      setStatus(zh ? "正在保存本局成绩…" : "Saving this result…");
      try {
        const response = await fetch("/api/game-results", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ game, rawScore, attemptId, playDate: localDate() }),
        });
        if (response.status === 401) {
          window.location.assign(`/${lang}/auth/login?returnTo=${encodeURIComponent(playReturnTo)}`);
          return;
        }
        const result = await response.json().catch(() => ({})) as {
          duplicate?: boolean;
          error?: string;
          code?: string;
          playsRemaining?: number;
          limitReached?: boolean;
        };
        if (response.status === 429 && result.code === "DAILY_PLAY_LIMIT") {
          setPlaysRemaining(0);
          setPlayState("limit");
          setStatus(zh ? "今天这款游戏的 1 局 Play 已完成，请明天再来。" : "You have completed today's Play session for this game. Play again tomorrow.");
          return;
        }
        if (!response.ok) throw new Error(result.error || "Unable to save");
        const remaining = Math.max(0, result.playsRemaining ?? playsRemaining - 1);
        setPlaysRemaining(remaining);
        if (result.limitReached || remaining === 0) {
          setPlayState("limit");
          setStatus(zh ? "本局成绩已保存。今天这款游戏的 Play 已完成，请明天再来。" : "Your result is saved. Today's Play for this game is complete—play again tomorrow.");
        } else {
          setStatus(result.duplicate ? (zh ? "本局成绩已经记录。" : "This result is already in today's log.") : (zh ? `成绩已保存。今天还可 Play ${remaining} 次。` : `Result saved. ${remaining} Play session${remaining === 1 ? "" : "s"} remaining today.`));
        }
        window.dispatchEvent(new Event("greatlove:game-log-updated"));
      } catch {
        recordedAttempts.current.delete(attemptId);
        setStatus(zh ? "成绩暂时无法保存，请稍后重试本局。" : "The result could not be saved. Please try the game again shortly.");
      } finally {
        setSaving(false);
      }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [game, lang, mode, playReturnTo, playsRemaining, zh]);

  const limitMessage = <div className="game-limit-card" role="status">
    <span>01 / 01</span>
    <h2>{zh ? "今天的 Play 已完成" : "Today's Play is complete"}</h2>
    <p>{zh ? "您今天这款游戏的 1 局正式成绩已保存。请明天再来；试玩仍可继续。" : "Your official result for this game has been saved today. Play again tomorrow; Test trial remains available."}</p>
    <Link href={`/${lang}/games/${game}?mode=trial`}>{zh ? "继续试玩" : "Continue Test trial"}</Link>
  </div>;

  return <div className="game-experience">
    <section className="game-player-heading">
      <div><p className="section-kicker">{mode === "play" ? (zh ? "正式游戏 · 自动记录" : "OFFICIAL PLAY · AUTO-SAVED") : (zh ? "公开试玩 · 不记录" : "PUBLIC TRIAL · NOT SAVED")}</p><h1>{title}</h1><p>{mode === "play" ? (zh ? `每款游戏每天最多完成 1 局 Play；1 Point = 10,000 GLC。${playState === "ready" ? "今天还可 Play 1 次。" : ""}` : `Complete 1 Play session per game each day; 1 Point = 10,000 GLC. ${playState === "ready" ? "1 remaining today." : ""}`) : (zh ? "试玩无需登录且不限次数，成绩不会保存。准备好后切换到 Play。" : "Try without signing in or a daily limit. Trial scores are not saved; switch to Play when ready.")}</p></div>
      <div className="game-mode-actions">
        {game !== "miner" && <Link className={mode === "trial" ? "active" : ""} href={`/${lang}/games/${game}?mode=trial`}>{zh ? "试玩" : "Test trial"}</Link>}
        {game !== "miner" && <Link className={mode === "play" ? "active" : ""} href={`/${lang}/games/${game}?mode=play`}>{zh ? "开始 Play" : "Play"}</Link>}
        <Link href={`/${lang}#games`}>{zh ? "返回游戏区" : "All games"}</Link>
      </div>
    </section>
    {playState === "limit" ? limitMessage :
      playState === "loading" ? <div className="game-limit-card loading" role="status"><span>•••</span><h2>{zh ? "正在确认今日次数" : "Checking today's plays"}</h2><p>{zh ? "请稍候，游戏马上开始。" : "One moment—the game will start shortly."}</p></div> :
      playState === "error" ? <div className="game-limit-card error" role="alert"><span>!</span><h2>{zh ? "暂时无法开始 Play" : "Play is temporarily unavailable"}</h2><p>{zh ? "无法确认今天的游戏次数，请刷新页面后重试。" : "We could not verify today's play count. Refresh the page to try again."}</p></div> :
      <div className="game-frame-shell">
        <iframe ref={iframe} src={`/games/${game}.html?mode=${mode}&lang=${lang}${autoStart ? "&start=1" : ""}`} title={`${title} — ${mode}`} allow="autoplay" />
      </div>}
    {status && <p className={`game-save-status${saving ? " saving" : ""}`} role="status">{status}</p>}
    {mode === "play" && <GameDailyLog lang={lang}/>}
  </div>;
}
