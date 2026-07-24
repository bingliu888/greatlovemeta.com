type Config = { clientId: string; clientSecret: string; webhookId: string; baseUrl: string };

async function setting(name: string) { const { env } = await import("cloudflare:workers"); return (env as unknown as Record<string, string | undefined>)[name]?.trim() ?? ""; }

export async function getPayPalConfig(): Promise<Config | null> {
  const clientId = await setting("PAYPAL_CLIENT_ID");
  const clientSecret = await setting("PAYPAL_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, webhookId: await setting("PAYPAL_WEBHOOK_ID"), baseUrl: await setting("PAYPAL_ENVIRONMENT") === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com" };
}

export async function getPlanId(cadence: "monthly" | "annual", referral: boolean) {
  return setting(`PAYPAL_${cadence.toUpperCase()}${referral ? "_REFERRAL" : ""}_PLAN_ID`);
}

export async function getPublishedPrices() {
  return { currency: "USD", monthly: await setting("PUBLIC_MONTHLY_PRICE"), annual: await setting("PUBLIC_ANNUAL_PRICE"), trialDays: 7, referralDiscountPercent: 15 };
}

async function token(config: Config) {
  const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, { method: "POST", headers: { authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`, "content-type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  if (!response.ok) throw new Error("PayPal authentication failed");
  return ((await response.json()) as { access_token: string }).access_token;
}

export async function callPayPal<T>(config: Config, path: string, init: RequestInit = {}) {
  const response = await fetch(`${config.baseUrl}${path}`, { ...init, headers: { authorization: `Bearer ${await token(config)}`, "content-type": "application/json", ...(init.headers ?? {}) } });
  const body = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(body.message || "PayPal request failed");
  return body;
}
