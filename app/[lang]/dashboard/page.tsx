import { headers } from "next/headers";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { LogoutButton } from "../../../components/LogoutButton";
import { GameDailyLog } from "../../../components/GameDailyLog";
import { MembershipPanel } from "../../../components/MembershipPanel";
import { TextSizeControl } from "../../../components/TextSizeControl";
import { getSessionUser } from "../../../lib/auth";
import { isAdminUser } from "../../../lib/admin-access";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import "./dashboard-tuneup.css";

export const dynamic = "force-dynamic";

const copy = {
  en: {
    welcome: "Welcome to your citizen dashboard",
    subtitle: "Manage your identity, community connections, and collaborative action from one place.",
    progress: "Profile progress",
    level: "GreatLove Meta · Getting started",
    next: "Complete your citizen profile",
    nextBody: "Add your photo, display name, introduction, interests, and preferred language.",
    action: "Open profile",
    account: "Account",
    language: "Interface language",
    signOut: "Sign out",
    coming: "Citizen credentials are coming next",
    comingBody: "Your account is ready for Community, messages, Live Chat, referrals, Ask Guru, and transparent citizen projects.",
    audioTitle: "Live Audio AI Chat",
    audioBody: "Open Ask Guru, tap the microphone, and speak to turn your question into text before sending.",
  },
  zh: {
    welcome: "欢迎进入您的数字公民面板",
    subtitle: "从这里统一管理身份、社区连接与共建行动。",
    progress: "档案完成进度",
    level: "全球公民 · 开始使用",
    next: "完善您的公民档案",
    nextBody: "添加头像、显示名称、个人介绍、关注领域与首选语言。",
    action: "打开档案",
    account: "账户",
    language: "界面语言",
    signOut: "退出登录",
    coming: "数字公民凭证即将推出",
    comingBody: "您的账号已经可以使用社区、消息、实时聊天、推荐、智能助手与透明共建项目。",
    audioTitle: "实时语音 AI 对话",
    audioBody: "打开智能助手，点击麦克风并直接说话，确认转换后的文字再发送。",
  },
};

export default async function Dashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") notFound();
  const requestHeaders = await headers();
  const user = await getSessionUser(new Request("https://greatlovemeta.com", { headers: { cookie: requestHeaders.get("cookie") ?? "" } }));
  if (!user) redirect(`/${lang}/auth/login`);
  const t = copy[lang];
  const canCreateClasses=await isAdminUser(user);
  return (
    <main className="dashboard-page">
      <SiteHeader lang={lang} />
      <div className="dashboard-wrap">
        <div className="dashboard-title"><p className="section-kicker">{t.level}</p><h1>{t.welcome}, {user.displayName}.</h1><p>{t.subtitle}</p></div>
        {canCreateClasses && <Link className="dashboard-classes-link" href={`/${lang}/classes`}>{lang === "zh" ? "我的课程" : "My Classes"}<span>→</span></Link>}
        <section className="dashboard-audio-panel" aria-labelledby="dashboard-audio-title">
          <div><p className="section-kicker">{lang === "zh" ? "语音快捷入口" : "VOICE SHORTCUT"}</p><h2 id="dashboard-audio-title">{t.audioTitle}</h2><p>{t.audioBody}</p></div>
          <Link className="dashboard-audio-button" href={`/${lang}/assistant`}>{t.audioTitle}<span aria-hidden="true">→</span></Link>
        </section>
        <MembershipPanel lang={lang} />
        <GameDailyLog lang={lang} compact />
        <div className="dashboard-grid">
          <section className="progress-card"><div className="card-top"><span>{t.progress}</span><strong>20%</strong></div><div className="progress-track"><i style={{ width: "20%" }} /></div><div className="lesson-preview"><span>ID</span><div><h2>{t.next}</h2><p>{t.nextBody}</p><a className="primary-button" href={`/${lang}/account`}>{t.action} <span>→</span></a></div></div></section>
          <aside className="account-card" id="account"><h2>{t.account}</h2><dl><div><dt>{lang === "zh" ? "邮箱" : "Email"}</dt><dd>{user.email}</dd></div><div><dt>{t.language}</dt><dd>{lang === "zh" ? "中文" : "English"}</dd></div></dl><TextSizeControl lang={lang} /><LogoutButton lang={lang} label={t.signOut} /></aside>
          <section className="coming-card"><div className="mini-table gc-mini-network" aria-hidden="true"><span>ID</span><span>∞</span><i>GC</i><span>AI</span><span>WE</span></div><div><p className="section-kicker">{lang === "zh" ? "即将推出" : "COMING NEXT"}</p><h2>{t.coming}</h2><p>{t.comingBody}</p></div></section>
        </div>
      </div>

      <SiteFooter lang={lang} />
    </main>
  );
}
