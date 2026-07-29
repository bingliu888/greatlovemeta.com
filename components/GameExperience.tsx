"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GameDailyLog } from "./GameDailyLog";

type GameKey = "monopoly" | "miner";
type GameMode = "trial" | "play";

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function GameExperience({ lang, game, mode }: { lang: "en" | "zh"; game: GameKey; mode: GameMode }) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const recordedAttempts = useRef(new Set<string>());
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const zh = lang === "zh";
  const title = game === "monopoly" ? (zh ? "大富翁" : "Monopoly") : (zh ? "星际矿工" : "Miner");

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
        setStatus(zh ? `试玩完成：${(rawScore * 100_000).toLocaleString()} GLC。正式 Play 登录后会保存成绩。` : `Trial complete: ${(rawScore * 100_000).toLocaleString()} GLC. Sign in through Play to save results.`);
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
          window.location.assign(`/${lang}/auth/login?returnTo=${encodeURIComponent(`/${lang}/games/${game}?mode=play`)}`);
          return;
        }
        const result = await response.json().catch(() => ({})) as { duplicate?: boolean; error?: string };
        if (!response.ok) throw new Error(result.error || "Unable to save");
        setStatus(result.duplicate ? (zh ? "本局成绩已经记录。" : "This result is already in today's log.") : (zh ? "成绩已保存到您的每日游戏记录。" : "Result saved to your daily game log."));
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
  }, [game, lang, mode, zh]);

  return <div className="game-experience">
    <section className="game-player-heading">
      <div><p className="section-kicker">{mode === "play" ? (zh ? "正式游戏 · 自动记录" : "OFFICIAL PLAY · AUTO-SAVED") : (zh ? "公开试玩 · 不记录" : "PUBLIC TRIAL · NOT SAVED")}</p><h1>{title}</h1><p>{mode === "play" ? (zh ? "完成一局后，成绩会自动加入您今天的游戏记录。" : "Finish a session and your score will be added to today's personal game log.") : (zh ? "试玩无需登录，成绩不会保存。准备好后切换到 Play。" : "Try the game without signing in. Trial scores are not saved; switch to Play when ready.")}</p></div>
      <div className="game-mode-actions">
        <Link className={mode === "trial" ? "active" : ""} href={`/${lang}/games/${game}?mode=trial`}>{zh ? "试玩" : "Test trial"}</Link>
        <Link className={mode === "play" ? "active" : ""} href={`/${lang}/games/${game}?mode=play`}>{zh ? "开始 Play" : "Play"}</Link>
        <Link href={`/${lang}#games`}>{zh ? "返回游戏区" : "All games"}</Link>
      </div>
    </section>
    <div className="game-frame-shell">
      <iframe ref={iframe} src={`/games/${game}.html?mode=${mode}`} title={`${title} — ${mode}`} allow="autoplay" />
    </div>
    {status && <p className={`game-save-status${saving ? " saving" : ""}`} role="status">{status}</p>}
    {mode === "play" && <GameDailyLog lang={lang}/>}
  </div>;
}
