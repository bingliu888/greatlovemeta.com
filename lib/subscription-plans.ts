export type SubscriptionPlanId = "monthly" | "annual";

const features = {
  zh: ["7 天免费试用", "大爱人工智能、RWA、会员与社区完整权益", "内置私密小组音视频与沟通中心", "公开网络研讨会与 HLS 广播", "DeepSeek V4 Flash 默认，可选 OpenAI"],
  en: ["7-day free trial", "GreatLove AI, RWA, membership, and community access", "Private group audio/video and communication center", "Public webinars and HLS broadcasting", "DeepSeek V4 Flash by default, OpenAI optional"],
};

export const SUBSCRIPTION_PLANS = [
  { id: "monthly", months: 1, fallbackPrice: "$5", fallbackAmountCents: 500, label: { zh: "月度会员", en: "Monthly" }, features },
  { id: "annual", months: 12, fallbackPrice: "$8", fallbackAmountCents: 800, label: { zh: "年度会员", en: "Annual" }, features },
] as const;

export function subscriptionPlan(value: unknown) { return SUBSCRIPTION_PLANS.find((plan) => plan.id === value) ?? null; }
