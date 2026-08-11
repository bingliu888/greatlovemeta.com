import { notFound,redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ClassDetailExperience } from "@/components/class-detail-experience";
import { classAccess,classByCode } from "@/lib/classrooms";
import { getSessionUser } from "@/lib/auth";
import "../classes.css";
export const dynamic="force-dynamic";
export default async function ClassDetailPage({params}:{params:Promise<{lang:string;code:string}>}){const{lang:raw,code}=await params,lang=raw==="zh"?"zh":"en",room=await classByCode(code);if(!room)notFound();const user=await getSessionUser(),access=await classAccess(room,user);if(!access.allowed)redirect(`/${lang}/auth/login?returnTo=/${lang}/classes/${code}`);return <main><SiteHeader lang={lang}/><ClassDetailExperience room={room} initialDisplayName={user?.displayName || ""} locale={lang} roomHref={`/${lang}/classes/${room.code}/room`}/><SiteFooter lang={lang}/></main>}
