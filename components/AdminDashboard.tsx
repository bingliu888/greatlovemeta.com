import type { SessionUser } from "../lib/auth";
import { getDatabase } from "../lib/auth";
import type { SiteLanguage } from "../lib/site-locale";

async function count(sql: string) {
  return (await getDatabase().prepare(sql).first<{ count: number }>())?.count ?? 0;
}

export async function AdminDashboard({ lang, user }: { lang: SiteLanguage; user: SessionUser }) {
  const [members, subscribers, admins] = await Promise.all([
    count("SELECT COUNT(*) AS count FROM users"),
    count("SELECT COUNT(*) AS count FROM subscriptions WHERE status='active'"),
    count("SELECT COUNT(*) AS count FROM platform_user_roles WHERE role='admin'")
  ]);
  const zh = lang === "zh";
  return <div className="admin-shell">
    <header className="admin-hero"><p>{zh ? "大爱元宇宙管理中心" : "GREATLOVEMETA ADMIN"}</p><h1>{zh ? `欢迎，${user.displayName}` : `Welcome, ${user.displayName}`}</h1><span>{zh ? "管理会员、订阅、付款与站点运营。" : "Manage members, subscriptions, payments, and site operations."}</span></header>
    <section className="admin-cards">
      <article><p>{zh ? "会员" : "Members"}</p><strong>{members}</strong><span>{subscribers} {zh ? "位有效订阅会员" : "active subscribers"}</span><a href={`/${lang}/admin/members?tab=recent`}>{zh ? "管理会员" : "Manage members"} →</a></article>
      <article><p>{zh ? "教师" : "Hosts"}</p><strong>{admins}</strong><span>{zh ? "服务器验证的管理角色" : "server-verified admin roles"}</span><a href={`/${lang}/admin/members?tab=subscribers`}>{zh ? "订阅会员" : "Subscribers"} →</a></article>
      <article><p>{zh ? "加密货币付款" : "Crypto payments"}</p><strong>SmartPay3</strong><span>{zh ? "管理付款通道、合约与交易核对" : "Manage rails, contracts, and reconciliation"}</span><a href={`/${lang}/admin/crypto-payments`}>{zh ? "打开付款管理" : "Open payment administration"} →</a></article>
    </section>
    <nav className="admin-links"><a href={`/${lang}/project`}>{zh ? "项目" : "Project"}</a><a href={`/${lang}/community`}>{zh ? "社区" : "Community"}</a><a href={`/${lang}/messages`}>{zh ? "消息" : "Messages"}</a></nav>
  </div>;
}
