import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const source = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("class managers and paid subscribers have durable independent storage", () => {
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

test("paid trial classes enforce seven days and an active subscriber list", () => {
  const managers = source("../lib/class-managers.ts");
  const classrooms = source("../lib/classrooms.ts");
  assert.match(managers, /7 \* 24 \* 60 \* 60/);
  assert.match(managers, /current\?\.status==="active"/);
  assert.match(managers, /reason:"PAYMENT_REQUIRED"/);
  assert.match(classrooms, /paidClassAccess\(room,user,startTrial\)/);
});

test("class item exposes type badges, edit, co-hosts, and conditional subscribers", () => {
  const detail = source("../components/class-detail-experience.tsx");
  const managers = source("../components/ClassAccessManagers.tsx");
  const editor = source("../components/ClassEditDialog.tsx");
  assert.match(detail, /class-entry-badges/);
  assert.match(detail, /showSubscribers=\{room\.tuitionCents>0\}/);
  assert.match(managers, /Co-hosts/);
  assert.match(managers, /Subscribers/);
  assert.match(editor, /Price \(USD\)/);
  assert.match(editor, /Audio \/ Video \(AV\)/);
});

test("class creation authority is presented as Hosts", () => {
  const candidates = ["../app/admin-dashboard.tsx", "../components/AdminDashboard.tsx", "../components/admin-dashboard.tsx"];
  const roleCandidates = ["../app/admin-role-editor.tsx", "../components/AdminMemberRoleEditor.tsx"];
  const dashboardPath = candidates.find(item => existsSync(new URL(item, import.meta.url)));
  const rolePath = roleCandidates.find(item => existsSync(new URL(item, import.meta.url)));
  assert.ok(dashboardPath);
  const dashboard = source(dashboardPath);
  const roles = rolePath ? source(rolePath) : "Host";
  assert.match(`${dashboard}\n${roles}`, /Hosts|主持人/);
  assert.doesNotMatch(dashboard, /Administrators|管理管理员/);
});
