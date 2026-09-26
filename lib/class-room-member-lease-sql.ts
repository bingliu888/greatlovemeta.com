export const ROOM_MEMBER_LIVE_SECONDS=18;
export const ROOM_TAB_ID=/^[a-f0-9-]{36}$/i;

export const CLAIM_CLASS_ROOM_SQL=`INSERT INTO class_room_member_presence
  (room_id,user_id,tab_id,display_name,entered_at,last_seen_at)
  VALUES (?,?,?,?,?,?)
  ON CONFLICT(room_id,user_id) DO UPDATE SET
    tab_id=excluded.tab_id,display_name=excluded.display_name,
    entered_at=CASE WHEN class_room_member_presence.tab_id=excluded.tab_id
      THEN class_room_member_presence.entered_at ELSE excluded.entered_at END,
    last_seen_at=excluded.last_seen_at
  WHERE class_room_member_presence.tab_id=excluded.tab_id
    OR class_room_member_presence.last_seen_at<?`;

export const RELEASE_CLASS_ROOM_SQL=`DELETE FROM class_room_member_presence
  WHERE room_id=? AND user_id=? AND tab_id=?`;

export const ACTIVE_CLASS_ROOM_TAB_SQL=`SELECT 1 FROM class_room_member_presence
  WHERE room_id=? AND user_id=? AND tab_id=? AND last_seen_at>=? LIMIT 1`;
