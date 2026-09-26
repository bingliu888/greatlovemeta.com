CREATE TABLE IF NOT EXISTS class_room_audio_notes (
  id TEXT PRIMARY KEY NOT NULL,
  room_id TEXT NOT NULL REFERENCES class_rooms(id) ON DELETE CASCADE,
  uploader_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK(byte_size BETWEEN 1 AND 104857600),
  recording_seconds INTEGER NOT NULL CHECK(recording_seconds BETWEEN 1 AND 1800),
  source TEXT NOT NULL CHECK(source IN ('browser','file')),
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE INDEX IF NOT EXISTS class_room_audio_notes_room_created_idx
  ON class_room_audio_notes(room_id,created_at DESC);
ALTER TABLE class_materials ADD COLUMN deleted_at INTEGER;
