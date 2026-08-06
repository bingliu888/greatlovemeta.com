import { getDatabase, getSessionUser } from "../../../../lib/auth";
import { isAdminUser } from "../../../../lib/admin-access";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ signedIn: false });
  const avatar = await getDatabase().prepare("SELECT user_id AS userId FROM user_avatars WHERE user_id = ?").bind(user.id).first<{ userId: string }>();
  return Response.json({
    signedIn: true,
    isAdmin: await isAdminUser(user),
    user: { id: user.id, displayName: user.displayName },
    imageUrl: avatar ? `/api/profile?avatar=${encodeURIComponent(user.id)}` : undefined,
  });
}
