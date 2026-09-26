-- An uncertain POST /meetings must be discovered before another generation starts.
CREATE TABLE IF NOT EXISTS class_provider_create_attempts (
  room_id TEXT PRIMARY KEY NOT NULL REFERENCES class_rooms(id) ON DELETE CASCADE,
  correlation_id TEXT NOT NULL UNIQUE,
  provider_title TEXT NOT NULL,
  provider_meeting_id TEXT,
  discovery_attempts INTEGER NOT NULL DEFAULT 0,
  no_match_confirmations INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  deadline_at INTEGER NOT NULL,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS class_provider_create_due_idx
  ON class_provider_create_attempts(next_attempt_at,updated_at);
