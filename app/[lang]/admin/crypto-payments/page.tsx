import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SiteFooter } from "../../../../components/SiteFooter";
import { SiteHeader } from "../../../../components/SiteHeader";
import { SmartPayAdminConsole } from "../../../../components/SmartPayAdminConsole";
import { getDatabase, getSessionUser } from "../../../../lib/auth";
import { allCryptoPaymentSettings } from "../../../../lib/crypto-payments";
import { isSiteLanguage } from "../../../../lib/site-locale";

export const dynamic = "force-dynamic";

export default async function CryptoPaymentsAdminPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) notFound();
  const incoming = await headers();
  const user = await getSessionUser(new Request("https://greatlovemeta.com", { headers: { cookie: incoming.get("cookie") || "" } }));
  if (!user) redirect(`/${lang}/auth/login?returnTo=/${lang}/admin/crypto-payments`);
  if (user.email.trim().toLowerCase() !== "bingliu@cybeye.com") redirect(`/${lang}/dashboard`);
  const [settings, wallet] = await Promise.all([
    allCryptoPaymentSettings(),
    getDatabase().prepare("SELECT wallet_address AS wallet FROM users WHERE id=? LIMIT 1")
      .bind(user.id).first<{ wallet: string | null }>()
  ]);
  const zh = lang === "zh";
  return <main className="dashboard-page smartpay-admin-page">
    <SiteHeader lang={lang}/>
    <section className="account-settings-main">
      <p className="section-kicker">SMARTPAY3 CONTROL</p>
      <h1>{zh ? "加密货币付款" : "Crypto payments"}</h1>
      <p className="account-settings-intro">{zh ? "验证并保存合约，连接 TP 或其他 EVM 钱包，然后安全管理 Owner、W1–W5、提款、付款规则、测试付款和订阅核对。" : "Verify and save a contract, connect TP or another EVM wallet, then manage Owner, W1-W5, withdrawals, payment rules, test payments, and subscription reconciliation."}</p>
      <SmartPayAdminConsole initialSettings={settings} locale={lang} defaultWallet={wallet?.wallet || ""}/>
    </section>
    <SiteFooter lang={lang}/>
  </main>;
}
