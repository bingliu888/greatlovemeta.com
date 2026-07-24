import { notFound } from "next/navigation";
import { requestUser } from "../../../lib/request-user";
import PricingClient from "./pricing-client";
import { getPublishedPrices } from "../../../lib/paypal";

export const dynamic = "force-dynamic";

export default async function PricingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") notFound();
  return <PricingClient lang={lang} signedIn={Boolean(await requestUser())} pricing={await getPublishedPrices()} />;
}
