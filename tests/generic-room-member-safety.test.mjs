import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const existing = paths => paths.find(path => existsSync(new URL(path, import.meta.url)));

test("room entry tiles never turn into ended-session notices", () => {
  const roomPath = existing(["../components/class-detail-experience.tsx", "../components/MeetingRoom.tsx"]);
  assert.ok(roomPath, "room entry component is required");
  const room = read(roomPath);
  assert.doesNotMatch(room, /ended=room\.startsAt|const ended=meetingStatus|本次课程已结束|Class session ended|会议已结束；|Meeting has ended|This meeting has ended\. The room/);
});

test("admin member lists cannot delete or remove member accounts", () => {
  const routePath = "../app/api/admin/members/[memberId]/route.ts";
  if (!existsSync(new URL(routePath, import.meta.url))) return;
  const actionsPath = "../components/AdminMemberActions.tsx";
  const pagePath = existing(["../app/admin/members/page.tsx", "../app/[lang]/admin/members/page.tsx"]);
  assert.ok(pagePath, "admin member list is required");
  assert.doesNotMatch(read(routePath), /export async function DELETE/);
  assert.doesNotMatch(read(actionsPath), /AdminMemberDelete|method:\s*"DELETE"/);
  assert.doesNotMatch(read(pagePath), /AdminMemberDelete/);
});
