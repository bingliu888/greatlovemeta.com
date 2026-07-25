import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../components/SiteHeader";
import { SiteFooter } from "../../components/SiteFooter";

const content = {
  en: {
    metaTitle: "GreatLoveMeta.com — AI, RWA and Community",
    eyebrow: "Welcome to RWA · GreatLove Metaverse",
    title: <>Welcome to RWA.<br />GreatLove Metaverse.</>,
    lead: "AI + DeFi + SocialFi + GameFi in one bilingual ecosystem connecting community, blockchain, real-world assets, NFTs and practical digital experiences.",
    start: "Join password-free",
    video: "Watch video",
    videoUrl: "https://files.greatlovedao.com/storage/v1/object/public/videos/GreatLove_%28GLC%29_EN.mp4?loop=1",
    courseware: "Six-sector guide",
    coursewareUrl: "https://files.greatlovedao.com/storage/v1/object/public/docs/6featuresEN.pdf",
    markers: ["AI-powered", "RWA connected", "Community governed"],
    resourceKicker: "GreatLove resources",
    englishWhitepaper: "English whitepaper",
    englishWhitepaperMeta: "July 2026 · 11-page PDF",
    chineseWhitepaper: "中文白皮书",
    chineseWhitepaperMeta: "Chinese · 32-page PDF",
    communityLink: "Join Community",
    communityMeta: "Forum · Live Chat · Member discussions",
    appTitle: "Download GreatLove App",
    appBody: "Take the GreatLove ecosystem with you through the official Android or iOS release.",
    android: "Android APK",
    ios: "Download on the App Store",
    wechat: "Using WeChat? Open this page in your default browser before downloading.",
    daoKicker: "GreatLoveDAO program directory",
    daoTitle: "Every GreatLove section, organized in one place.",
    daoBody: "Explore the current GreatLoveDAO programs, asset initiatives and participation paths without leaving the GreatLoveMeta member experience.",
    daoActions: [
      ["Airdrop", "Claim GLC and complete the official wallet flow.", "Open airdrop", "https://www.greatlovedao.com/monopoly.html"],
      ["On-chain wallet count", "Verify the current GLC community-token holder activity on Polygon.", "View Polygon", "https://polygonscan.com/token/0x6aa3A471765e8a9884e0E6eDCB0F796Bf9f0B325"],
      ["GreatLove Angels", "Learn about the global GreatLove Angel participation program.", "Watch introduction", "https://files.greatlovedao.com/storage/v1/object/public/videos//GLCangel_en.mp4"],
    ],
    glcKicker: "GreatLove community token",
    glcTitle: "Claim 100M GLC",
    glcBody: "GreatLoveDAO presents the Xixia Kesi Buddhist banner as the GLC root asset and describes reward, transfer-burn and participation mechanics for its community token.",
    glcCta: "Read asset background",
    sourceNote: "Program terms, token figures, asset descriptions and reward claims in these sections originate from GreatLoveDAO. Verify current eligibility, smart contracts, provenance and risk before participating. This page is informational, not financial advice.",
    sectorsKicker: "Six major sectors",
    sectorsTitle: "The complete GreatLove participation map.",
    sectorsBody: "The six programs highlighted by GreatLoveDAO, translated into a clear path from discovery to participation.",
    sectors: [
      ["01", "Free GLC community tokens", "Explore the official claim process, main-wallet and sub-wallet activities."],
      ["02", "GreatLove Alliance membership", "Join the membership program and review the current referral and participation terms."],
      ["03", "AI Agent super nodes", "Learn about the GreatLove AI Agent super-node subscription program and its stated mechanics."],
      ["04", "RWA NFT collection", "Discover cultural-asset NFT editions, minting paths and collection experiences."],
      ["05", "Play-to-Earn games", "Join GreatLove game activities designed around points, tasks and community participation."],
      ["06", "GreatLove Super App", "Use the multilingual wallet, ecosystem services and integrated AI experiences on mobile."],
    ],
    accessKicker: "Community and On-chain Swap",
    accessTitle: "Join, discuss and move through the ecosystem.",
    accessBody: "Enter the GreatLoveMeta forum and Live Chat, or continue into GreatLoveDAO’s official swap tools.",
    accessCommunityTitle: "GreatLoveMeta Community",
    accessCommunityBody: "Join the forum, meet members and use group Live Chat.",
    accessCommunityCta: "Enter Community",
    swaps: [
      ["USDT → GLUSD", "Stable Swap", "Open the official fixed USDT–GLUSD swap.", "https://www.greatlovedao.com/stableswap_en.html"],
      ["GLUSD → GLC", "AutoSwap", "Open the official GLUSD–GLC order market.", "https://www.greatlovedao.com/autoswap_en.html"],
    ],
    rwaKicker: "RWA and NFT collection",
    rwaTitle: "Cultural assets and digital collection programs.",
    rwaBody: "Browse every RWA and NFT section presented on the GreatLoveDAO Chinese homepage.",
    rwaCards: [
      ["Lang Shining Eight Horses", "RWA digital collection NFT", "Explore the Eight Horses cultural collection.", "/greatlove-horses.png", "https://www.greatlovedao.com/nft_1_en.html"],
      ["GLAC GreatLove RWA Art Token", "On-chain cultural inheritance", "Review GLAC information and the current Uniswap route.", "/greatlove-membership.png", "https://app.uniswap.org/swap?chain=bnb&field=input&inputCurrency=0x55d398326f99059fF775485246999027B3197955&outputCurrency=0xc8343e16bB6D903DbE499927928c3434e0aBfDA2&value=100"],
      ["RWA Antique NFTs", "Use GLC for cultural-asset NFTs", "Open the official GreatLove NFT collection experience.", "/greatlove-rwa.gif", "https://greatlove.world/"],
      ["ezSwap cash-discount NFTs", "Use GLC for discount vouchers", "Continue to the official redemption experience.", "/greatlove-membership.png", "https://greatlove.world/"],
      ["GreatLove Professional Collection", "Curated RWA NFT series", "Browse the professional cultural collection.", "/greatlove-pro.gif", "https://greatlove.world/"],
    ],
    gamesKicker: "Play-to-Earn",
    gamesTitle: "GreatLove blockchain games.",
    gamesBody: "Explore task, sharing and point-based game activities from the GreatLove ecosystem.",
    gamesCta: "Open game",
    faqKicker: "Common questions",
    faqTitle: "GreatLove FAQ",
    faqItems: [
      ["What is the GreatLove Alliance?", "A platform described by GreatLoveDAO as combining AI, blockchain, RWA, NFTs, DeFi and community participation."],
      ["What is GLC?", "GreatLoveDAO describes a token system covering governance, community rewards, asset-linked functions and a GLUSD stablecoin."],
      ["How can community tokens be obtained?", "GreatLoveDAO lists tasks, App activities, referrals and game participation among the current paths."],
      ["What can GLC community tokens be used for?", "The source page lists vouchers, RWA NFTs, games, App services and staking-related activities."],
      ["Where can I manage GLC or NFTs?", "GreatLoveDAO directs users to the GreatLove Super App wallet and asset center."],
      ["Where can I talk with the community?", "Use GreatLoveMeta Community for forum discussions, member connections and Live Chat."],
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
    eyebrow: "欢迎光临 RWA · 大爱元宇宙",
    title: <>欢迎光临 RWA，<br />欢迎来到大爱元宇宙。</>,
    lead: "AI + DeFi + SocialFi + GameFi，在中英双语生态中连接社区、区块链、现实资产、NFT 与实用数字体验。",
    start: "免密码加入",
    video: "观看视频",
    videoUrl: "https://files.greatlovedao.com/storage/v1/object/public/videos/GreatLove_Metaverse-CN.mp4?loop=1",
    courseware: "六大板块课件",
    coursewareUrl: "https://files.greatlovedao.com/storage/v1/object/public/docs//6featuresCN.pdf",
    markers: ["AI 智能驱动", "连接现实资产", "社区共同治理"],
    resourceKicker: "大爱资源中心",
    englishWhitepaper: "下载英文白皮书",
    englishWhitepaperMeta: "2026 年 7 月 · 11 页 PDF",
    chineseWhitepaper: "下载中文白皮书",
    chineseWhitepaperMeta: "中文 · 32 页 PDF",
    communityLink: "加入社区",
    communityMeta: "论坛 · Live Chat · 会员交流",
    appTitle: "下载 GreatLove App",
    appBody: "通过官方 Android 或 iOS 版本，在手机上继续使用大爱生态。",
    android: "Android APK 下载",
    ios: "App Store 下载",
    wechat: "如果正在微信中访问，请先从右上角选择“在默认浏览器打开”。",
    daoKicker: "GreatLoveDAO 全部板块",
    daoTitle: "所有大爱板块，在一个首页清楚呈现。",
    daoBody: "在 GreatLoveMeta 会员体验中浏览 GreatLoveDAO 当前的项目、资产计划与参与路径。",
    daoActions: [
      ["领取空投", "领取 GLC，并完成官方钱包流程。", "打开空投", "https://www.greatlovedao.com/monopoly.html"],
      ["链上钱包量", "前往 Polygon 核对当前大爱社区币持币活动。", "查看 Polygon", "https://polygonscan.com/token/0x6aa3A471765e8a9884e0E6eDCB0F796Bf9f0B325"],
      ["大爱元宇宙天使", "了解全球大爱元宇宙天使参与计划。", "观看介绍", "https://files.greatlovedao.com/storage/v1/object/public/videos//GLCangel_en.mp4"],
    ],
    glcKicker: "大爱社区币",
    glcTitle: "领取 1 亿大爱社区币 $GLC",
    glcBody: "GreatLoveDAO 将西夏缂丝佛幡介绍为 GLC 的根资产，并说明了大爱社区币的奖励、转账燃烧与社区参与机制。",
    glcCta: "了解根资产背景",
    sourceNote: "本页这些板块中的项目条款、代币数据、资产描述与奖励说法均来自 GreatLoveDAO。参与前请核对最新资格、智能合约、资产溯源与风险。本页仅作信息展示，不构成财务建议。",
    sectorsKicker: "六大板块简介",
    sectorsTitle: "完整的大爱参与地图。",
    sectorsBody: "把 GreatLoveDAO 强调的六大板块整理为从了解、加入到参与的清晰路径。",
    sectors: [
      ["01", "免费领取大爱社区币", "了解官方领取流程、主钱包与子钱包活动。"],
      ["02", "加入大爱元宇宙联盟会员", "进入会员计划，并查看当前推荐与参与条款。"],
      ["03", "大爱 AI 智能体超级节点", "了解大爱 AI 智能体超级节点订阅计划及其说明机制。"],
      ["04", "铸造 RWA NFT 收藏与收益", "发现文化资产 NFT、铸造路径和收藏体验。"],
      ["05", "边玩边赚的大爱链游", "参与围绕积分、任务和社区互动设计的游戏活动。"],
      ["06", "下载大爱元宇宙超级 App", "在手机上使用多语言钱包、生态服务与 AI 体验。"],
    ],
    accessKicker: "社区与链上入口",
    accessTitle: "加入、讨论，并继续进入大爱生态。",
    accessBody: "进入 GreatLoveMeta 论坛和 Live Chat，或继续使用 GreatLoveDAO 官方兑换工具。",
    accessCommunityTitle: "GreatLoveMeta 社区",
    accessCommunityBody: "加入论坛、认识会员，并使用群组 Live Chat。",
    accessCommunityCta: "进入社区",
    swaps: [
      ["USDT → GLUSD", "稳定兑换", "打开官方 USDT–GLUSD 固定兑换。", "https://www.greatlovedao.com/stableswap.html"],
      ["GLUSD → GLC", "AutoSwap", "打开官方 GLUSD–GLC 订单市场。", "https://www.greatlovedao.com/autoswap.html"],
    ],
    rwaKicker: "RWA 与 NFT 收藏",
    rwaTitle: "文化资产与数字收藏计划。",
    rwaBody: "完整呈现 GreatLoveDAO 中文首页中的各个 RWA 与 NFT 板块。",
    rwaCards: [
      ["郎世宁八骏图", "RWA 数字藏品 NFT", "探索八骏图文化数字收藏。", "/greatlove-horses.png", "https://www.greatlovedao.com/nft_1.html"],
      ["GLAC 大爱 RWA 艺术币", "链上赋能 · 文化传承", "查看 GLAC 信息与当前 Uniswap 入口。", "/greatlove-membership.png", "https://app.uniswap.org/swap?chain=bnb&field=input&inputCurrency=0x55d398326f99059fF775485246999027B3197955&outputCurrency=0xc8343e16bB6D903DbE499927928c3434e0aBfDA2&value=100"],
      ["RWA 古董 NFT", "使用 GLC 兑换文化资产 NFT", "进入官方大爱 NFT 收藏体验。", "/greatlove-rwa.gif", "https://greatlove.world/"],
      ["全球通 ezSwap 现金折扣券 NFT", "使用 GLC 兑换折扣券", "继续进入官方兑换体验。", "/greatlove-membership.png", "https://greatlove.world/"],
      ["大爱 NFT 系列专业收藏", "精选 RWA NFT 系列", "浏览专业文化数字收藏。", "/greatlove-pro.gif", "https://greatlove.world/"],
    ],
    gamesKicker: "边玩边赚",
    gamesTitle: "大爱区块链游戏。",
    gamesBody: "探索大爱生态中的任务、分享与积分游戏活动。",
    gamesCta: "打开游戏",
    faqKicker: "常见问题",
    faqTitle: "大爱 FAQ",
    faqItems: [
      ["什么是大爱联盟？", "GreatLoveDAO 将其介绍为融合 AI、区块链、RWA、NFT、DeFi 与社区参与的平台。"],
      ["什么是 GLC？", "GreatLoveDAO 描述的代币体系涵盖治理、社区奖励、资产功能与 GLUSD 稳定币。"],
      ["GLC 社区币怎么获得？", "来源页列出的方式包括任务、App 活动、推荐与游戏参与。"],
      ["GLC 社区币可以做什么？", "来源页列出了兑换券、RWA NFT、游戏、App 服务与质押相关活动。"],
      ["哪里查看和管理 GLC 或 NFT？", "GreatLoveDAO 指引用户前往 GreatLove Super App 钱包与资产中心。"],
      ["在哪里与社区交流？", "使用 GreatLoveMeta Community 参加论坛、连接会员和进入 Live Chat。"],
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
      <SiteHeader lang={lang}/>
      <section className="hero glm-welcome-hero" id="welcome" aria-labelledby="glm-welcome-title">
        <div className="hero-copy">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 id="glm-welcome-title">{t.title}</h1>
          <p className="hero-lead">{t.lead}</p>
          <div className="hero-actions"><Link className="primary-button" href={`/${lang}/auth/login`}>{t.start}<span>→</span></Link><a className="secondary-button" href={t.videoUrl}>{t.video}<span>▶</span></a><a className="text-link glm-explore-link" href={t.coursewareUrl}>{t.courseware}</a></div>
          <p className="glm-resource-kicker">{t.resourceKicker}</p>
          <div className="glm-hero-resources">
            <a href="/docs/GreatLove-RWA-Whitepaper-EN-2026-07-v9.pdf" download><small>{t.englishWhitepaperMeta}</small><b>{t.englishWhitepaper}</b><i aria-hidden="true">↓</i></a>
            <a href="/docs/GreatLove-RWA-Whitepaper-CN-v4.1.pdf" download><small>{t.chineseWhitepaperMeta}</small><b>{t.chineseWhitepaper}</b><i aria-hidden="true">↓</i></a>
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

    <section className="glm-dao-directory">
      <div className="section-heading"><p className="section-kicker">{t.daoKicker}</p><h2>{t.daoTitle}</h2><p>{t.daoBody}</p></div>
      <div className="glm-dao-actions">{t.daoActions.map(([title,body,cta,href]) => <article key={title}><span>GL</span><h3>{title}</h3><p>{body}</p><a href={href}>{cta} →</a></article>)}</div>
      <div className="glm-glc-callout"><img src="/greatlove-membership.png" alt="GreatLove GLC"/><div><p className="section-kicker">{t.glcKicker}</p><h2>{t.glcTitle}</h2><p>{t.glcBody}</p><a className="primary-button" href="https://www.greatlovedao.com/nft.html">{t.glcCta}<span>→</span></a></div></div>
      <p className="glm-source-note">{t.sourceNote}</p>
    </section>

    <section className="glm-sectors-section">
      <div className="section-heading light"><p className="section-kicker">{t.sectorsKicker}</p><h2>{t.sectorsTitle}</h2><p>{t.sectorsBody}</p></div>
      <div className="glm-sector-grid">{t.sectors.map(([number,title,body]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
    </section>

    <section className="glm-access-section">
      <div className="section-heading"><p className="section-kicker">{t.accessKicker}</p><h2>{t.accessTitle}</h2><p>{t.accessBody}</p></div>
      <div className="glm-access-grid">
        <Link className="glm-access-card featured" href={`/${lang}/community`}><small>COMMUNITY</small><h3>{t.accessCommunityTitle}</h3><p>{t.accessCommunityBody}</p><b>{t.accessCommunityCta} →</b></Link>
        {t.swaps.map(([tag,title,body,href]) => <a className="glm-access-card" href={href} key={tag}><small>{tag}</small><h3>{title}</h3><p>{body}</p><b>{lang === "zh" ? "打开工具" : "Open tool"} →</b></a>)}
      </div>
    </section>

    <section className="glm-rwa-section">
      <div className="section-heading"><p className="section-kicker">{t.rwaKicker}</p><h2>{t.rwaTitle}</h2><p>{t.rwaBody}</p></div>
      <div className="glm-rwa-grid">{t.rwaCards.map(([title,label,body,image,href], index) => <a className={index === 0 ? "featured" : ""} href={href} key={title}><img src={image} alt=""/><div><small>{label}</small><h3>{title}</h3><p>{body}</p><b>{lang === "zh" ? "了解更多" : "Learn more"} →</b></div></a>)}</div>
    </section>

    <section className="glm-games-faq">
      <div className="glm-game-panel"><p className="section-kicker">{t.gamesKicker}</p><h2>{t.gamesTitle}</h2><p>{t.gamesBody}</p><a className="primary-button" href={lang === "zh" ? "https://www.greatlovedao.com/tree.html" : "https://www.greatlovedao.com/tree_en.html"}>{t.gamesCta}<span>→</span></a></div>
      <div className="glm-faq-panel"><p className="section-kicker">{t.faqKicker}</p><h2>{t.faqTitle}</h2><div>{t.faqItems.map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></div>
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
