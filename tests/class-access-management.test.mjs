import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const source = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("course managers and paid subscribers have durable independent storage", () => {
  const migration = source("../drizzle/0109_class_cohosts_subscribers.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS class_cohosts/);
  assert.match(migration, /PRIMARY KEY\s*\(room_id,\s*user_id\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS class_subscriptions/);
  assert.match(migration, /CHECK\s*\(status IN \('trial','active','cancelled','expired'\)\)/);
});

test("host, site host, and co-host share one class-management authority", () => {
  const managers = source("../lib/class-managers.ts");
  const playlist = source("../app/api/classes/[code]/playlist/route.ts");
  const roomApi = source("../app/api/classes/[code]/route.ts");
  assert.match(managers, /user\.id === room\.hostUserId \|\| await isAdminUser\(user\)/);
  assert.match(managers, /isClassCoHost\(room\.id,user\)/);
  assert.match(playlist, /canManageClass/);
  assert.match(roomApi, /canManageClass/);
  assert.match(source("../lib/classrooms.ts"), /if \(!user\) return \[\]/);
  assert.doesNotMatch(source("../lib/classrooms.ts"), /if \(!user \|\| !await isAdminUser\(user\)\) return \[\]/);
});

test("paid trial courses enforce seven days and an active subscriber list", () => {
  const managers = source("../lib/class-managers.ts");
  const classrooms = source("../lib/classrooms.ts");
  assert.match(managers, /7 \* 24 \* 60 \* 60/);
  assert.match(managers, /current\?\.status==="active"/);
  assert.match(managers, /reason:"PAYMENT_REQUIRED"/);
  assert.match(classrooms, /paidClassAccess\(room,user,startTrial\)/);
});

test("course item exposes type badges, edit, co-hosts, and conditional subscribers", () => {
  const detail = source("../components/class-detail-experience.tsx");
  const managers = source("../components/ClassAccessManagers.tsx");
  const editor = source("../components/ClassEditDialog.tsx");
  assert.match(detail, /class-entry-badges/);
  assert.match(detail, /showSubscribers=\{room\.tuitionCents>0\}/);
  assert.match(managers, /Co-teachers/);
  assert.match(managers, /Subscribers/);
  assert.match(editor, /Price \(USD\)/);
  assert.match(editor, /Audio \/ Video \(AV\)/);
});

test("course creation authority is presented as Teachers", () => {
  const candidates = ["../app/admin-dashboard.tsx", "../components/AdminDashboard.tsx", "../components/admin-dashboard.tsx"];
  const roleCandidates = ["../app/admin-role-editor.tsx", "../components/AdminMemberRoleEditor.tsx"];
  const dashboardPath = candidates.find(item => existsSync(new URL(item, import.meta.url)));
  const rolePath = roleCandidates.find(item => existsSync(new URL(item, import.meta.url)));
  assert.ok(dashboardPath);
  const dashboard = source(dashboardPath);
  const roles = rolePath ? source(rolePath) : "Teacher";
  assert.match(`${dashboard}\n${roles}`, /Teachers|教师/);
  assert.doesNotMatch(dashboard, /Administrators|管理管理员/);
});

test("admin Users section exposes paid Teachers and add-teacher access", () => {
  const pageCandidates = ["../app/admin/members/page.tsx", "../app/[lang]/admin/members/page.tsx"];
  const pagePath = pageCandidates.find(item => existsSync(new URL(item, import.meta.url)));
  assert.ok(pagePath);
  const page = source(pagePath);
  const actions = source("../components/AdminMemberActions.tsx");
  const api = source("../app/api/admin/members/route.ts");
  assert.match(page, /teachers/);
  assert.match(page, /Teachers|教师/);
  assert.match(page, /subscriber_override/);
  assert.match(actions, /grant-teacher/);
  assert.match(actions, /Add Teacher|添加教师/);
  assert.match(api, /grant-teacher/);
  assert.match(api, /subscriber_override=1/);
  assert.doesNotMatch(api, /INSERT INTO platform_user_roles/);
  assert.doesNotMatch(actions, /grant-admin/);
});

test("only Teachers and platform administrators can create classrooms", () => {
  const routeCandidates = ["../app/api/classrooms/route.ts", "../app/api/classes/route.ts"];
  const routePath = routeCandidates.find(item => existsSync(new URL(item, import.meta.url)));
  assert.ok(routePath);
  const route = source(routePath);
  assert.match(route, /if\(!await isTeacherUser\(user\)\)/);
  assert.match(route, /Teacher or administrator access required/);
  const access = source("../lib/admin-access.ts");
  assert.match(access, /isTeacherUser/);
  assert.match(access, /subscriber_override/);
});

test("classroom dates render in a stable timezone for server hydration", () => {
  const directoryCandidates = ["../components/class-directory.tsx", "../components/live-class-directory.tsx"];
  const directoryPath = directoryCandidates.find(item => existsSync(new URL(item, import.meta.url)));
  assert.ok(directoryPath);
  assert.match(source(directoryPath), /timeZone:\"America\/Los_Angeles\"/);
  assert.match(source("../components/class-detail-experience.tsx"), /timeZone:\"America\/Los_Angeles\"/);
});

test("exports the classroom directory component", () => {
  assert.match(source("../components/class-directory.tsx"), /export function ClassDirectory/);
});
