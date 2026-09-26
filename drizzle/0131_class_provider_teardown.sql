CREATE TABLE IF NOT EXISTS class_provider_teardown_jobs (
  provider_meeting_id TEXT PRIMARY KEY NOT NULL,
  room_id TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  requested_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS class_provider_teardown_room_idx
  ON class_provider_teardown_jobs(room_id,updated_at);
