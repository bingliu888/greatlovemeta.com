import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ClassRoomClient } from "@/components/class-room-client";
import { classAccess, classByCode } from "@/lib/classrooms";
import { getSessionUser } from "@/lib/auth";
import { safeSiteLanguage } from "@/lib/site-locale";
import { helpUiFor } from "@/lib/help-ui-i18n";
import "../../classes.css";

export const dynamic = "force-dynamic";

export default async function ClassroomPage({ params }: { params: Promise<{ lang: string; code: string }> }) {
  const { lang: raw, code } = await params;
  const lang = safeSiteLanguage(raw);
  const contentLang = lang === "zh" ? "zh" : "en";
  const user = await getSessionUser();
  const returnTo = `/${lang}/classes/${code}/room`;
  if (!user) redirect(`/${lang}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  const room = await classByCode(code);
  if (!room) notFound();
  const access = await classAccess(room, user, true);
  if (!access.allowed) redirect(`/${lang}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return <main><SiteHeader lang={lang}/><section className="class-room-page"><ClassRoomClient room={{code:room.code,title:room.isHelpRoom?helpUiFor(lang).label:room.title,streamingMode:room.streamingMode,realtimeMode:room.realtimeMode,classType:room.classType}} displayName={String(user.displayName||user.email||"Member").trim().slice(0,80)} manager={access.manager} lang={contentLang}/></section><SiteFooter lang={lang}/></main>;
}
