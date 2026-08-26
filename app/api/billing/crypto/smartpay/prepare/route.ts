import { NextResponse } from "next/server";
import { requireMember } from "../../../../../../lib/member";
import { ensureReferralCode } from "../../../../../../lib/referrals";
import { currentSmartPayCheckoutOption } from "../../../../../../lib/smartpay-checkout-server";
import type { CryptoSubscriptionPlan } from "../../../../../../lib/crypto-subscription";

export const dynamic = "force-dynamic";

function billingPlan(value: unknown): CryptoSubscriptionPlan {
  return value === "annual" ? "annual" : "monthly";
}

export async function POST(request: Request) {
  try {
    const member = await requireMember();
    const input = await request.json().catch(() => null) as { settingId?: string; plan?: string } | null;
    const settingId = String(input?.settingId || "");
    if (!settingId) return NextResponse.json({ error: "Select an on-chain payment option" }, { status: 400 });
    const option = await currentSmartPayCheckoutOption(settingId, billingPlan(input?.plan));
    if (!option) {
      return NextResponse.json({ error: "This payment option is not currently enabled on-chain" }, { status: 409 });
    }
    const referral = await ensureReferralCode(member.id);
    return NextResponse.json({ option, refId: referral.code });
  } catch (error) {
    if (error instanceof Response) return error;
    console.warn("On-chain payment preparation failed", error instanceof Error ? error.message.slice(0, 160) : "unknown");
    return NextResponse.json({ error: "Unable to prepare this on-chain payment" }, { status: 502 });
  }
}
