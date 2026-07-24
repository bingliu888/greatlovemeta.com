import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../components/SiteHeader";
import { SiteFooter } from "../../components/SiteFooter";

const content = {
  en: {
    metaTitle: "GreatLoveMeta.com — AI, RWA and Community",
    eyebrow: "Welcome to the GreatLove Metaverse",
    title: <>Real-world value.<br />A community-built future.</>,
    lead: "Explore a bilingual ecosystem where AI agents, blockchain, RWA, NFTs and community applications connect people with practical digital experiences.",
    start: "Join password-free",
    how: "Explore the ecosystem",
    markers: ["AI-powered", "RWA connected", "Community governed"],
    introKicker: "One connected ecosystem",
    introTitle: "AI, real-world assets and community belong in one clear experience.",
    introBody: "GreatLoveMeta.com brings the GreatLove ecosystem into a modern member hub—with simple email-code access, transparent project information, conversations and intelligent guidance.",
    features: [
      ["01", "AI agents for every member", "Ask Guru for ecosystem guidance, use live voice assistance, and connect with the broader MyClaw AI Agent OS vision."],
      ["02", "RWA and NFT discovery", "Learn how physical assets, digital certificates and blockchain records can connect while keeping claims, provenance and risk clearly separated."],
      ["03", "Community that can build", "Find members, exchange messages, open group live chats and turn shared ideas into visible ecosystem projects."],
    ],
    pathKicker: "The GreatLove path",
    pathTitle: "Discover, join, connect and build.",
    steps: [
      ["Discover", "Explore GreatLove RWA, AI, membership and application initiatives."],
      ["Join", "Create an account with an email verification code—no password to remember."],
      ["Connect", "Meet members through Community, direct messages and group Live Chat."],
      ["Build", "Follow projects, invite contributors and use Guru to move ideas forward."],
    ],
    membersKicker: "GreatLove members",
    membersTitle: "Meet pioneers, builders and community contributors.",
    membersBody: "Browse member profiles without exposing private email addresses, then connect through Community and Live Chat.",
    membersCta: "View members",
    ecosystemKicker: "Connected applications",
    ecosystemTitle: "One community, many ways to participate.",
    ecosystemBody: "Continue into learning with BingAcademy, AI agents with MyClaw, collective insight with WhatsReal, or the wider GreatLoveDAO ecosystem.",
    communityKicker: "Built for shared progress",
    communityTitle: "Community, Live Chat and Ask Guru—ready from day one.",
    communityBody: "Your account connects profile, member directory, Community discussions, private messages, live group conversations, referrals and bilingual AI assistance.",
    communityCta: "Enter Community",
  },
  zh: {
    metaTitle: "GreatLoveMeta.com — AI、RWA 与全球社区",
    eyebrow: "欢迎来到大爱元宇宙",
    title: <>现实价值连接，<br />社区共同建设。</>,
    lead: "在中英双语生态中连接 AI 智能体、区块链、RWA、NFT 与社区应用，让数字体验回到真实、清晰和可参与。",
    start: "免密码加入",
    how: "探索大爱生态",
    markers: ["AI 智能驱动", "连接现实资产", "社区共同治理"],
    introKicker: "一个相互连接的生态",
    introTitle: "把 AI、现实世界资产与社区放进一个清晰体验。",
    introBody: "GreatLoveMeta.com 以现代会员中心承载大爱生态：邮箱验证码轻松加入、透明了解项目、参与社区交流，并随时获得智能指导。",
    features: [
      ["01", "每位会员都可使用 AI 智能体", "向 Guru 了解生态信息、使用实时语音助手，并连接 MyClaw AI Agent OS 的智能体愿景。"],
      ["02", "发现 RWA 与 NFT", "了解实体资产、数字证书与区块链记录如何连接，同时清晰区分事实、溯源、权益和风险。"],
      ["03", "让社区真正共同建设", "发现会员、发送消息、建立群组 Live Chat，把共同想法推进为公开可见的生态项目。"],
    ],
    pathKicker: "大爱参与路径",
    pathTitle: "发现、加入、连接、共建。",
    steps: [
      ["发现", "探索大爱 RWA、AI、会员与应用生态。"],
      ["加入", "使用邮箱验证码创建账户，无需记住密码。"],
      ["连接", "通过社区、私信和群组 Live Chat 认识伙伴。"],
      ["共建", "关注项目、邀请贡献者，并使用 Guru 推进想法。"],
    ],
    membersKicker: "大爱社区会员",
    membersTitle: "认识先锋会员、生态建设者与社区贡献者。",
    membersBody: "浏览公开成员档案而不暴露私人邮箱，并通过社区与 Live Chat 建立连接。",
    membersCta: "查看会员",
    ecosystemKicker: "连接生态应用",
    ecosystemTitle: "一个社区，多种参与方式。",
    ecosystemBody: "通过 BingAcademy 参与 AI 学习、用 MyClaw 构建智能体、在 WhatsReal 汇聚集体判断，或继续探索 GreatLoveDAO 生态。",
    communityKicker: "为共同成长而建",
    communityTitle: "社区、Live Chat 与 Ask Guru，从第一天即可使用。",
    communityBody: "一个账号连接个人档案、会员目录、社区讨论、私信、群组实时交流、推荐奖励与中英双语 AI 助手。",
    communityCta: "进入社区",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const safeLang = lang === "zh" ? "zh" : "en";
  return { title: content[safeLang].metaTitle, alternates: { languages: { en: "/en", "zh-CN": "/zh" } } };
}

export default async function LanguageHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") notFound();
  const t = content[lang];
  return <main>
    <div className="hero-shell">
      <SiteHeader lang={lang}/>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="hero-lead">{t.lead}</p><div className="hero-actions"><Link className="primary-button" href={`/${lang}/auth/login`}>{t.start}<span>→</span></Link><a className="secondary-button" href="#ecosystem">{t.how}<span>↓</span></a></div><div className="trust-row">{t.markers.map((item, index) => <div key={item}><span>{["AI", "RWA", "DAO"][index]}</span>{item}</div>)}</div></div>
        <div className="hero-visual gc-globe glm-orbit" aria-label={lang === "zh" ? "大爱元宇宙生态网络" : "GreatLove Metaverse ecosystem network"}><div className="gc-orbit orbit-a"/><div className="gc-orbit orbit-b"/><div className="gc-world"><span>GL</span><i/><i/><i/><i/></div><div className="gc-signal signal-a">AI AGENT</div><div className="gc-signal signal-b">RWA</div><div className="gc-signal signal-c">COMMUNITY</div></div>
      </section>
    </div>

    <section className="intro-section" id="ecosystem"><div className="section-heading"><p className="section-kicker">{t.introKicker}</p><h2>{t.introTitle}</h2><p>{t.introBody}</p></div><div className="feature-grid">{t.features.map(([number,title,body]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p><div className="card-glyph gc-card-glyph" aria-hidden="true">∞</div></article>)}</div></section>

    <section className="rules-section"><div className="section-heading light"><p className="section-kicker">{t.pathKicker}</p><h2>{t.pathTitle}</h2></div><div className="step-list">{t.steps.map(([title,body],index) => <article key={title}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div></section>

    <section className="members-home-section"><div className="members-home-card"><div><p className="section-kicker">{t.membersKicker}</p><h2>{t.membersTitle}</h2><p>{t.membersBody}</p><Link className="primary-button" href={`/${lang}/members`}>{t.membersCta}<span>→</span></Link></div><div className="members-home-visual" aria-hidden="true"><span>AI</span><span>RWA</span><span>GLC</span><span>∞</span></div></div></section>

    <section className="glm-ecosystem"><div><p className="section-kicker">{t.ecosystemKicker}</p><h2>{t.ecosystemTitle}</h2><p>{t.ecosystemBody}</p></div><div className="glm-app-grid"><a href="https://bingacademy.com"><b>BingAcademy</b><span>AI learning →</span></a><a href="https://myclaw.one"><b>MyClaw</b><span>AI Agent OS →</span></a><a href="https://whatsreal.com"><b>WhatsReal</b><span>Collective insight →</span></a><a href="https://www.greatlovedao.com"><b>GreatLoveDAO</b><span>RWA ecosystem →</span></a></div></section>

    <section className="community-section"><div className="community-card"><div><p className="section-kicker">{t.communityKicker}</p><h2>{t.communityTitle}</h2><p>{t.communityBody}</p><Link className="primary-button" href={`/${lang}/community`}>{t.communityCta}<span>→</span></Link></div><div className="four-seats gc-network" aria-hidden="true"><span>MEMBERS</span><span>GURU</span><strong>YOU</strong><span>CHAT</span><span>BUILD</span></div></div></section>
    <SiteFooter lang={lang}/>
  </main>;
}
