export const CLAIM_IDLE_CLASS_PROVIDER_TEARDOWN_SQL=`INSERT INTO class_provider_teardown_jobs
  (provider_meeting_id,room_id,attempts,last_error,requested_at,updated_at)
  SELECT provider_meeting_id,id,0,NULL,?,? FROM class_rooms
  WHERE id=? AND provider_meeting_id IS NOT NULL AND stream_active=1
    AND updated_at<=?
    AND NOT EXISTS (SELECT 1 FROM class_media_presence p
      WHERE p.room_id=class_rooms.id AND p.active=1
        AND (p.mic_on=1 OR p.camera_on=1) AND p.last_seen_at>?)
  ON CONFLICT(provider_meeting_id) DO NOTHING`;
