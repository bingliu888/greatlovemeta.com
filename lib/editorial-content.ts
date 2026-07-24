import { getDatabase } from "./auth";

export type EditorialCard = { label: string; title: string; body: string; date?: string; source?: string; url?: string; status?: string; location?: string };
export type EditorialDocument = { editionDate: string; zh: EditorialCard[]; en: EditorialCard[] };

export const fallbackNews: EditorialDocument = {
  editionDate: "2026-07-22",
  en: [
    { label: "Platform · Identity", date: "2026-07-22", title: "A unified digital citizen profile enters development", body: "The first account layer is designed to connect profiles, community participation, direct messages, live chat, projects, and future digital credentials." },
    { label: "Community · Bilingual", date: "2026-07-22", title: "English and Chinese participation share one community", body: "Members can move between English and Chinese interfaces while preserving the same account, conversations, and project relationships." },
    { label: "Ecosystem · cz.cool", date: "2026-07-22", title: "A lighter path into the GreatLove Meta ecosystem", body: "cz.cool is planned as a youth-facing entry point for interactive identity cards, campaigns, and social sharing, backed by GreatLoveMeta.com." },
  ],
  zh: [
    { label: "平台 · 身份", date: "2026-07-22", title: "统一数字公民档案进入建设阶段", body: "首个账号身份层将连接个人档案、社区参与、私信、Live Chat、项目与未来数字凭证。" },
    { label: "社区 · 双语", date: "2026-07-22", title: "中英文用户共用同一个全球社区", body: "会员可在中英文界面之间自由切换，并保留同一账号、会话与项目关系。" },
    { label: "生态 · cz.cool", date: "2026-07-22", title: "更轻松地进入全球数字公民生态", body: "cz.cool 将作为年轻化导流入口，用于互动身份卡、社交活动与分享，并由 GreatLoveMeta.com 提供品牌和身份基础。" },
  ],
};

export const fallbackEvents: EditorialDocument = {
  editionDate: "2026-07-22",
  en: [
    { label: "Community orientation", status: "Opening soon", location: "Online · bilingual", date: "2026", title: "Meet the GreatLove Meta community", body: "A guided introduction to citizen profiles, community channels, direct messages, live chat, and project participation." },
    { label: "Project forum", status: "Planned", location: "Online", date: "2026", title: "From shared concern to transparent project", body: "A working session for shaping project goals, roles, milestones, public updates, and measurable outcomes." },
    { label: "Digital identity lab", status: "Planned", location: "Hybrid", date: "2026", title: "Portable identity and responsible credentials", body: "A practical discussion of email identity, optional wallet binding, privacy, verifiable credentials, and cross-platform portability." },
  ],
  zh: [
    { label: "社区说明会", status: "即将开放", location: "线上 · 中英双语", date: "2026", title: "认识全球数字公民社区", body: "通过引导了解公民档案、社区频道、私信、Live Chat 与项目参与方式。" },
    { label: "项目共建会", status: "规划中", location: "线上", date: "2026", title: "从共同关注到透明项目", body: "围绕项目目标、角色、里程碑、公开进展和可衡量成果开展协作。" },
    { label: "数字身份实验室", status: "规划中", location: "线上与线下", date: "2026", title: "可携带身份与负责任的数字凭证", body: "探讨邮箱身份、可选钱包绑定、隐私、可验证凭证与跨平台可携带性。" },
  ],
};

function valid(value: unknown): value is EditorialDocument { const v = value as EditorialDocument; return Boolean(v && typeof v.editionDate === "string" && Array.isArray(v.zh) && Array.isArray(v.en)); }
export async function getEditorialDocument(kind: "news" | "events", fallback: EditorialDocument) {
  try { const row = await getDatabase().prepare("SELECT edition_date AS editionDate, payload FROM editorial_documents WHERE kind = ?").bind(kind).first<{ editionDate: string; payload: string }>(); if (!row) return fallback; const value = JSON.parse(row.payload); return valid(value) ? { ...value, editionDate: row.editionDate } : fallback; } catch { return fallback; }
}
