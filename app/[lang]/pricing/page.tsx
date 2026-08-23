import { requestUser } from "../../../lib/request-user";
import PricingClient from "./pricing-client";
import { getPublishedPrices } from "../../../lib/paypal";
import { safeSiteLanguage } from "../../../lib/site-locale";

export const dynamic = "force-dynamic";

export default async function PricingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = safeSiteLanguage(raw);
  return <PricingClient lang={lang} signedIn={Boolean(await requestUser())} pricing={await getPublishedPrices()}/>;
}
