import { ClassDirectory } from "@/components/class-directory";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./classes.css";
export const dynamic="force-dynamic";
export default async function ClassesPage({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<{view?:string}>}){const{lang:raw}=await params,{view}=await searchParams,lang=raw==="zh"?"zh":"en";return <main><SiteHeader lang={lang}/><ClassDirectory lang={lang} initialView={view||"public"}/><SiteFooter lang={lang}/></main>}
