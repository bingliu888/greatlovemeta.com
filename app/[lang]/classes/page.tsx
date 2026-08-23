import { ClassDirectory } from "@/components/class-directory";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./classes.css";
import { safeSiteLanguage } from "@/lib/site-locale";
export const dynamic="force-dynamic";
export default async function ClassesPage({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<{view?:string}>}){const{lang:raw}=await params,{view}=await searchParams,lang=safeSiteLanguage(raw),contentLang=lang==="zh"?"zh":"en";return <main><SiteHeader lang={lang}/><ClassDirectory lang={contentLang} initialView={view||"public"}/><SiteFooter lang={lang}/></main>}
