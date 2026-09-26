// Include soft-hidden rows because the room's R2 objects still exist.
export const CLASS_ROOM_OBJECT_KEYS_SQL = `SELECT r2_key AS r2Key FROM class_playlist_items
  WHERE room_id=? AND r2_key IS NOT NULL
  UNION SELECT object_key AS r2Key FROM class_materials WHERE room_id=?
  UNION SELECT object_key AS r2Key FROM class_room_audio_notes WHERE room_id=?`;

export const CLASS_AUDIO_NOTE_ENTITLEMENT_SQL = `SELECT 1 AS eligible FROM subscriptions
  WHERE user_id=? AND status='active' AND COALESCE(current_period_ends_at,0)>? LIMIT 1`;
