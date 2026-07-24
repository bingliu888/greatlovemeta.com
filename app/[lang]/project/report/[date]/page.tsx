import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../../../components/SiteHeader";
import { SiteFooter } from "../../../../../components/SiteFooter";
import { getProjectRuntime } from "../../../../../lib/project-runtime";

export default async function ReportPage({ params }: { params: Promise<{ lang: string; date: string }> }) {
  const { lang, date } = await params;
  if (lang !== "en" && lang !== "zh") notFound();
  const report = (await getProjectRuntime()).reports.find(item => item.date === date);
  if (!report) notFound();
  const zh = lang === "zh";
  return <main className="gg-project-page"><SiteHeader lang={lang}/><article className="gg-detail"><Link href={`/${lang}/project`}>← {zh ? "项目日历" : "Project calendar"}</Link><p className="section-kicker">{zh ? "每日报告" : "DAILY REPORT"} · {date}</p><h1>{report.title[lang]}</h1><div className="gg-detail-summary"><span>{report.beta[lang]}</span><b>{report.completed} {zh ? "项里程碑" : "milestones"}</b></div><section><h2>{zh ? "今日完成" : "Completed today"}</h2><p>{zh ? "已完成计划内功能并保存可回滚的发布记录。" : "Planned work was completed and a rollback-ready release record was saved."}</p></section><section><h2>{zh ? "测试状态" : "Test status"}</h2><p>{zh ? "已发布功能可在当前网站中继续验证。" : "Released features are available for continued verification on the current site."}</p></section><Link className="gg-detail-link" href={`/${lang}/project`}>{zh ? "返回项目日历" : "Back to project calendar"} →</Link></article><SiteFooter lang={lang}/></main>;
}
