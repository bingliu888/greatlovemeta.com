import { LegalPage } from "../../../components/LegalPage";
import { safeSiteLanguage } from "../../../lib/site-locale";
export default async function AboutPage({params}:{params:Promise<{lang:string}>}){const{lang:raw}=await params;return <LegalPage lang={safeSiteLanguage(raw)} kind="about"/>}
