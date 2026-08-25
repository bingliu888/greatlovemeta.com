import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminMemberRoleEditor } from "../../../../../components/AdminMemberRoleEditor";
import { SiteHeader } from "../../../../../components/SiteHeader";
import { SiteFooter } from "../../../../../components/SiteFooter";
import { isBootstrapAdminEmail } from "../../../../../lib/admin-access";
import { getDatabase, getSessionUser } from "../../../../../lib/auth";
import { safeSiteLanguage } from "../../../../../lib/site-locale";
import "../../admin.css";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  email: string;
  displayName: string;
  role: "member" | "admin";
  createdAt: number;
};

export default async function Page({ params }: { params: Promise<{ lang: string; memberId: string }> }) {
  const { lang: raw, memberId } = await params;
  const lang = safeSiteLanguage(raw);
  const contentLang = lang === "zh" ? "zh" : "en";
  const requestHeaders = await headers();
  const admin = await getSessionUser(new Request("https://site.invalid", {
    headers: { cookie: requestHeaders.get("cookie") ?? "" },
  }));
  if (!admin) redirect(`/${lang}/auth/login`);
  if (admin.email.trim().toLowerCase() !== "bingliu@cybeye.com") redirect(`/${lang}/dashboard`);
  const member = await getDatabase()
    .prepare("SELECT u.id,u.email,u.display_name AS displayName,COALESCE(r.role,CASE WHEN lower(u.email)='bingliu@cybeye.com' THEN 'admin' ELSE 'member' END) AS role,u.created_at AS createdAt FROM users u LEFT JOIN platform_user_roles r ON r.user_id=u.id WHERE u.id=? LIMIT 1")
    .bind(memberId)
    .first<Row>();
  if (!member) notFound();
  const zh = lang === "zh";
  return <main>
    <SiteHeader lang={lang}/>
    <div className="admin-shell">
      <a href={`/${lang}/admin/members`}>← {zh ? "会员列表" : "Members"}</a>
      <div className="admin-detail-grid">
        <section className="admin-detail">
          <h1>{member.displayName}</h1>
          <dl>
            <div><dt>{zh ? "邮箱" : "Email"}</dt><dd>{member.email}</dd></div>
            <div><dt>{zh ? "加入日期" : "Joined"}</dt><dd>{new Date(member.createdAt * 1000).toLocaleDateString()}</dd></div>
          </dl>
        </section>
        <aside className="admin-detail">
          <h2>{zh ? "角色管理" : "Role management"}</h2>
          <AdminMemberRoleEditor
            memberId={member.id}
            initialRole={member.role}
            lang={contentLang}
            locked={isBootstrapAdminEmail(member.email) || member.id === admin.id}
          />
        </aside>
      </div>
    </div>
    <SiteFooter lang={lang}/>
  </main>;
}
