import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { AiProviderPreference } from "../../../components/AiProviderPreference";
import { ProfileEditor } from "../../../components/ProfileEditor";
import { PasswordSettings } from "../../../components/PasswordSettings";
import { getDatabase, getSessionUser } from "../../../lib/auth";
import "../../profile-fixes.css";

export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") notFound();
  const incoming = await headers();
  const user = await getSessionUser(new Request("https://greatlovemeta.com", { headers: { cookie: incoming.get("cookie") || "" } }));
  if (!user) redirect(`/${lang}/auth/login?returnTo=/${lang}/account`);
  const zh = lang === "zh";
  const introducer = await getDatabase().prepare("SELECT owner.display_name AS displayName, r.status AS status FROM referrals r JOIN referral_codes rc ON rc.id = r.referral_code_id JOIN users owner ON owner.id = rc.user_id WHERE r.referred_user_id = ? LIMIT 1").bind(user.id).first<{ displayName: string; status: string }>();
  const avatar = await getDatabase().prepare("SELECT user_id AS userId FROM user_avatars WHERE user_id = ?").bind(user.id).first<{ userId: string }>();
  const wallet = await getDatabase().prepare("SELECT wallet_address AS walletAddress FROM users WHERE id = ?").bind(user.id).first<{ walletAddress: string | null }>();
  return <main className="account-settings-page"><SiteHeader lang={lang}/><section className="account-settings-main"><p className="section-kicker">{zh ? "账户与会员档案" : "ACCOUNT & MEMBER PROFILE"}</p><h1>{zh ? "管理您的大爱社区会员档案。" : "Shape your GreatLove ecosystem profile."}</h1><p className="account-settings-intro">{zh ? "更新头像、显示名称、钱包、介绍人与阅读偏好，并管理社区入口。" : "Update your photo, display name, wallet, introducer, and reading preferences, then manage your community access."}</p><ProfileEditor lang={lang} email={user.email} initialName={user.displayName} initialWalletAddress={wallet?.walletAddress ?? ""} initialIntroducer={introducer ?? null} initialImageUrl={avatar ? `/api/profile?avatar=${encodeURIComponent(user.id)}` : ""}/><div className="account-settings-grid account-secondary"><article><h2>{zh ? "身份与社区" : "Identity and community"}</h2><div className="account-settings-links"><Link href={`/${lang}/dashboard`}>{zh ? "打开会员面板" : "Open member dashboard"} →</Link><Link href={`/${lang}/messages`}>{zh ? "查看消息与实时聊天" : "Open messages and live chat"} →</Link><Link href={`/${lang}/community`}>{zh ? "进入大爱社区" : "Open GreatLove community"} →</Link></div></article><article><PasswordSettings lang={lang}/></article></div></section><AiProviderPreference/><SiteFooter lang={lang}/></main>;
}
