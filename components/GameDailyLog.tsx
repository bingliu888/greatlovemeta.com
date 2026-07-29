"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Entry = {
  id: string;
  game: "monopoly" | "miner";
  rawScore: number;
  score: number;
  unit: string;
  playedAt: number;
};

function localDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function GameDailyLog({ lang, compact = false }: { lang: "en" | "zh"; compact?: boolean }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [playLimit, setPlayLimit] = useState(1);
  const date = useMemo(() => localDate(), []);
  const zh = lang === "zh";

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/game-results?date=${date}`, { cache: "no-store" });
      if (response.status === 401) {
        setAvailable(false);
        setEntries([]);
        return;
      }
      if (!response.ok) throw new Error();
      const result = await response.json() as { entries?: Entry[]; limit?: number };
      setEntries(result.entries || []);
      setPlayLimit(result.limit || 1);
      setAvailable(true);
    } catch {
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void load(); }, 0);
    function refresh() { void load(); }
    window.addEventListener("greatlove:game-log-updated", refresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("greatlove:game-log-updated", refresh);
    };
  }, [load]);

  const total = entries.reduce((sum, entry) => sum + entry.score, 0);
  const names = {
    monopoly: zh ? "大富翁" : "Monopoly",
    miner: zh ? "星际矿工" : "Miner",
  };

  return <section id="game-log" className={`game-daily-log${compact ? " compact" : ""}`} aria-labelledby={`game-log-title-${compact ? "compact" : "full"}`}>
    <div className="game-log-heading">
      <div><p className="section-kicker">{zh ? "每日游戏记录" : "DAILY GAME LOG"}</p><h2 id={`game-log-title-${compact ? "compact" : "full"}`}>{zh ? "今天的游戏成绩" : "Today's game results"}</h2></div>
      {available && !loading && <div className="game-log-total"><small>{zh ? `今日 ${entries.length} 局 · 每款最多 ${playLimit} 局` : `${entries.length} today · ${playLimit} per game`}</small><strong>{total.toLocaleString()} GLC</strong></div>}
    </div>
    {loading ? <p className="game-log-empty">{zh ? "正在读取游戏记录…" : "Loading game activity…"}</p> :
      !available ? <p className="game-log-empty">{zh ? "登录后即可查看并保存每日游戏记录。" : "Sign in to view and save your daily game log."}</p> :
      entries.length === 0 ? <p className="game-log-empty">{zh ? "今天还没有正式游戏记录。完成一局 Play 后，成绩会显示在这里。" : "No official plays yet today. Complete a Play session to add your first result."} <Link href={`/${lang}#games`}>{zh ? "选择游戏" : "Choose a game"} →</Link></p> :
      <div className="game-log-entries">{entries.map((entry, index) => <article key={entry.id}><span>{String(index + 1).padStart(2, "0")}</span><div><b>{names[entry.game]}</b><small>{new Date(entry.playedAt * 1000).toLocaleTimeString(zh ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" })}</small></div><strong>{entry.score.toLocaleString()} {entry.unit}</strong></article>)}</div>}
  </section>;
}
