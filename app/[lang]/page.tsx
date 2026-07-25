import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../components/SiteHeader";
import { SiteFooter } from "../../components/SiteFooter";

const content = {
  en: {
    metaTitle: "GreatLoveMeta.com — AI, RWA and Community",
    announcement: "GreatLove AI Agent and RWA rewards are live.",
    readNews: "Read News",
    eyebrow: "Welcome to RWA · GreatLove Metaverse",
    title: <>Welcome to RWA.<br />GreatLove Metaverse.</>,
    lead: "AI + DeFi + SocialFi + GameFi in one bilingual ecosystem connecting community, blockchain, real-world assets, NFTs and practical digital experiences.",
    start: "Join password-free",
    markers: ["AI-powered", "RWA connected", "Community governed"],
    resourceKicker: "GreatLove resources",
    englishWhitepaper: "English whitepaper",
    englishWhitepaperMeta: "July 2026 · 11-page PDF",
    chineseWhitepaper: "中文白皮书",
    chineseWhitepaperMeta: "July 2026 · 10-page PDF",
    communityLink: "Join Community",
    communityMeta: "Forum · Live Chat · Member discussions",
    appTitle: "Download GreatLove App",
    appBody: "Take the GreatLove ecosystem with you through the official Android or iOS release.",
    android: "Android APK",
    ios: "Download on the App Store",
    wechat: "Using WeChat? Open this page in your default browser before downloading.",
    accessKicker: "GreatLove Membership",
    accessTitle: "Build to Win GreatLove Membership Community",
    accessBody: "Join the GreatLove membership community, meet members and build the ecosystem together.",
    accessCommunityTitle: "GreatLoveMeta Community",
    accessCommunityBody: "Join the forum, meet members and use group Live Chat.",
    accessCommunityCta: "Enter Community",
    officialCommunityTitle: "GreatLove Membership Community",
    officialCommunityBody: "Continue to the membership experience shown on the GreatLoveDAO homepage.",
    officialCommunityCta: "Join Now",
    swapKicker: "GreatLove exchange",
    swapTitle: "On-Chain Swap",
    swapBody: "Choose the fixed USDT–GLUSD exchange or use the automatic GLUSD–GLC order market.",
    swaps: [
      ["USDT → GLUSD", "Stable Swap", "Open the official fixed USDT–GLUSD swap.", "https://www.greatlovedao.com/stableswap_en.html"],
      ["GLUSD → GLC", "AutoSwap", "Open the official GLUSD–GLC order market.", "https://www.greatlovedao.com/autoswap_en.html"],
    ],
    rwaKicker: "RWA digital collections",
    rwaTitle: "GreatLove RWA and NFT Collections",
    rwaBody: "Explore the three collection areas that are visibly presented on the current GreatLoveDAO homepage.",
    rwaCards: [
      ["Lang Shining Eight Horses RWA Digital Collection NFT", "Eight Horses collection", "Explore the Eight Horses cultural digital collection.", "/greatlove-horses.png", "https://www.greatlovedao.com/nft11_en.html"],
      ["GreatLove RWA NFT Collection", "RWA and NFT collection", "Browse the RWA and NFT collection carousel presented on the homepage.", "/greatlove-rwa.gif", "https://www.greatlovedao.com/nft6_en.html"],
      ["GreatLove NFT Professional Collection", "Professional collection", "Browse the professional cultural digital collection series.", "/greatlove-pro.gif", "https://www.greatlovedao.com/nft_1_en.html"],
    ],
    partnersKicker: "Technical ecosystem",
    partnersTitle: "Technical Partners",
    partnersBody: "The source homepage closes with the technical-partner ecosystem supporting its blockchain, AI, RWA and application experiences.",
    partnerLabels: ["POLYGON", "BASE", "BNB CHAIN", "WEB3", "AI", "RWA", "NFT", "DEFI"],
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
    announcement: "大爱 AI Agent 与 RWA 奖励已上线。",
    readNews: "查看新闻",
    eyebrow: "欢迎光临 RWA · 大爱元宇宙",
    title: <>欢迎光临 RWA，<br />欢迎来到大爱元宇宙。</>,
    lead: "AI + DeFi + SocialFi + GameFi，在中英双语生态中连接社区、区块链、现实资产、NFT 与实用数字体验。",
    start: "免密码加入",
    markers: ["AI 智能驱动", "连接现实资产", "社区共同治理"],
    resourceKicker: "大爱资源中心",
    englishWhitepaper: "下载英文白皮书",
    englishWhitepaperMeta: "2026 年 7 月 · 11 页 PDF",
    chineseWhitepaper: "下载中文白皮书",
    chineseWhitepaperMeta: "2026 年 7 月 · 10 页 PDF",
    communityLink: "加入社区",
    communityMeta: "论坛 · Live Chat · 会员交流",
    appTitle: "下载 GreatLove App",
    appBody: "通过官方 Android 或 iOS 版本，在手机上继续使用大爱生态。",
    android: "Android APK 下载",
    ios: "App Store 下载",
    wechat: "如果正在微信中访问，请先从右上角选择“在默认浏览器打开”。",
    accessKicker: "大爱会员",
    accessTitle: "共建共赢的大爱社区",
    accessBody: "加入大爱会员社区、认识伙伴，一起参与大爱生态共建。",
    accessCommunityTitle: "GreatLoveMeta 社区",
    accessCommunityBody: "加入论坛、认识会员，并使用群组 Live Chat。",
    accessCommunityCta: "进入社区",
    officialCommunityTitle: "大爱会员社区",
    officialCommunityBody: "继续进入 GreatLoveDAO 首页展示的会员社区体验。",
    officialCommunityCta: "立即加入",
    swapKicker: "大爱兑换",
    swapTitle: "链上兑换",
    swapBody: "选择固定兑换 USDT - GLUSD，或使用自动挂单市场 GLUSD - GLC。",
    swaps: [
      ["USDT → GLUSD", "稳定兑换", "打开官方 USDT–GLUSD 固定兑换。", "https://www.greatlovedao.com/stableswap.html"],
      ["GLUSD → GLC", "AutoSwap", "打开官方 GLUSD–GLC 订单市场。", "https://www.greatlovedao.com/autoswap.html"],
    ],
    rwaKicker: "RWA 数字藏品",
    rwaTitle: "大爱 RWA 与 NFT 收藏",
    rwaBody: "浏览当前 GreatLoveDAO 首页实际展示的三组数字收藏内容。",
    rwaCards: [
      ["郎士宁八骏图 RWA数字藏品NFT", "八骏图数字收藏", "探索八骏图文化数字收藏。", "/greatlove-horses.png", "https://www.greatlovedao.com/nft11.html"],
      ["大爱 RWA NFT 收藏", "RWA 与 NFT 收藏", "浏览首页实际展示的 RWA 与 NFT 收藏轮播内容。", "/greatlove-rwa.gif", "https://www.greatlovedao.com/nft6.html"],
      ["大爱NFT系列专业收藏", "专业收藏", "浏览专业文化数字收藏系列。", "/greatlove-pro.gif", "https://www.greatlovedao.com/nft_1.html"],
    ],
    partnersKicker: "技术生态",
    partnersTitle: "技术合作伙伴",
    partnersBody: "来源首页以支持区块链、AI、RWA 与应用体验的技术合作生态作为结尾。",
    partnerLabels: ["POLYGON", "BASE", "BNB CHAIN", "WEB3", "AI", "RWA", "NFT", "DEFI"],
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
      <a className="glm-source-announcement" href={lang === "zh" ? "https://www.greatlovedao.com/index.html" : "https://www.greatlovedao.com/index_en.html"}><span>{t.announcement}</span><b>{t.readNews} →</b></a>
      <SiteHeader lang={lang}/>
      <section className="hero glm-welcome-hero" id="welcome" aria-labelledby="glm-welcome-title">
        <div className="hero-copy">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 id="glm-welcome-title">{t.title}</h1>
          <p className="hero-lead">{t.lead}</p>
          <div className="hero-actions"><Link className="primary-button" href={`/${lang}/auth/login`}>{t.start}<span>→</span></Link></div>
          <p className="glm-resource-kicker">{t.resourceKicker}</p>
          <div className="glm-hero-resources">
            <a href="/docs/GreatLove-RWA-Whitepaper-EN-2026-07-v9.pdf" download><small>{t.englishWhitepaperMeta}</small><b>{t.englishWhitepaper}</b><i aria-hidden="true">↓</i></a>
            <a href="/docs/GreatLove-RWA-Whitepaper-CN-2026-07-v9.pdf" download><small>{t.chineseWhitepaperMeta}</small><b>{t.chineseWhitepaper}</b><i aria-hidden="true">↓</i></a>
            <Link href={`/${lang}/community`}><small>{t.communityMeta}</small><b>{t.communityLink}</b><i aria-hidden="true">→</i></Link>
          </div>
          <div className="trust-row">{t.markers.map((item, index) => <div key={item}><span>{["AI", "RWA", "DAO"][index]}</span>{item}</div>)}</div>
        </div>
        <div className="glm-welcome-side">
          <img src="/greatlove-app-preview.png" alt="" aria-hidden="true"/>
          <div className="glm-hero-app">
            <p className="section-kicker">{t.appTitle}</p>
            <h2>{t.appTitle}</h2>
            <p>{t.appBody}</p>
            <div className="glm-app-buttons"><a href="https://files.greatlovedao.com/storage/v1/object/public/apk/greatlove.apk"><span aria-hidden="true">◆</span>{t.android}</a><a href="https://apps.apple.com/app/greatlove-%E5%A4%A7%E7%88%B1/id6741927371"><span aria-hidden="true">●</span>{t.ios}</a></div>
            <small>{t.wechat}</small>
          </div>
        </div>
      </section>
    </div>

    <section className="glm-access-section">
      <div className="section-heading"><p className="section-kicker">{t.accessKicker}</p><h2>{t.accessTitle}</h2><p>{t.accessBody}</p></div>
      <div className="glm-access-grid">
        <Link className="glm-access-card featured" href={`/${lang}/community`}><small>COMMUNITY</small><h3>{t.accessCommunityTitle}</h3><p>{t.accessCommunityBody}</p><b>{t.accessCommunityCta} →</b></Link>
        <a className="glm-access-card" href={lang === "zh" ? "https://www.greatlovedao.com/index.html" : "https://www.greatlovedao.com/index_en.html"}><small>GREATLOVEDAO</small><h3>{t.officialCommunityTitle}</h3><p>{t.officialCommunityBody}</p><b>{t.officialCommunityCta} →</b></a>
      </div>
    </section>

    <section className="glm-access-section glm-swap-section">
      <div className="section-heading"><p className="section-kicker">{t.swapKicker}</p><h2>{t.swapTitle}</h2><p>{t.swapBody}</p></div>
      <div className="glm-access-grid glm-swap-grid">
        {t.swaps.map(([tag,title,body,href]) => <a className="glm-access-card" href={href} key={tag}><small>{tag}</small><h3>{title}</h3><p>{body}</p><b>{lang === "zh" ? "打开工具" : "Open tool"} →</b></a>)}
      </div>
    </section>

    <section className="glm-rwa-section">
      <div className="section-heading"><p className="section-kicker">{t.rwaKicker}</p><h2>{t.rwaTitle}</h2><p>{t.rwaBody}</p></div>
      <div className="glm-rwa-grid glm-rwa-visible">{t.rwaCards.map(([title,label,body,image,href]) => <a href={href} key={title}><img src={image} alt=""/><div><small>{label}</small><h3>{title}</h3><p>{body}</p><b>{lang === "zh" ? "了解更多" : "Learn more"} →</b></div></a>)}</div>
    </section>

    <section className="glm-partners-section"><div><p className="section-kicker">{t.partnersKicker}</p><h2>{t.partnersTitle}</h2><p>{t.partnersBody}</p></div><div className="glm-partner-grid">{t.partnerLabels.map((partner) => <span key={partner}>{partner}</span>)}</div></section>

    <section className="intro-section" id="ecosystem"><div className="section-heading"><p className="section-kicker">{t.introKicker}</p><h2>{t.introTitle}</h2><p>{t.introBody}</p></div><div className="feature-grid">{t.features.map(([number,title,body]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p><div className="card-glyph gc-card-glyph" aria-hidden="true">∞</div></article>)}</div></section>

    <section className="rules-section"><div className="section-heading light"><p className="section-kicker">{t.pathKicker}</p><h2>{t.pathTitle}</h2></div><div className="step-list">{t.steps.map(([title,body],index) => <article key={title}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div></section>

    <section className="members-home-section"><div className="members-home-card"><div><p className="section-kicker">{t.membersKicker}</p><h2>{t.membersTitle}</h2><p>{t.membersBody}</p><Link className="primary-button" href={`/${lang}/members`}>{t.membersCta}<span>→</span></Link></div><div className="members-home-visual" aria-hidden="true"><span>AI</span><span>RWA</span><span>GLC</span><span>∞</span></div></div></section>

    <section className="glm-ecosystem"><div><p className="section-kicker">{t.ecosystemKicker}</p><h2>{t.ecosystemTitle}</h2><p>{t.ecosystemBody}</p></div><div className="glm-app-grid"><a href="https://bingacademy.com"><b>BingAcademy</b><span>AI learning →</span></a><a href="https://myclaw.one"><b>MyClaw</b><span>AI Agent OS →</span></a><a href="https://whatsreal.com"><b>WhatsReal</b><span>Collective insight →</span></a><a href="https://www.greatlovedao.com"><b>GreatLoveDAO</b><span>RWA ecosystem →</span></a></div></section>

    <section className="community-section"><div className="community-card"><div><p className="section-kicker">{t.communityKicker}</p><h2>{t.communityTitle}</h2><p>{t.communityBody}</p><Link className="primary-button" href={`/${lang}/community`}>{t.communityCta}<span>→</span></Link></div><div className="four-seats gc-network" aria-hidden="true"><span>MEMBERS</span><span>GURU</span><strong>YOU</strong><span>CHAT</span><span>BUILD</span></div></div></section>
    <SiteFooter lang={lang}/>
  </main>;
}
