/* eslint-disable @next/next/no-img-element -- Collection artwork is user-managed media with arbitrary external URLs and intentionally bypasses the framework image proxy. */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../../../components/SiteFooter";
import { SiteHeader } from "../../../../components/SiteHeader";
import { safeSiteLanguage, siteLanguages } from "../../../../lib/site-locale";

type Language = "en" | "zh";

type CollectionCopy = {
  eyebrow: string;
  title: string;
  summary: string;
  imageAlt: string;
  localLabel: string;
  localBody: string;
  sectionKicker: string;
  sections: readonly (readonly [string, string])[];
  recordTitle: string;
  records: readonly (readonly [string, string])[];
  notice: string;
};

type Collection = {
  image: string;
  en: CollectionCopy;
  zh: CollectionCopy;
};

const collections = {
  "eight-horses": {
    image: "/greatlove-horses.png",
    en: {
      eyebrow: "EIGHT HORSES · DIGITAL CULTURAL COLLECTION",
      title: "Lang Shining Eight Horses RWA Digital Collection NFT",
      summary: "A GreatLoveMeta presentation inspired by the enduring Eight Horses cultural theme—bringing art discovery, responsible digital records, and bilingual community learning into one local experience.",
      imageAlt: "Eight Horses digital collection artwork",
      localLabel: "HOSTED BY GREATLOVEMETA",
      localBody: "This collection page and its artwork are now presented directly on GreatLoveMeta.com, so members can explore without being sent to an external GreatLoveDAO page.",
      sectionKicker: "Collection perspective",
      sections: [
        ["Cultural theme", "The Eight Horses motif celebrates vitality, movement, companionship, and the long relationship between art and horsemanship. This presentation keeps that cultural story at the center."],
        ["Digital presentation", "The collection cover, bilingual description, and future updates live together on GreatLoveMeta. Digital records can make a collection easier to discover while keeping the underlying artwork and its history distinct."],
        ["Responsible documentation", "Future collection records should clearly identify the represented work, image source, issuing party, relevant rights, and supporting evidence. A blockchain entry alone does not authenticate a physical artwork."],
      ],
      recordTitle: "Collection record",
      records: [
        ["Category", "RWA · NFT · Digital cultural collection"],
        ["Presentation", "Bilingual GreatLoveMeta collection page"],
        ["Featured subject", "Eight Horses cultural artwork"],
        ["Current status", "Community discovery and education"],
      ],
      notice: "This page is a cultural and educational presentation. It is not an appraisal, certificate of authenticity, proof of ownership, investment offer, or statement of legal rights.",
    },
    zh: {
      eyebrow: "八骏图 · 数字文化收藏",
      title: "郎士宁八骏图 RWA数字藏品NFT",
      summary: "以经典八骏图文化主题为灵感，在大爱元宇宙本站连接艺术发现、负责任的数字记录与中英双语社区学习。",
      imageAlt: "八骏图数字收藏艺术图",
      localLabel: "由大爱元宇宙本站呈现",
      localBody: "本收藏页面与艺术图现已直接迁移至大爱元宇宙，会员浏览时不再跳转到外部 GreatLoveDAO 页面。",
      sectionKicker: "收藏视角",
      sections: [
        ["文化主题", "八骏图意象承载生命力、奔腾、陪伴以及艺术与马文化之间的长期联系。本页面以清晰、克制的方式呈现这一文化主题。"],
        ["数字呈现", "收藏封面、中英文介绍与后续更新统一保存在大爱元宇宙。数字记录可以帮助发现与整理收藏，同时应明确区分艺术作品本身、历史背景和数字凭证。"],
        ["负责任的记录", "未来收藏记录应清楚说明对应作品、图片来源、发行主体、相关权益与支持证据。区块链记录本身并不能自动证明实物艺术品的真伪。"],
      ],
      recordTitle: "收藏记录",
      records: [
        ["类别", "RWA · NFT · 数字文化收藏"],
        ["呈现方式", "大爱元宇宙中英双语收藏页面"],
        ["主题", "八骏图文化艺术"],
        ["当前状态", "社区发现与文化学习"],
      ],
      notice: "本页面用于文化与教育展示，不构成鉴定证书、真伪证明、所有权证明、投资要约或法律权益声明。",
    },
  },
  "rwa-nft": {
    image: "/greatlove-rwa.gif",
    en: {
      eyebrow: "GREATLOVE · RWA AND NFT COLLECTION",
      title: "GreatLove RWA NFT Collection",
      summary: "A local GreatLoveMeta collection space for exploring how real-world assets, cultural objects, supporting evidence, and digital records can be presented with clearer boundaries.",
      imageAlt: "GreatLove RWA and NFT collection artwork",
      localLabel: "HOSTED BY GREATLOVEMETA",
      localBody: "Collection discovery now stays inside GreatLoveMeta, with a consistent bilingual layout and room for transparent future records.",
      sectionKicker: "Collection framework",
      sections: [
        ["Start with the asset", "A useful RWA record begins with a clearly identified object or right, not a token label. Descriptions should separate observable facts from interpretation and promotion."],
        ["Connect the evidence", "Images, provenance documents, custody information, rights, and issuer details should be linked in a way that members can understand and independently evaluate."],
        ["Use digital records carefully", "NFTs and blockchain entries can support traceability, but they do not automatically transfer ownership, guarantee value, or replace professional verification."],
      ],
      recordTitle: "Collection record",
      records: [
        ["Category", "RWA and NFT discovery"],
        ["Presentation", "Bilingual GreatLoveMeta collection page"],
        ["Focus", "Transparent records and cultural context"],
        ["Current status", "Community discovery and education"],
      ],
      notice: "This page is informational. Individual collection items require their own evidence, rights statement, issuer information, and independent review.",
    },
    zh: {
      eyebrow: "大爱 · RWA 与 NFT 收藏",
      title: "大爱 RWA NFT 收藏",
      summary: "在大爱元宇宙本站探索现实世界资产、文化藏品、支持证据与数字记录如何在清晰边界下连接。",
      imageAlt: "大爱 RWA 与 NFT 收藏艺术图",
      localLabel: "由大爱元宇宙本站呈现",
      localBody: "收藏发现现已保留在大爱元宇宙站内，以统一的中英双语布局承载未来透明记录。",
      sectionKicker: "收藏框架",
      sections: [
        ["从资产本身开始", "有意义的 RWA 记录首先需要明确对应的物品或权益，而不是只给出代币名称。描述应区分可观察事实、解释与推广内容。"],
        ["连接支持证据", "图片、来源文件、保管信息、权益与发行主体资料应以会员能够理解并独立判断的方式进行关联。"],
        ["谨慎使用数字记录", "NFT 与区块链记录可以帮助追溯，但不会自动转移所有权、保证价值，也不能替代专业验证。"],
      ],
      recordTitle: "收藏记录",
      records: [
        ["类别", "RWA 与 NFT 发现"],
        ["呈现方式", "大爱元宇宙中英双语收藏页面"],
        ["重点", "透明记录与文化背景"],
        ["当前状态", "社区发现与教育"],
      ],
      notice: "本页面仅供信息展示。每一项具体藏品仍需独立的支持证据、权益说明、发行主体资料与专业审查。",
    },
  },
  professional: {
    image: "/greatlove-pro.gif",
    en: {
      eyebrow: "PROFESSIONAL CULTURAL COLLECTION",
      title: "GreatLove NFT Professional Collection",
      summary: "A focused GreatLoveMeta space for specialist cultural collections, designed to pair strong visual presentation with structured documentation and responsible interpretation.",
      imageAlt: "GreatLove professional NFT collection artwork",
      localLabel: "HOSTED BY GREATLOVEMETA",
      localBody: "The professional collection now has its own GreatLoveMeta destination rather than relying on an external GreatLoveDAO page.",
      sectionKicker: "Professional approach",
      sections: [
        ["Curated context", "Professional collections need more than a striking image. Each item should explain its subject, cultural setting, materials, dimensions, condition, and the basis for any attribution."],
        ["Specialist review", "Where an item makes historical, authorship, rarity, or value claims, qualified independent specialists and supporting documentation should be identified."],
        ["Clear member experience", "GreatLoveMeta provides a consistent bilingual place for discovery while keeping educational content separate from authentication, ownership, and transaction claims."],
      ],
      recordTitle: "Collection record",
      records: [
        ["Category", "Professional cultural digital collection"],
        ["Presentation", "Bilingual GreatLoveMeta collection page"],
        ["Focus", "Structured specialist documentation"],
        ["Current status", "Community discovery and education"],
      ],
      notice: "Professional collection entries must be evaluated item by item. This overview does not certify authenticity, provenance, value, ownership, or eligibility for any transaction.",
    },
    zh: {
      eyebrow: "专业文化数字收藏",
      title: "大爱NFT系列专业收藏",
      summary: "大爱元宇宙面向专业文化收藏建立的专属页面，将清晰视觉呈现、结构化资料与负责任的专业解读连接起来。",
      imageAlt: "大爱 NFT 专业收藏艺术图",
      localLabel: "由大爱元宇宙本站呈现",
      localBody: "专业收藏现已拥有大爱元宇宙本站页面，不再依赖外部 GreatLoveDAO 页面。",
      sectionKicker: "专业方法",
      sections: [
        ["策展背景", "专业收藏不能只有醒目的图片。每件藏品应说明主题、文化背景、材料、尺寸、保存状态，以及任何归属判断所依据的资料。"],
        ["专业审查", "如果具体藏品涉及年代、作者、稀缺性或价值主张，应明确列出合格的独立专业人士与支持文件。"],
        ["清晰的会员体验", "大爱元宇宙提供一致的中英双语发现空间，同时将教育内容与鉴定、所有权和交易主张清楚区分。"],
      ],
      recordTitle: "收藏记录",
      records: [
        ["类别", "专业文化数字收藏"],
        ["呈现方式", "大爱元宇宙中英双语收藏页面"],
        ["重点", "结构化专业资料"],
        ["当前状态", "社区发现与教育"],
      ],
      notice: "专业收藏需要逐件评估。本概览不证明真伪、来源、价值、所有权或任何交易资格。",
    },
  },
} satisfies Record<string, Collection>;

type CollectionSlug = keyof typeof collections;

const relatedOrder: readonly CollectionSlug[] = ["eight-horses", "rwa-nft", "professional"];

// Keep the complete localized collection matrix visible to build-time and
// contract checks even though the content source is intentionally bilingual.
export function generateStaticParams() {
  return siteLanguages.flatMap(([lang]) => relatedOrder.map((slug) => ({ lang, slug })));
}

function isCollectionSlug(value: string): value is CollectionSlug {
  return value in collections;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: raw, slug } = await params;
  const lang = safeSiteLanguage(raw), contentLang: Language = lang === "zh" ? "zh" : "en";
  if (!isCollectionSlug(slug)) return {};
  const copy = collections[slug][contentLang];
  return {
    title: { absolute: `${copy.title} | ${lang === "zh" ? "大爱元宇宙" : "GreatLoveMeta.com"}` },
    description: copy.summary,
    alternates: {
      languages: {
        en: `/en/collections/${slug}`,
        "zh-CN": `/zh/collections/${slug}`,
      },
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  const lang = safeSiteLanguage(raw), contentLang: Language = lang === "zh" ? "zh" : "en";
  if (!isCollectionSlug(slug)) notFound();

  const collection = collections[slug];
  const copy = collection[contentLang];
  const related = relatedOrder.filter((item) => item !== slug);

  return (
    <div className="glm-collection-page">
      <SiteHeader lang={lang} />
      <main className="glm-collection-main">
        <Link className="glm-collection-back" href={`/${lang}#collections`}>
          ← {lang === "zh" ? "返回 RWA 数字藏品" : "Back to RWA collections"}
        </Link>

        <section className="glm-collection-hero">
          <div className="glm-collection-copy">
            <p className="section-kicker">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p>{copy.summary}</p>
            <div className="glm-collection-local-note">
              <small>{copy.localLabel}</small>
              <span>{copy.localBody}</span>
            </div>
          </div>
          <figure>
            <img src={collection.image} alt={copy.imageAlt} />
          </figure>
        </section>

        <section className="glm-collection-perspective">
          <div className="section-heading">
            <p className="section-kicker">{copy.sectionKicker}</p>
            <h2>{lang === "zh" ? "清晰呈现文化、记录与权益边界。" : "Present culture, records, and rights with clarity."}</h2>
          </div>
          <div className="glm-collection-principles">
            {copy.sections.map(([title, body], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glm-collection-record">
          <div>
            <p className="section-kicker">{lang === "zh" ? "页面资料" : "Page details"}</p>
            <h2>{copy.recordTitle}</h2>
          </div>
          <dl>
            {copy.records.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="glm-collection-notice">{copy.notice}</p>
        </section>

        <section className="glm-related-collections">
          <div>
            <p className="section-kicker">{lang === "zh" ? "继续探索" : "Continue exploring"}</p>
            <h2>{lang === "zh" ? "更多大爱数字收藏" : "More GreatLove digital collections"}</h2>
          </div>
          <div>
            {related.map((item) => {
              const next = collections[item];
              return (
                <Link href={`/${lang}/collections/${item}`} key={item}>
                  <img src={next.image} alt="" aria-hidden="true" />
                  <span>
                    <b>{next[contentLang].title}</b>
                    <small>{lang === "zh" ? "了解更多 →" : "Learn more →"}</small>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
