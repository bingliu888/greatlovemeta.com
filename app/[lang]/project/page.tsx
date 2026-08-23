import { ProjectDashboard } from "../../../components/ProjectDashboard";
import { safeSiteLanguage } from "../../../lib/site-locale";

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ month?: string }> }) {
  const { lang: raw } = await params;
  const lang = safeSiteLanguage(raw);
  const { month } = await searchParams;
  return <ProjectDashboard lang={lang} month={month} />;
}
