import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  HELP_ROOM_INSERT_SQL,
  HELP_ROOM_POINTER_SQL,
  HELP_ROOM_SELECT_SQL,
} from "../lib/help-room-sql.ts";

function database(withAdmin) {
  const db = new DatabaseSync(":memory:");
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT,display_name TEXT,created_at INTEGER,email_verified INTEGER);
    CREATE TABLE platform_user_roles(user_id TEXT PRIMARY KEY REFERENCES users(id),role TEXT);
    CREATE TABLE class_rooms(
      id TEXT PRIMARY KEY,code TEXT UNIQUE,host_user_id TEXT REFERENCES users(id),
      host_email TEXT,host_name TEXT,title TEXT,description TEXT,subject TEXT,
      class_type TEXT,streaming_mode TEXT,realtime_mode TEXT,starts_at INTEGER,
      duration_minutes INTEGER,trial_minutes INTEGER,tuition_cents INTEGER,
      password_hash TEXT,created_at INTEGER,updated_at INTEGER,
      status TEXT DEFAULT 'active'
    );`);
  if (withAdmin) {
    db.exec(`INSERT INTO users VALUES('admin','admin@example.test','Admin',1,1);
      INSERT INTO platform_user_roles VALUES('admin','admin');`);
  }
  return db;
}

const migration = readFileSync(new URL("../drizzle/0133_site_help_room.sql", import.meta.url), "utf8");

test("Help migration creates one ordinary free audio Webinar with no description", () => {
  const db = database(true);
  db.exec(migration);
  const row = db.prepare(`SELECT room.*,help.singleton FROM site_help_rooms help
    JOIN class_rooms room ON room.id=help.room_id`).get();
  assert.equal(row.singleton, 1);
  assert.equal(row.description, "");
  assert.equal(row.class_type, "public");
  assert.equal(row.streaming_mode, "audio");
  assert.equal(row.realtime_mode, "webinar");
  assert.equal(row.tuition_cents, 0);
  assert.equal(db.prepare(HELP_ROOM_SELECT_SQL).get().code, row.code);
  db.close();
});

test("Help room can be provisioned after an admin joins without duplication", () => {
  const db = database(false);
  db.exec(migration);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM site_help_rooms").get().count, 0);
  db.exec(`INSERT INTO users VALUES('admin','admin@example.test','Admin',1,1);
    INSERT INTO platform_user_roles VALUES('admin','admin');`);
  db.prepare(HELP_ROOM_INSERT_SQL).run("site-help-room-v1", "990000", "Help", "", "Help", 1, 1, 1);
  db.prepare(HELP_ROOM_POINTER_SQL).run("site-help-room-v1", "site-help-room-v1");
  db.prepare(HELP_ROOM_POINTER_SQL).run("site-help-room-v1", "site-help-room-v1");
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM site_help_rooms").get().count, 1);
  assert.equal(db.prepare(HELP_ROOM_SELECT_SQL).get().code, "990000");
  db.close();
});
