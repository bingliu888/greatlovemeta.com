CREATE TABLE IF NOT EXISTS class_join_history (
  user_id TEXT NOT NULL,
  room_id TEXT NOT NULL REFERENCES class_rooms(id) ON DELETE CASCADE,
  first_joined_at INTEGER NOT NULL,
  last_joined_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, room_id)
);

CREATE INDEX IF NOT EXISTS class_join_history_user_idx
  ON class_join_history(user_id,last_joined_at DESC);

INSERT OR IGNORE INTO class_join_history(user_id,room_id,first_joined_at,last_joined_at)
SELECT user_id,room_id,last_seen_at,last_seen_at
FROM class_media_presence
WHERE user_id IS NOT NULL;
