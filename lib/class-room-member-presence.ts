import { getDatabase } from "@/lib/auth";
import { ACTIVE_CLASS_ROOM_TAB_SQL, CLAIM_CLASS_ROOM_SQL, RELEASE_CLASS_ROOM_SQL, ROOM_MEMBER_LIVE_SECONDS, ROOM_TAB_ID } from "@/lib/class-room-member-lease-sql";
export { ROOM_MEMBER_LIVE_SECONDS, ROOM_TAB_ID } from "@/lib/class-room-member-lease-sql";

export async function claimClassRoomMember(roomId: string, userId: string, tabId: string, displayName: string, now = Math.floor(Date.now()/1000)) {
  if (!ROOM_TAB_ID.test(tabId)) return false;
  const result = await getDatabase().prepare(CLAIM_CLASS_ROOM_SQL)
    .bind(roomId,userId,tabId,displayName.slice(0,80),now,now,now-ROOM_MEMBER_LIVE_SECONDS).run();
  return Number(result.meta?.changes||0)>0;
}

export async function releaseClassRoomMember(roomId: string, userId: string, tabId: string) {
  if (!ROOM_TAB_ID.test(tabId)) return;
  await getDatabase().prepare(RELEASE_CLASS_ROOM_SQL).bind(roomId,userId,tabId).run();
}

export async function hasClassRoomMemberTab(roomId: string, userId: string, tabId: string, now = Math.floor(Date.now()/1000)) {
  if (!ROOM_TAB_ID.test(tabId)) return false;
  return Boolean(await getDatabase().prepare(ACTIVE_CLASS_ROOM_TAB_SQL)
    .bind(roomId,userId,tabId,now-ROOM_MEMBER_LIVE_SECONDS).first());
}

export async function classRoomOnlineMembers(roomId: string, now = Math.floor(Date.now()/1000)) {
  const result = await getDatabase().prepare(`SELECT user_id AS userId,display_name AS displayName,entered_at AS enteredAt
    FROM class_room_member_presence WHERE room_id=? AND last_seen_at>=?
    ORDER BY entered_at,user_id LIMIT 1000`).bind(roomId,now-ROOM_MEMBER_LIVE_SECONDS)
    .run<{userId:string;displayName:string;enteredAt:number}>();
  return result.results||[];
}
