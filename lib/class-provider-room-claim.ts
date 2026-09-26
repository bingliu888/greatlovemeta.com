// Adapted from SmartMeeting v2 Gold's provider-room claim contract.
export const CLAIM_CLASS_PROVIDER_ROOM_SQL = `INSERT INTO class_provider_room_claims(room_id,claim_token,claimed_at)
  VALUES(?,?,?) ON CONFLICT(room_id) DO UPDATE SET claim_token=excluded.claim_token,claimed_at=excluded.claimed_at
  WHERE class_provider_room_claims.claimed_at<?`;

export const ATTACH_CLASS_PROVIDER_ROOM_SQL = `UPDATE class_rooms SET provider_meeting_id=?,stream_active=1,mute_all=0,updated_at=?
  WHERE id=? AND provider_meeting_id IS NULL`;
