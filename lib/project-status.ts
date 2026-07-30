export type ProjectTask = {
  id: string;
  date: string;
  status: "done" | "planned" | "blocked";
  progress: number;
  title: { zh: string; en: string };
  summary: { zh: string; en: string };
  category: { zh: string; en: string };
  owner: { zh: string; en: string };
};

export type ProjectBuild = {
  version: number;
  date: string;
  title: { zh: string; en: string };
  completed: { zh: string[]; en: string[] };
  testable: { zh: string[]; en: string[] };
  commit: string;
};

export const projectStats = { editionDate: "2026-07-28", today: 2, total: 18 };

export const projectBuilds: ProjectBuild[] = [
  {
    version: 1,
    date: "2026-07-22",
    title: { zh: "大爱元宇宙双语平台基础", en: "GreatLove Meta bilingual platform foundation" },
    completed: {
      zh: ["建立独立于掼蛋 Guru 的大爱元宇宙代码与数据边界", "发布中英文首页、新闻、活动、社区、项目与 Guru 助手页面", "建立主站与 cz.cool 的双站角色"],
      en: ["Established GreatLoveMeta.com code and data boundaries independent from Guandan.Guru", "Published bilingual Home, News, Events, Community, Projects, and Ask Guru routes", "Defined the main-site and cz.cool roles"],
    },
    testable: {
      zh: ["切换中英文首页", "打开所有顶部导航页面", "确认大爱元宇宙品牌与内容"],
      en: ["Switch between English and Chinese", "Open every primary navigation route", "Confirm GreatLove Meta branding and content"],
    },
    commit: "ce48bbc",
  },
  {
    version: 2,
    date: "2026-07-22",
    title: { zh: "大爱元宇宙内容与公开访问", en: "GreatLove Meta content and public access" },
    completed: {
      zh: ["清理继承的牌类项目文案", "补齐关于、隐私、条款、账户与社区内容", "保持公开页面无需登录即可访问"],
      en: ["Removed inherited card-game wording", "Completed About, Privacy, Terms, Account, and Community content", "Kept public pages accessible without sign-in"],
    },
    testable: {
      zh: ["查看法律与关于页面", "未登录打开首页、新闻、活动与项目", "检查页面品牌一致性"],
      en: ["Review legal and About pages", "Open Home, News, Events, and Projects while signed out", "Check branding consistency"],
    },
    commit: "c82b81a",
  },
  {
    version: 3,
    date: "2026-07-22",
    title: { zh: "掼蛋 Guru 功能与界面基线对齐", en: "Guandan feature and UI baseline parity" },
    completed: {
      zh: ["对齐响应式页眉、移动菜单与语言切换", "恢复用户面板、账户、推荐链接、消息与实时聊天功能界面", "恢复项目日历、日报、任务与构建报告界面"],
      en: ["Aligned the responsive header, mobile menu, and language switcher", "Restored Dashboard, Account, referral URL, Messages, and Live Chat surfaces", "Restored the Project calendar, daily report, task, and build-report UI"],
    },
    testable: {
      zh: ["缩放桌面与手机宽度检查页眉", "打开用户面板与账户菜单", "浏览项目日历与报告"],
      en: ["Resize desktop and mobile widths to inspect the header", "Open Dashboard and the account menu", "Browse the Project calendar and reports"],
    },
    commit: "4571fed",
  },
  {
    version: 4,
    date: "2026-07-22",
    title: { zh: "大爱元宇宙项目规则与交付报告", en: "GreatLove Meta project rules and delivery reporting" },
    completed: {
      zh: ["记录掼蛋 Guru 界面为通用功能基线", "明确大爱元宇宙内容与数据必须保持独立", "在项目页记录本网站交付"],
      en: ["Recorded Guandan UI as the generic feature baseline", "Required GreatLove Meta content and data to remain independent", "Recorded this site’s delivery work on Projects"],
    },
    testable: {
      zh: ["查看项目页公开运营说明", "确认项目链接属于大爱元宇宙", "检查站点规则文件"],
      en: ["Review public project operations", "Confirm Project links belong to GreatLoveMeta.com", "Inspect the site rules"],
    },
    commit: "ee04168",
  },
  {
    version: 5,
    date: "2026-07-22",
    title: { zh: "独立项目记录与社区修复", en: "Independent project records and Community repair" },
    completed: {
      zh: ["用大爱元宇宙自身交付历史替换掼蛋 Guru 构建数据", "恢复网站自有邮箱验证码会话，移除社区对 Clerk 会话的依赖", "修正社区桌面三栏布局、频道分类和会员头像存储"],
      en: ["Replaced Guandan build data with GreatLoveMeta.com’s own delivery history", "Restored the site-owned email-code session and removed Community’s Clerk-session dependency", "Corrected the Community desktop grid, channel categories, and member avatar storage"],
    },
    testable: {
      zh: ["使用邮箱验证码登录后打开社区", "发布数字身份或共建项目主题", "在桌面、平板和手机宽度检查社区", "确认项目页仅显示大爱元宇宙工作"],
      en: ["Sign in with an email code and open Community", "Post to Digital Identity or Projects", "Check Community at desktop, tablet, and phone widths", "Confirm Projects shows only GreatLove Meta work"],
    },
    commit: "current",
  },
  {
    version: 18,
    date: "2026-07-28",
    title: { zh: "同步最新站点、GitHub 与项目日报", en: "Synchronize the latest site, GitHub, and Project report" },
    completed: {
      zh: ["保留并同步 iPad 发布的最新响应式页眉更新", "把项目日历与最新交付日期更新至 2026-07-28", "将同一份已验证代码同步至 GitHub 与 Sites 生产环境"],
      en: ["Preserved and synchronized the latest responsive-header update published from iPad", "Moved the Project calendar and latest delivery date to 2026-07-28", "Synchronized the same validated source to GitHub and Sites production"],
    },
    testable: {
      zh: ["打开 7 月 28 日项目日期", "查看 v18 构建报告", "检查中英文项目页面和生产首页"],
      en: ["Open the July 28 Project date", "Review the v18 build report", "Check the English and Chinese Project pages and production homepage"],
    },
    commit: "release-2026-07-28",
  },
];

export const projectTasks: ProjectTask[] = [
  {
    id: "release-sync-2026-07-28",
    date: "2026-07-28",
    status: "done",
    progress: 100,
    title: { zh: "生产版本与 GitHub 同步", en: "Production build and GitHub synchronization" },
    summary: { zh: "保留 iPad 新版本，发布今日项目报告，并让 GitHub 与 Sites 使用同一代码。", en: "Preserved the new iPad build, published today’s Project report, and aligned GitHub with Sites." },
    category: { zh: "发布", en: "Release" },
    owner: { zh: "平台团队", en: "Platform team" },
  },
  {
    id: "greatlovemeta-foundation",
    date: "2026-07-22",
    status: "done",
    progress: 100,
    title: { zh: "建立大爱元宇宙独立平台", en: "Establish the independent GreatLove Meta platform" },
    summary: { zh: "完成双语主站、独立数据边界与 cz.cool 导流站分工。", en: "Completed the bilingual main site, independent data boundary, and cz.cool funnel role." },
    category: { zh: "平台", en: "Platform" },
    owner: { zh: "大爱元宇宙团队", en: "GreatLove Meta team" },
  },
  {
    id: "generic-feature-parity",
    date: "2026-07-22",
    status: "done",
    progress: 100,
    title: { zh: "对齐通用功能与界面", en: "Align generic features and UI" },
    summary: { zh: "采用掼蛋 Guru 成熟的导航、项目、账户、消息、实时聊天与 Guru 助手交互基线。", en: "Adopted Guandan’s mature navigation, Projects, Account, Messages, Live Chat, and Ask Guru interaction baseline." },
    category: { zh: "产品", en: "Product" },
    owner: { zh: "产品团队", en: "Product team" },
  },
  {
    id: "independent-project-data",
    date: "2026-07-22",
    status: "done",
    progress: 100,
    title: { zh: "分离项目报告数据", en: "Separate Project report data" },
    summary: { zh: "保留项目日历与报告界面，但仅显示大爱元宇宙本身的任务和构建。", en: "Kept the Project calendar and reporting UI while showing only GreatLoveMeta.com tasks and builds." },
    category: { zh: "项目管理", en: "Project operations" },
    owner: { zh: "平台团队", en: "Platform team" },
  },
  {
    id: "community-repair",
    date: "2026-07-22",
    status: "done",
    progress: 100,
    title: { zh: "修复会员社区", en: "Repair the member Community" },
    summary: { zh: "恢复邮箱验证码会话，修正频道分类、三栏布局与头像数据。", en: "Restored email-code sessions and corrected channels, the three-column layout, and avatar data." },
    category: { zh: "社区", en: "Community" },
    owner: { zh: "平台团队", en: "Platform team" },
  },
  {
    id: "editorial-automation",
    date: "2026-07-27",
    status: "planned",
    progress: 20,
    title: { zh: "新闻与活动自动采集", en: "Automated News and Events ingestion" },
    summary: { zh: "接入经核实的来源、去重、双语摘要与编辑发布流程。", en: "Connect verified sources, deduplication, bilingual summaries, and editorial publishing." },
    category: { zh: "内容", en: "Editorial" },
    owner: { zh: "内容团队", en: "Editorial team" },
  },
  {
    id: "citizen-identity",
    date: "2026-08-03",
    status: "planned",
    progress: 10,
    title: { zh: "数字公民身份卡", en: "Digital Citizen identity card" },
    summary: { zh: "设计可分享的数字公民档案、凭证与可选钱包绑定。", en: "Design a shareable citizen profile, credentials, and optional wallet binding." },
    category: { zh: "身份", en: "Identity" },
    owner: { zh: "产品团队", en: "Product team" },
  },
];

export const projectReports = [
  {
    date: "2026-07-22",
    title: { zh: "大爱元宇宙建站、功能对齐与社区修复", en: "GreatLoveMeta.com launch, feature parity, and Community repair" },
    beta: { zh: "公开检查点", en: "Public checkpoint" },
    completed: 5,
  },
  {
    date: "2026-07-28",
    title: { zh: "最新代码同步与生产发布", en: "Latest source synchronization and production release" },
    beta: { zh: "查看今日报告", en: "View today’s report" },
    completed: 3,
  },
];

export const taskById = (id: string) => projectTasks.find(task => task.id === id);
export const tasksByDate = (date: string) => projectTasks.filter(task => task.date === date);
export const reportByDate = (date: string) => projectReports.find(report => report.date === date);
