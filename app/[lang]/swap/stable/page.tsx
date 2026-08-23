import type { Metadata } from "next";
import { SiteFooter } from "../../../../components/SiteFooter";
import { SiteHeader } from "../../../../components/SiteHeader";
import { SwapAssetLoader } from "../../../../components/SwapAssetLoader";
import { safeSiteLanguage } from "../../../../lib/site-locale";

const copy = {
  en: {
    title: "USDT – GLUSD Stable Swap",
    description: "Swap USDT for GLUSD through the GreatLove Polygon contract.",
    wallet: "Connect Wallet",
    disconnect: "Disconnect / Switch",
    payReceive: "Pay USDT, Receive GLUSD",
    pay: "Pay",
    receive: "Receive",
    balance: "Balance",
    swap: "Swap USDT to GLUSD",
    contractInfo: "Contract Info",
    fixedRate: "Fixed Rate",
    currentRate: "Current Rate",
    liquidity: "Contract GLUSD Liquidity",
    networkFee: "On-Chain Transaction Fee",
    swapFee: "Swap Fee",
    myHistory: "My History",
    recent: "Recent USDT – GLUSD Swaps",
    refresh: "Refresh",
    transaction: "Transaction",
    paid: "Paid",
    received: "Received",
    historyEmpty: "Connect wallet to view your recent swaps.",
    loading: "Loading swap data…",
    executing: "Transaction in progress",
    executingBody: "Confirm in your wallet and wait for Polygon confirmation.",
    brand: "GreatLoveMeta.com",
  },
  zh: {
    title: "USDT – GLUSD 固定兑换",
    description: "通过大爱 Polygon 链上合约将 USDT 兑换为 GLUSD。",
    wallet: "连接钱包",
    disconnect: "断开 / 更换钱包",
    payReceive: "支付 USDT，获得 GLUSD",
    pay: "支付",
    receive: "获得",
    balance: "余额",
    swap: "兑换 USDT 到 GLUSD",
    contractInfo: "合约信息",
    fixedRate: "固定兑换",
    currentRate: "当前汇率",
    liquidity: "合约 GLUSD 流动性",
    networkFee: "链上交易费",
    swapFee: "兑换手续费",
    myHistory: "我的记录",
    recent: "最近 USDT – GLUSD 兑换",
    refresh: "刷新",
    transaction: "交易",
    paid: "支付",
    received: "获得",
    historyEmpty: "连接钱包后查看你的最近兑换。",
    loading: "正在加载兑换数据…",
    executing: "交易执行中",
    executingBody: "请在钱包中确认，并等待 Polygon 确认。",
    brand: "大爱元宇宙",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = copy[lang === "zh" ? "zh" : "en"];
  return { title: t.title, description: t.description };
}

export default async function StableSwapPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = safeSiteLanguage(raw), contentLang = lang === "zh" ? "zh" : "en";
  const t = copy[contentLang];

  return <main className="local-swap-page">
    <SiteHeader lang={lang}/>
    <SwapAssetLoader tool="stable"/>
    <section className="gl-stableswap" id="stableswap-app" data-stableswap-app>
      <div className="swap-container">
        <div className="stable-stack">
          <section className="stable-panel">
            <div className="wallet-bar">
              <div>
                <p className="stable-kicker">{t.brand}</p>
                <h1 className="stable-title">{t.title}</h1>
                <p className="stable-muted">{t.description}</p>
              </div>
              <div className="wallet-actions">
                <div className="wallet-disconnected">
                  <button className="stable-button" type="button" data-connect-wallet>{t.wallet}</button>
                </div>
                <div className="wallet-connected">
                  <div className="wallet-summary">
                    <span className="stable-pill" data-wallet-address/>
                    <span className="stable-pill" data-pay-balance>0 USDT</span>
                    <span className="stable-pill" data-receive-balance>0 GLUSD</span>
                  </div>
                  <button className="stable-button secondary" type="button" data-disconnect-wallet>{t.disconnect}</button>
                </div>
              </div>
            </div>
          </section>

          <div className="stable-grid">
            <section className="stable-panel">
              <div className="stable-panel__head"><div><p className="stable-kicker">{lang === "zh" ? "兑换" : "Swap"}</p><h2 className="stable-title">{t.payReceive}</h2></div></div>
              <form className="stable-form">
                <div className="stable-token-field">
                  <div className="field-row"><span>{t.pay}</span><span>{t.balance} <strong data-pay-balance>0 USDT</strong></span></div>
                  <div className="amount-row"><input aria-label={`${t.pay} USDT`} data-pay-amount inputMode="decimal" autoComplete="off" placeholder="0.00"/><span className="token-badge">USDT</span></div>
                </div>
                <div className="stable-token-field">
                  <div className="field-row"><span>{t.receive}</span><span>{t.balance} <strong data-receive-balance>0 GLUSD</strong></span></div>
                  <div className="amount-row"><input aria-label={`${t.receive} GLUSD`} data-receive-amount readOnly placeholder="0.00"/><span className="token-badge">GLUSD</span></div>
                </div>
                <ul className="stable-checks" data-checks/>
                <button className="stable-button stable-submit" type="button" data-swap-button>{t.swap}</button>
              </form>
            </section>

            <section className="stable-panel">
              <div className="stable-panel__head"><div><p className="stable-kicker">{t.contractInfo}</p><h2 className="stable-title">{t.fixedRate}</h2></div></div>
              <div className="stable-stats">
                <div className="stable-stat"><div className="stable-label">{t.currentRate}</div><div className="stable-value" data-rate>1 USDT = 1 GLUSD</div></div>
                <div className="stable-stat"><div className="stable-label">{t.liquidity}</div><div className="stable-value" data-liquidity>0 GLUSD</div></div>
                <div className="stable-stat"><div className="stable-label">{t.networkFee}</div><div className="stable-value" data-tx-fee>0 POL</div></div>
                <div className="stable-stat"><div className="stable-label">{t.swapFee}</div><div className="stable-value" data-swap-fee>0%</div></div>
              </div>
            </section>
          </div>

          <section className="stable-panel">
            <div className="stable-panel__head"><div><p className="stable-kicker">{t.myHistory}</p><h2 className="stable-title">{t.recent}</h2></div><button className="stable-button secondary" type="button" data-refresh-history>{t.refresh}</button></div>
            <div className="table-wrap">
              <table className="stable-table"><thead><tr><th>{t.transaction}</th><th>{t.paid}</th><th>{t.received}</th></tr></thead><tbody data-history-body><tr><td colSpan={3} className="empty">{t.historyEmpty}</td></tr></tbody></table>
            </div>
          </section>

          <div className="stable-status" data-status>{t.loading}</div>
        </div>
      </div>
      <div className="execution-overlay" data-execution-overlay hidden>
        <div className="execution-card"><div className="spinner" aria-hidden="true"/><h3 className="stable-title">{t.executing}</h3><p className="stable-muted">{t.executingBody}</p></div>
      </div>
    </section>
    <SiteFooter lang={lang}/>
  </main>;
}
