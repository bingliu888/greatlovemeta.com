"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Entry = {
  id: string;
  game: "monopoly" | "miner";
  playDate: string;
  rawScore: number;
  score: number;
  unit: string;
  playedAt: number;
};

type Redemption = {
  id: string;
  amount: number;
  status: string;
  requestedAt: number;
} | null;

type Summary = {
  entries: Entry[];
  allTimeTotal: number;
  redeemedTotal: number;
  availableBalance: number;
  walletAddress: string;
  lastRedemption: Redemption;
  limit: number;
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function recentDates() {
  const dates: string[] = [];
  const today = new Date();
  for (let index = 0; index < 14; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    dates.push(dateKey(date));
  }
  return dates;
}

export function GameDailyLog({ lang, compact = false }: { lang: "en" | "zh"; compact?: boolean }) {
  const dates = useMemo(() => recentDates(), []);
  const [summary, setSummary] = useState<Summary>({
    entries: [],
    allTimeTotal: 0,
    redeemedTotal: 0,
    availableBalance: 0,
    walletAddress: "",
    lastRedemption: null,
    limit: 1,
  });
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [walletEditing, setWalletEditing] = useState(false);
  const [walletDraft, setWalletDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const zh = lang === "zh";

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/game-results?summary=1&from=${dates.at(-1)}&to=${dates[0]}`, { cache: "no-store" });
      if (response.status === 401) {
        setAvailable(false);
        return;
      }
      if (!response.ok) throw new Error();
      const result = await response.json() as Summary;
      setSummary(result);
      setWalletDraft(result.walletAddress || "");
      setAvailable(true);
    } catch {
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [dates]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void load(); }, 0);
    function refresh() { void load(); }
    window.addEventListener("greatlove:game-log-updated", refresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("greatlove:game-log-updated", refresh);
    };
  }, [load]);

  const dailyScores = useMemo(() => dates.map((date) => {
    const entries = summary.entries.filter((entry) => entry.playDate === date);
    const monopoly = entries.filter((entry) => entry.game === "monopoly").reduce((sum, entry) => sum + entry.score, 0);
    const miner = entries.filter((entry) => entry.game === "miner").reduce((sum, entry) => sum + entry.score, 0);
    return { date, monopoly, miner, total: monopoly + miner };
  }), [dates, summary.entries]);

  async function saveWallet(event: React.FormEvent) {
    event.preventDefault();
    const walletAddress = walletDraft.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setMessage(zh ? "请输入有效的 EVM 钱包地址（0x 开头）。" : "Enter a valid EVM wallet address beginning with 0x.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      if (!response.ok) throw new Error();
      setSummary((value) => ({ ...value, walletAddress }));
      setWalletEditing(false);
      setMessage(zh ? "钱包已保存，可以提交兑换。" : "Wallet saved. You can now submit a redemption.");
    } catch {
      setMessage(zh ? "钱包保存失败，请重试。" : "Could not save the wallet. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    if (!summary.walletAddress) {
      setWalletEditing(true);
      setMessage(zh ? "请先保存接收奖励的 EVM 钱包。" : "Save an EVM wallet before redeeming.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/game-redemptions", { method: "POST" });
      const result = await response.json() as { redemption?: { amount: number }; error?: string };
      if (!response.ok || !result.redemption) throw new Error(result.error);
      setMessage(zh ? `已提交 ${result.redemption.amount.toLocaleString()} GLC 兑换申请。` : `Redemption request submitted for ${result.redemption.amount.toLocaleString()} GLC.`);
      await load();
    } catch {
      setMessage(zh ? "暂时无法提交兑换，请检查余额后重试。" : "Could not submit the redemption. Check your balance and try again.");
    } finally {
      setBusy(false);
    }
  }

  const latestStatus = summary.lastRedemption?.status === "pending"
    ? (zh ? "处理中" : "Pending")
    : summary.lastRedemption?.status;

  return <section id="game-log" className={`game-daily-log${compact ? " compact" : ""}`} aria-labelledby={`game-log-title-${compact ? "compact" : "full"}`}>
    <div className="game-log-heading">
      <div><p className="section-kicker">{zh ? "游戏奖励记录" : "GAME REWARD LOG"}</p><h2 id={`game-log-title-${compact ? "compact" : "full"}`}>{zh ? "最近 14 天成绩" : "Scores from the last 14 days"}</h2></div>
      {available && !loading && <div className="game-log-total"><small>{zh ? "两款游戏累计总分" : "All-time total · both games"}</small><strong>{summary.allTimeTotal.toLocaleString()} GLC</strong></div>}
    </div>
    {loading ? <p className="game-log-empty">{zh ? "正在读取游戏记录…" : "Loading game activity…"}</p> :
      !available ? <p className="game-log-empty">{zh ? "登录后即可查看并保存游戏记录。" : "Sign in to view and save your game log."}</p> :
      <>
        <div className="game-redeem-panel">
          <div>
            <small>{zh ? "可兑换余额" : "Redeemable balance"}</small>
            <strong>{summary.availableBalance.toLocaleString()} GLC</strong>
            <span>{summary.walletAddress ? `${zh ? "钱包" : "Wallet"} · ${summary.walletAddress}` : (zh ? "尚未设置钱包" : "No wallet saved")}</span>
            {summary.lastRedemption && <span>{zh ? "最近兑换" : "Latest redemption"} · {summary.lastRedemption.amount.toLocaleString()} GLC · {latestStatus}</span>}
          </div>
          <div className="game-redeem-actions">
            <button type="button" onClick={() => void redeem()} disabled={busy || summary.availableBalance <= 0}>{busy ? (zh ? "处理中…" : "Working…") : (zh ? "兑换" : "Redeem")}</button>
            {summary.walletAddress && <Link href={`/${lang}/account`}>{zh ? "修改钱包" : "Edit wallet"} →</Link>}
          </div>
        </div>
        {walletEditing && <form className="game-wallet-form" onSubmit={saveWallet}>
          <label htmlFor={`game-wallet-${compact ? "compact" : "full"}`}>{zh ? "接收奖励的 EVM 钱包" : "EVM wallet for rewards"}</label>
          <div><input id={`game-wallet-${compact ? "compact" : "full"}`} autoComplete="off" placeholder="0x…" value={walletDraft} onChange={(event) => setWalletDraft(event.target.value)} /><button disabled={busy}>{zh ? "保存钱包" : "Save wallet"}</button></div>
        </form>}
        {message && <p className="game-redeem-message" role="status">{message}</p>}
        <div className="game-log-entries game-log-days">{dailyScores.map((day, index) => <article key={day.date}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div><b>{new Date(`${day.date}T12:00:00`).toLocaleDateString(zh ? "zh-CN" : "en-US", { month: "short", day: "numeric", weekday: "short" })}</b><small>{zh ? `幸运轮盘 ${day.monopoly.toLocaleString()} · 矿工 ${day.miner.toLocaleString()}` : `Lucky Wheel ${day.monopoly.toLocaleString()} · Miner ${day.miner.toLocaleString()}`}</small></div>
          <strong>{day.total.toLocaleString()} GLC</strong>
        </article>)}</div>
        {summary.entries.length === 0 && <p className="game-log-empty">{zh ? "最近 14 天还没有正式游戏记录。完成一局 Play 后，成绩会显示在这里。" : "No official plays in the last 14 days. Complete a Play session to add your first result."} <Link href={`/${lang}#games`}>{zh ? "选择游戏" : "Choose a game"} →</Link></p>}
      </>}
  </section>;
}
