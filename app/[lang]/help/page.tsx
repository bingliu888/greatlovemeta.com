import {notFound,redirect} from "next/navigation";
import {SiteHeader} from "@/components/SiteHeader";
import {SiteFooter} from "@/components/SiteFooter";
import {getSessionUser} from "@/lib/auth";
import {ensureHelpRoom} from "@/lib/help-room";
import {helpUiFor} from "@/lib/help-ui-i18n";
import {safeSiteLanguage} from "@/lib/site-locale";

export const dynamic="force-dynamic";

export default async function HelpPage({params}:{params:Promise<{lang:string}>}){
  const {lang:raw}=await params,lang=safeSiteLanguage(raw);
  if(lang!==raw)notFound();
  if(!await getSessionUser())redirect(`/${lang}/auth/login?returnTo=/${lang}/help`);
  const code=await ensureHelpRoom();
  if(code)redirect(`/${lang}/classes/${code}/room`);
  const ui=helpUiFor(lang);
  return <main><SiteHeader lang={lang}/><section className="site-width"><h1>{ui.unavailable}</h1><p>{ui.retry}</p></section><SiteFooter lang={lang}/></main>;
}
