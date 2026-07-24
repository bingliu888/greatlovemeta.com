import { notFound } from "next/navigation";
import { LegalPage } from "../../../components/LegalPage";
export default async function TermsPage({params}:{params:Promise<{lang:string}>}){const{lang}=await params;if(lang!=="en"&&lang!=="zh")notFound();return <LegalPage lang={lang} kind="terms"/>}
