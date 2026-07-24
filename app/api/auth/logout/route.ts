import { clearSessionCookie, deleteCurrentSession } from "../../../../lib/auth";

export async function POST(request: Request) {
  await deleteCurrentSession(request);
  return Response.json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } });
}
