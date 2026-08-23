import { notFound,redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ClassDetailExperience } from "@/components/class-detail-experience";
import { classAccess,classByCode } from "@/lib/classrooms";
import { getSessionUser } from "@/lib/auth";
import { canManageClass } from "@/lib/class-managers";
import { safeSiteLanguage } from "@/lib/site-locale";
import "../classes.css";
export const dynamic="force-dynamic";
export default async function ClassDetailPage({params}:{params:Promise<{lang:string;code:string}>}){const{lang:raw,code}=await params,lang=safeSiteLanguage(raw),contentLang=lang==="zh"?"zh":"en",room=await classByCode(code);if(!room)notFound();const user=await getSessionUser(),access=await classAccess(room,user),manager=await canManageClass(room,user);if(!access.allowed&&room.classType==="private")redirect(`/${lang}/auth/login?returnTo=/${lang}/classes/${code}`);const accessReason=!access.allowed&&"reason" in access?access.reason:undefined;return <main><SiteHeader lang={lang}/><ClassDetailExperience room={room} initialDisplayName={user?.displayName || ""} locale={contentLang} roomHref={`/${lang}/classes/${room.code}/room`} manager={manager} accessReason={accessReason}/> <SiteFooter lang={lang}/></main>}
