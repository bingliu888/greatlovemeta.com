import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { ShareStudio } from "../../../components/ShareStudio";
import { getSessionUser } from "../../../lib/auth";
import { safeSiteLanguage } from "../../../lib/site-locale";
import "./share.css";
export const dynamic="force-dynamic";
export default async function SharePage({params}:{params:Promise<{lang:string}>}){const {lang:raw}=await params,lang=safeSiteLanguage(raw),contentLang=lang==="zh"?"zh":"en";const h=await headers();const user=await getSessionUser(new Request("https://greatlovemeta.com",{headers:{cookie:h.get("cookie")??""}}));if(!user)redirect(`/${lang}/auth/login?returnTo=/${lang}/share`);return <main><SiteHeader lang={lang}/><ShareStudio lang={contentLang}/><SiteFooter lang={lang}/></main>}
