import { POST as claimSmartPay5Transaction } from "../smartpay/claim/route";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as { settingId?: string; txHash?: string } | null;
  const forwarded = new Request(request.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: request.headers.get("cookie") || ""
    },
    body: JSON.stringify({ settingId: input?.settingId, paymentId: input?.txHash })
  });
  return claimSmartPay5Transaction(forwarded);
}
