import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ClassCreateForm } from "@/components/class-create-form";
import { getSessionUser } from "@/lib/auth";
import { isAdminUser, isTeacherUser } from "@/lib/admin-access";
import { safeSiteLanguage } from "@/lib/site-locale";
import "../classes.css";
export const dynamic="force-dynamic";
export default async function CreateClassPage({params}:{params:Promise<{lang:string}>}){const{lang:raw}=await params,lang=safeSiteLanguage(raw),contentLang=lang==="zh"?"zh":"en",user=await getSessionUser();if(!user)redirect(`/${lang}/auth/login?returnTo=/${lang}/classes/create`);if(!await isTeacherUser(user))redirect(`/${lang}/classes`);return <main><SiteHeader lang={lang}/><ClassCreateForm lang={contentLang}/><SiteFooter lang={lang}/></main>}
