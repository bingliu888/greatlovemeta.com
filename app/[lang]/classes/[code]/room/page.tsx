import { notFound,redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ClassRoomClient } from "@/components/class-room-client";
import { classAccess,classByCode } from "@/lib/classrooms";
import { getSessionUser } from "@/lib/auth";
import "../../classes.css";
export const dynamic="force-dynamic";
export default async function ClassroomPage({params}:{params:Promise<{lang:string;code:string}>}){const{lang:raw,code}=await params,lang=raw==="zh"?"zh":"en",room=await classByCode(code);if(!room)notFound();const user=await getSessionUser(),access=await classAccess(room,user);if(!access.allowed)redirect(`/${lang}/auth/login?returnTo=/${lang}/classes/${code}/room`);return <main><SiteHeader lang={lang}/><section className="class-room-page"><ClassRoomClient room={{code:room.code,title:room.title,streamingMode:room.streamingMode,realtimeMode:room.realtimeMode,classType:room.classType}} displayName={user?.displayName||"Guest"} manager={access.manager} lang={lang}/></section><SiteFooter lang={lang}/></main>}
