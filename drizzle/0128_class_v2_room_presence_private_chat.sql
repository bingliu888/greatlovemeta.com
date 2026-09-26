-- V2 Gold room-presence and private support-chat contract.
CREATE TABLE IF NOT EXISTS class_room_member_presence (
  room_id TEXT NOT NULL REFERENCES class_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tab_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  entered_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY(room_id,user_id)
);
CREATE INDEX IF NOT EXISTS class_room_member_presence_live_idx
  ON class_room_member_presence(room_id,last_seen_at);

ALTER TABLE class_chat_messages ADD COLUMN recipient_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS class_chat_visible_idx
  ON class_chat_messages(room_id,sender_user_id,recipient_user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS class_materials (
  id TEXT PRIMARY KEY NOT NULL,
  room_id TEXT NOT NULL REFERENCES class_rooms(id) ON DELETE CASCADE,
  uploader_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  byte_size INTEGER NOT NULL CHECK(byte_size BETWEEN 1 AND 15728640),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS class_materials_room_created_idx
  ON class_materials(room_id,created_at DESC);
