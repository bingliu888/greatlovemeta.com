-- Serialize the first publisher's RealtimeKit room creation across Workers.
CREATE TABLE IF NOT EXISTS class_provider_room_claims (
  room_id TEXT PRIMARY KEY NOT NULL REFERENCES class_rooms(id) ON DELETE CASCADE,
  claim_token TEXT NOT NULL,
  claimed_at INTEGER NOT NULL
);
