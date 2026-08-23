import CryptoCheckout from "../../../../components/CryptoCheckout";
import type { CryptoPlanId } from "../../../../lib/crypto-contract";
import { safeSiteLanguage } from "../../../../lib/site-locale";

export const dynamic = "force-dynamic";

export default async function CryptoPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ plan?: string }> }) {
  const [{ lang: raw }, { plan }] = await Promise.all([params, searchParams]);
  const lang = safeSiteLanguage(raw), contentLang = lang === "zh" ? "zh" : "en";
  const initialPlan: CryptoPlanId = plan === "annual" ? plan : "monthly";
  return <main><CryptoCheckout language={contentLang} initialPlan={initialPlan}/></main>;
}
