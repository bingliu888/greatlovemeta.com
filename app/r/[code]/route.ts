export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const safeCode = (await params).code.trim().toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(safeCode)) {
    return Response.redirect(new URL("/en/pricing", request.url), 302);
  }
  const headers = new Headers({
    location: new URL(`/en/pricing?ref=${encodeURIComponent(safeCode)}`, request.url).toString(),
  });

  if (safeCode) {
    headers.set("set-cookie", `greatlovemeta_referral_code=${safeCode}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  }

  return new Response(null, { status: 302, headers });
}

export const HEAD = GET;
