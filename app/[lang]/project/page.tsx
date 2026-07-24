import { notFound } from "next/navigation";
import { ProjectDashboard } from "../../../components/ProjectDashboard";

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ month?: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") notFound();
  const { month } = await searchParams;
  return <ProjectDashboard lang={lang} month={month} />;
}
