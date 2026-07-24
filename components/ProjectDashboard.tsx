import Link from "next/link";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { projectTasks } from "../lib/project-status";
import { getProjectRuntime } from "../lib/project-runtime";

export async function ProjectDashboard({ lang, month }: { lang: "en" | "zh"; month?: string }) {
  const runtime = await getProjectRuntime();
  const projectReports = runtime.reports;
  const latest = projectReports.at(-1)!;
  const latestBuild = runtime.builds.at(-1)!;
  const zh = lang === "zh";
  const done = projectTasks.filter(task => task.status === "done").length;
  const blocked = projectTasks.filter(task => task.status === "blocked").length;
  const reports = new Map(projectReports.map(report => [report.date, report]));
  const buildDates = new Map<string, number>();
  runtime.builds.forEach(build => buildDates.set(build.date, (buildDates.get(build.date) ?? 0) + 1));
  const calendarMonths = [...new Set([...projectTasks.map(item => item.date), ...projectReports.map(item => item.date), ...runtime.builds.map(item => item.date)].map(date => date.slice(0, 7)))].sort();
  const selectedMonth = month && calendarMonths.includes(month) ? month : latest.date.slice(0, 7);
  const selectedIndex = calendarMonths.indexOf(selectedMonth);
  const previousMonth = selectedIndex > 0 ? calendarMonths[selectedIndex - 1] : undefined;
  const nextMonth = selectedIndex < calendarMonths.length - 1 ? calendarMonths[selectedIndex + 1] : undefined;

  const calendar = (year: number, month: number) => {
    const leading = new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay();
    const count = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
    const weekdays = zh ? ["日", "一", "二", "三", "四", "五", "六"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return <section className="gg-calendar">
      <div className="gg-calendar-head"><div><h2>{zh ? `${year} 年 ${month} 月` : new Date(Date.UTC(year, month - 1)).toLocaleString("en", { month: "long", year: "numeric" })}</h2><span>{zh ? "选择日期查看任务与当天构建" : "Select a date to view tasks and daily builds"}</span></div><nav className="gg-calendar-nav">{previousMonth ? <Link href={`/${lang}/project?month=${previousMonth}`}>← {zh ? "上个月" : "Previous"}</Link> : <span>← {zh ? "上个月" : "Previous"}</span>}{nextMonth ? <Link href={`/${lang}/project?month=${nextMonth}`}>{zh ? "下个月" : "Next"} →</Link> : <span>{zh ? "下个月" : "Next"} →</span>}</nav></div>
      <div className="gg-calendar-grid">
        {weekdays.map(day => <span key={day}>{day}</span>)}
        {Array.from({ length: leading }).map((_, i) => <i key={i}/>)}
        {Array.from({ length: count }, (_, i) => i + 1).map(day => {
          const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const tasks = projectTasks.filter(task => task.date === date);
          const report = reports.get(date);
          const buildCount = buildDates.get(date) ?? 0;
          return tasks.length || report || buildCount ? <Link key={date} className={`gg-day ${tasks.some(task => task.status === "done") || buildCount ? "complete" : "planned"} ${tasks.some(task => task.status === "blocked") ? "risk" : ""}`} href={`/${lang}/project/day/${date}`}><b>{day}</b><small>{zh ? `${tasks.length} 项任务 · ${buildCount} 个构建` : `${tasks.length} task${tasks.length === 1 ? "" : "s"} · ${buildCount} build${buildCount === 1 ? "" : "s"}`} →</small></Link> : <span className="gg-day" key={date}><b>{day}</b></span>;
        })}
      </div>
    </section>;
  };

  return <main className="gg-project-page"><SiteHeader lang={lang}/><div className="gg-project-main">
    <section className="gg-project-hero"><div><p className="section-kicker">{zh ? "公开项目管理" : "PUBLIC PROJECT OPERATIONS"}</p><h1>{zh ? "已经完成什么，下一步做什么。" : "What shipped. What comes next."}</h1><p>{zh ? "公开展示交付日历、任务看板、依赖关系和每日进度。" : "The delivery calendar, task board, dependencies, and daily progress are public."}</p></div><div className="gg-project-picker"><span>{zh ? "最新交付日期" : "LATEST DELIVERY DATE"}</span><strong>{latest.date}</strong><Link href={`/${lang}/project/day/${latest.date}`}>{zh ? "查看完成内容" : "View completed work"} →</Link></div></section>
    <section className="gg-velocity"><div><p className="section-kicker">{zh ? "AIGC 交付速度" : "AIGC DELIVERY VELOCITY"}</p><h2>{zh ? "今日更新 / 累计构建" : "Updates today / total builds"}</h2><Link href={`/${lang}/project/build/${latestBuild.version}`}>{zh ? `查看 v${latestBuild.version} 构建报告` : `View v${latestBuild.version} build report`} →</Link></div><strong>{runtime.today} / {runtime.total}</strong></section>
    <section className="gg-kpis"><article><b>{projectTasks.length}</b><span>{zh ? "任务总数" : "Total tasks"}</span></article><article><b>{done}</b><span>{zh ? "已完成" : "Completed"}</span></article><article><b>{projectTasks.length - done - blocked}</b><span>{zh ? "已计划" : "Planned"}</span></article><article className="risk"><b>{blocked}</b><span>{zh ? "受阻" : "Blocked"}</span></article></section>
    <div className="gg-legend"><span><i className="complete"/>{zh ? "已完成交付" : "Completed delivery"}</span><span><i className="planned"/>{zh ? "计划交付" : "Planned delivery"}</span><span><i className="risk"/>{zh ? "依赖存在风险" : "Dependency at risk"}</span></div>
    <div className="gg-calendar-stack">{calendar(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)))}</div>
    <section className="gg-history gg-build-history"><header><p className="section-kicker">{zh ? "构建历史" : "BUILD HISTORY"}</p><h2>{zh ? "每次部署的完成内容" : "What changed in every deployment"}</h2></header>{[...runtime.builds].reverse().map(build => <article key={build.version}><time>v{build.version}</time><div><h3>{build.title[lang]}</h3><p>{build.date} · {zh ? `完成 ${build.completed[lang].length} 项` : `${build.completed[lang].length} completed items`}</p></div><Link href={`/${lang}/project/build/${build.version}`}>{zh ? "查看报告" : "View report"} →</Link></article>)}</section>
    <section className="gg-history"><header><p className="section-kicker">{zh ? "每日检查点" : "DAILY CHECKPOINTS"}</p><h2>{zh ? "每日进度与回滚记录" : "Daily reports and rollback trail"}</h2></header>{[...projectReports].reverse().map(report => <article key={report.date}><time>{report.date}</time><div><h3>{report.title[lang]}</h3><p>{zh ? `已完成 ${report.completed} 项里程碑 · 已记录回滚点` : `${report.completed} milestones completed · rollback recorded`}</p></div><Link href={`/${lang}/project/report/${report.date}`}>{report.beta[lang]} →</Link></article>)}</section>
  </div><SiteFooter lang={lang}/></main>;
}
