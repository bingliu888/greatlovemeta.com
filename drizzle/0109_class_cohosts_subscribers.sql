PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS class_cohosts (
  room_id TEXT NOT NULL REFERENCES class_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(room_id,user_id)
);
CREATE INDEX IF NOT EXISTS class_cohosts_user_idx ON class_cohosts(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS class_subscriptions (
  room_id TEXT NOT NULL REFERENCES class_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'trial' CHECK(status IN ('trial','active','cancelled','expired')),
  trial_started_at INTEGER,
  trial_ends_at INTEGER,
  added_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(room_id,user_id),
  UNIQUE(room_id,email)
);
CREATE INDEX IF NOT EXISTS class_subscriptions_email_idx ON class_subscriptions(email,status,updated_at DESC);
