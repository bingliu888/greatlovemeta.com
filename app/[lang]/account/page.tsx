import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { AiProviderPreference } from "../../../components/AiProviderPreference";
import { ProfileEditor } from "../../../components/ProfileEditor";
import { PasswordSettings } from "../../../components/PasswordSettings";
import { SmartPayAccountLookup } from "../../../components/SmartPayAccountLookup";
import { getDatabase, getSessionUser } from "../../../lib/auth";
import { activeCryptoSettings } from "../../../lib/crypto-settings";
import { ensureRefId } from "../../../lib/ref-id";
import { isSiteLanguage } from "../../../lib/site-locale";
import "../../profile-fixes.css";

export const dynamic = "force-dynamic";

type SubscriptionRow = {
  cadence: string;
  status: string;
  currentPeriodEndsAt: number | null;
};

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) notFound();
  const incoming = await headers();
  const user = await getSessionUser(new Request("https://greatlovemeta.com", { headers: { cookie: incoming.get("cookie") || "" } }));
  if (!user) redirect(`/${lang}/auth/login?returnTo=/${lang}/account`);
  const zh = lang === "zh";
  const database = getDatabase();
  const [introducer, avatar, profile, subscription, settings, refId] = await Promise.all([
    database.prepare("SELECT owner.display_name AS displayName, r.status AS status FROM referrals r JOIN referral_codes rc ON rc.id = r.referral_code_id JOIN users owner ON owner.id = rc.user_id WHERE r.referred_user_id = ? LIMIT 1").bind(user.id).first<{ displayName: string; status: string }>(),
    database.prepare("SELECT user_id AS userId FROM user_avatars WHERE user_id = ?").bind(user.id).first<{ userId: string }>(),
    database.prepare("SELECT wallet_address AS walletAddress FROM users WHERE id=? LIMIT 1").bind(user.id).first<{ walletAddress: string | null }>(),
    database.prepare("SELECT cadence,status,current_period_ends_at AS currentPeriodEndsAt FROM subscriptions WHERE user_id=? LIMIT 1").bind(user.id).first<SubscriptionRow>(),
    activeCryptoSettings(),
    ensureRefId(user.id),
  ]);
  const wallet = profile?.walletAddress?.trim() || null;
  const activeUntil = subscription?.currentPeriodEndsAt
    ? new Date(subscription.currentPeriodEndsAt * 1000).toLocaleDateString(lang)
    : null;

  return <main className="account-settings-page">
    <SiteHeader lang={lang}/>
    <section className="account-settings-main">
      <p className="section-kicker">{zh ? "账户与会员档案" : "ACCOUNT & MEMBER PROFILE"}</p>
      <h1>{zh ? "管理您的大爱元宇宙会员档案。" : "Manage your GreatLoveMeta member profile."}</h1>
      <p className="account-settings-intro">{zh ? "更新头像、显示名称、RefID、付款钱包、介绍人与阅读偏好，并管理社区入口。" : "Update your photo, display name, RefID, payer wallet, introducer, reading preferences, and community access."}</p>
      {subscription ? <section className="account-subscription-summary" aria-label={zh ? "订阅状态" : "Subscription status"}>
        <strong>{zh ? "订阅状态" : "Subscription status"}</strong>
        <span>{subscription.cadence === "annual" ? (zh ? "12 个月订阅" : "12-month subscription") : (zh ? "1 个月订阅" : "1-month subscription")}</span>
        <small>{activeUntil ? <><span>{zh ? "有效至" : "Active through"}</span> {activeUntil}</> : (zh ? "等待生效日期" : "Activation date pending")}</small>
      </section> : null}
      <ProfileEditor lang={lang} email={user.email} initialName={user.displayName} refId={refId} initialWalletAddress={wallet || ""} initialIntroducer={introducer ?? null} initialImageUrl={avatar ? `/api/profile?avatar=${encodeURIComponent(user.id)}` : ""}/>
      <SmartPayAccountLookup settings={settings} locale={lang}/>
      <div className="account-settings-grid account-secondary"><article><h2>{zh ? "会员与社区" : "Membership and community"}</h2><div className="account-settings-links"><Link href={`/${lang}/dashboard`}>{zh ? "打开会员面板" : "Open member dashboard"} →</Link><Link href={`/${lang}/messages`}>{zh ? "查看消息与实时聊天" : "Open messages and live chat"} →</Link><Link href={`/${lang}/community`}>{zh ? "进入大爱元宇宙社区" : "Open the GreatLoveMeta community"} →</Link></div></article><article><PasswordSettings lang={lang}/></article></div>
    </section>
    <AiProviderPreference/>
    <SiteFooter lang={lang}/>
  </main>;
}
