import { NextResponse } from "next/server";
import { currentSmartPayCheckoutOptions } from "../../../../../../lib/smartpay-checkout-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const options = await currentSmartPayCheckoutOptions();
    return NextResponse.json({ options });
  } catch (error) {
    console.warn("SmartPay5 checkout option lookup failed", error instanceof Error ? error.message.slice(0, 160) : "unknown");
    return NextResponse.json({ error: "On-chain payment options are temporarily unavailable" }, { status: 502 });
  }
}
