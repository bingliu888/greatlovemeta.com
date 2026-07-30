import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../../../components/SiteFooter";
import { SiteHeader } from "../../../../components/SiteHeader";
import { SwapAssetLoader } from "../../../../components/SwapAssetLoader";

const copy = {
  en: {
    title: "GreatLove AutoSwap", wallet: "Wallet", network: "Loading network", notConnected: "Not connected", connectHint: "Connect wallet to trade", connect: "Connect Wallet", connected: "Connected wallet", switch: "Switch", disconnect: "Disconnect",
    swap: "Swap", buy: "Buy GLC", sell: "Sell GLC", baseAmount: "GLC to buy", quoteAmount: "GLUSD to pay", balance: "Balance", orderPrice: "Order price", priceHint: "Enter GLC and GLUSD amounts to calculate price.", checks: "Enter amounts to check price range, minimum step, and wallet balance.", connectFirst: "Connect wallet first",
    market: "Market", marketTitle: "GLC Market Info", refreshMarket: "Refresh Market", bestBid: "Best Buy Price", bestAsk: "Best Sell Price", lastPrice: "Last price", range: "Allowed price range", minBuy: "Minimum buy", minSell: "Minimum sell", maxBuy: "Maximum buy", maxSell: "Maximum sell", minStep: "Minimum GLC step",
    myWallet: "My Wallet", myOrders: "My GLC Orders", refreshMyOrders: "Refresh My Orders", myOrdersEmpty: "Connect wallet to view your active orders.", myHistory: "My Recent Transactions", refreshMyHistory: "Refresh My Transactions", myHistoryEmpty: "Connect wallet to view your recent transactions.",
    openOrders: "Open Orders", activeOrders: "Active GLC Orders", refreshOrders: "Refresh Orders", ordersLoading: "Loading active orders.", history: "History", recent: "Recent Market Transactions", refreshHistory: "Refresh History", historyLoading: "Loading recent transactions.", loading: "Loading on-chain market data.",
    side: "Side", orderId: "Order ID", price: "Price", remaining: "GLC Remaining", value: "GLUSD Value", action: "Action", maker: "Maker", transaction: "Transaction", activity: "Activity", summary: "Summary", executing: "Transaction in progress", executingBody: "Confirm in your wallet and wait for on-chain confirmation.",
  },
  zh: {
    title: "大爱元宇宙自动兑换", wallet: "钱包", network: "加载网络", notConnected: "未连接", connectHint: "连接钱包后开始交易", connect: "连接钱包", connected: "已连接钱包", switch: "切换", disconnect: "断开",
    swap: "兑换", buy: "买入 GLC", sell: "卖出 GLC", baseAmount: "买入 GLC 数量", quoteAmount: "支付 GLUSD 数量", balance: "余额", orderPrice: "订单价格", priceHint: "输入 GLC 和 GLUSD 数量后计算价格。", checks: "输入数量后会自动检查价格范围、最小单位和余额。", connectFirst: "请先连接钱包",
    market: "市场", marketTitle: "GLC 市场信息", refreshMarket: "刷新市场", bestBid: "最高买价", bestAsk: "最低卖价", lastPrice: "最新成交价", range: "允许价格范围", minBuy: "最低买入额", minSell: "最低卖出额", maxBuy: "最高买入额", maxSell: "最高卖出额", minStep: "最小 GLC 单位",
    myWallet: "我的钱包", myOrders: "我的 GLC 挂单", refreshMyOrders: "刷新我的挂单", myOrdersEmpty: "连接钱包后查看你的当前挂单。", myHistory: "我的最近交易", refreshMyHistory: "刷新我的交易", myHistoryEmpty: "连接钱包后查看你的最近交易。",
    openOrders: "挂单", activeOrders: "当前 GLC 挂单", refreshOrders: "刷新挂单", ordersLoading: "正在加载挂单。", history: "历史", recent: "市场最近交易", refreshHistory: "刷新历史", historyLoading: "正在加载最近交易。", loading: "正在加载链上市场数据。",
    side: "方向", orderId: "订单号", price: "价格", remaining: "剩余 GLC", value: "GLUSD 金额", action: "操作", maker: "挂单钱包", transaction: "交易", activity: "类型", summary: "摘要", executing: "交易执行中", executingBody: "请在钱包中确认，并等待链上确认。",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const title = lang === "zh" ? "GLUSD – GLC 自动兑换" : "GLUSD – GLC AutoSwap";
  return { title, description: lang === "zh" ? "大爱元宇宙链上自动兑换订单市场。" : "The GreatLoveMeta on-chain AutoSwap order market." };
}

function OrdersTable({ t, mine = false }: { t: typeof copy.en; mine?: boolean }) {
  return <table className="swap-table"><thead><tr><th>{t.side}</th><th>{t.orderId}</th><th>{t.price}</th><th>{t.remaining}</th><th>{t.value}</th>{!mine && <th>{t.maker}</th>}<th>{t.action}</th></tr></thead><tbody {...(mine ? { "data-my-orders-body": true } : { "data-orders-body": true })}><tr><td colSpan={mine ? 6 : 7}>{mine ? t.myOrdersEmpty : t.ordersLoading}</td></tr></tbody></table>;
}

function HistoryTable({ t, mine = false }: { t: typeof copy.en; mine?: boolean }) {
  return <table className="swap-table"><thead><tr><th>{t.transaction}</th><th>{t.activity}</th><th>{t.summary}</th></tr></thead><tbody {...(mine ? { "data-my-history-body": true } : { "data-history-body": true })}><tr><td colSpan={3}>{mine ? t.myHistoryEmpty : t.historyLoading}</td></tr></tbody></table>;
}

export default async function AutoSwapPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") notFound();
  const t = copy[lang];

  return <main className="local-swap-page">
    <SiteHeader lang={lang}/>
    <SwapAssetLoader tool="auto"/>
    <section className="gl-autoswap" id="autoswap-app" data-autoswap-app>
      <div className="swap-container">
        <div className="swap-stack">
          <section className="swap-panel">
            <div className="swap-panel__head"><div><p className="swap-kicker">{t.wallet}</p><h1 className="swap-panel__title">{t.title}</h1></div><span className="swap-pill" data-network-label>{t.network}</span></div>
            <div className="wallet-bar">
              <div className="wallet-disconnected"><div className="wallet-summary"><span className="swap-pill">{t.notConnected}</span><span className="swap-value">{t.connectHint}</span></div><div className="wallet-actions"><button className="swap-button compact" type="button" data-wallet-method="onboard">{t.connect}</button></div></div>
              <div className="wallet-connected"><div><div className="swap-label">{t.connected}</div><div className="wallet-address" data-wallet-address>-</div></div><div className="wallet-summary"><span className="swap-pill"><span data-base-symbol>GLC</span>: <span data-wallet-base-balance>-</span></span><span className="swap-pill"><span data-quote-symbol>GLUSD</span>: <span data-wallet-quote-balance>-</span></span><button className="swap-button compact secondary" type="button" data-switch-wallet>{t.switch}</button><button className="swap-button compact secondary" type="button" data-disconnect-wallet>{t.disconnect}</button></div></div>
            </div>
          </section>

          <div className="swap-shell">
            <section className="swap-panel">
              <div className="swap-panel__head"><div><p className="swap-kicker">{t.swap}</p><h2 className="swap-panel__title" data-order-title>{t.buy}</h2></div><span className="swap-pill" data-pair-label>GLC / GLUSD</span></div>
              <form className="swap-form" data-order-form>
                <div className="swap-tabs"><button className="swap-tab active" type="button" data-side="buy">{t.buy}</button><button className="swap-tab" type="button" data-side="sell">{t.sell}</button></div>
                <div className="swap-field"><label htmlFor="swap-base-amount"><span data-base-field-label>{t.baseAmount}</span><span>{t.balance}: <span data-wallet-base-balance>-</span> <span data-base-symbol>GLC</span></span></label><input id="swap-base-amount" name="baseAmount" inputMode="decimal" autoComplete="off" placeholder="0.0"/></div>
                <div className="swap-field"><label htmlFor="swap-quote-amount"><span data-quote-field-label>{t.quoteAmount}</span><span>{t.balance}: <span data-wallet-quote-balance>-</span> <span data-quote-symbol>GLUSD</span></span></label><input id="swap-quote-amount" name="quoteAmount" inputMode="decimal" autoComplete="off" placeholder="0.0"/></div>
                <div className="price-preview"><strong>{t.orderPrice}</strong><span data-entered-price>{t.priceHint}</span></div>
                <div className="order-checks" data-order-checks><div className="order-check">{t.checks}</div></div>
                <div className="swap-actions"><button className="swap-button" type="submit" data-submit-order>{t.connectFirst}</button></div>
              </form>
            </section>

            <aside className="swap-panel">
              <div className="swap-panel__head"><div><p className="swap-kicker">{t.market}</p><h2 className="swap-panel__title">{t.marketTitle}</h2></div><button className="swap-button compact secondary" type="button" data-refresh-market>{t.refreshMarket}</button></div>
              <div className="swap-grid"><div className="swap-stat"><div className="swap-label">{t.bestBid}</div><div className="swap-value" data-best-bid>-</div></div><div className="swap-stat"><div className="swap-label">{t.bestAsk}</div><div className="swap-value" data-best-ask>-</div></div></div>
              <div className="market-limits"><div className="market-limit-row"><span>{t.lastPrice}</span><span data-last-price>-</span></div><div className="market-limit-row"><span>{t.range}</span><span data-price-range>-</span></div><div className="market-limit-row"><span>{t.minBuy}</span><span data-min-buy>-</span></div><div className="market-limit-row"><span>{t.minSell}</span><span data-min-sell>-</span></div><div className="market-limit-row"><span>{t.maxBuy}</span><span data-max-buy>-</span></div><div className="market-limit-row"><span>{t.maxSell}</span><span data-max-sell>-</span></div><div className="market-limit-row"><span>{t.minStep}</span><span data-min-base-unit>-</span></div></div>
            </aside>
          </div>

          <section className="swap-panel wallet-only"><div className="swap-panel__head"><div><p className="swap-kicker">{t.myWallet}</p><h2 className="swap-panel__title">{t.myOrders}</h2></div><button className="swap-button compact secondary" type="button" data-refresh-my-orders>{t.refreshMyOrders}</button></div><div className="swap-table-wrap"><OrdersTable t={t} mine/></div></section>
          <section className="swap-panel wallet-only"><div className="swap-panel__head"><div><p className="swap-kicker">{t.myWallet}</p><h2 className="swap-panel__title">{t.myHistory}</h2></div><button className="swap-button compact secondary" type="button" data-refresh-my-history>{t.refreshMyHistory}</button></div><div className="swap-table-wrap"><HistoryTable t={t} mine/></div></section>
          <section className="swap-panel"><div className="swap-panel__head"><div><p className="swap-kicker">{t.openOrders}</p><h2 className="swap-panel__title">{t.activeOrders}</h2></div><button className="swap-button compact secondary" type="button" data-refresh-open-orders>{t.refreshOrders}</button></div><div className="swap-table-wrap"><OrdersTable t={t}/></div></section>
          <section className="swap-panel"><div className="swap-panel__head"><div><p className="swap-kicker">{t.history}</p><h2 className="swap-panel__title">{t.recent}</h2></div><button className="swap-button compact secondary" type="button" data-refresh-history>{t.refreshHistory}</button></div><div className="swap-table-wrap"><HistoryTable t={t}/></div></section>
          <div className="swap-status" data-status>{t.loading}</div>
        </div>
      </div>
      <div className="swap-execution-overlay" data-execution-overlay hidden><div className="swap-execution-dialog" role="status" aria-live="assertive"><div className="swap-spinner"/><div><strong data-execution-title>{t.executing}</strong><p data-execution-message>{t.executingBody}</p></div></div></div>
    </section>
    <SiteFooter lang={lang}/>
  </main>;
}
