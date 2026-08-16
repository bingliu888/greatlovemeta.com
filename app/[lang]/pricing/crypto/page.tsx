import { notFound } from "next/navigation";
import CryptoCheckout from "../../../../components/CryptoCheckout";
import type { CryptoPlanId } from "../../../../lib/crypto-contract";

export const dynamic = "force-dynamic";

export default async function CryptoPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ plan?: string }> }) {
  const [{ lang }, { plan }] = await Promise.all([params, searchParams]);
  if (lang !== "en" && lang !== "zh") notFound();
  const initialPlan: CryptoPlanId = plan === "annual" ? plan : "monthly";
  return <main><CryptoCheckout language={lang} initialPlan={initialPlan}/></main>;
}
