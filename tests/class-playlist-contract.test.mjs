import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("class playlist uses independent D1, R2, and RealtimeKit publishing", () => {
  const migrations = fs.readdirSync(new URL("../drizzle", import.meta.url)).filter((name) => name.endsWith("_classroom_playlists.sql"));
  assert.equal(migrations.length, 1);
  const migration = read("drizzle/" + migrations[0]);
  const route = read("app/api/classes/[code]/playlist/route.ts");
  const room = read("components/class-room-client.tsx");
  const broadcaster = read("components/ClassPlaylistBroadcaster.tsx");
  const config = read("wrangler.cloudflare.jsonc");
  assert.match(migration, /CREATE TABLE class_playlist_items/);
  assert.match(migration, /CREATE TABLE class_playlist_state/);
  assert.match(route, /env\.CLASS_FILES/);
  assert.match(route, /classes\/\$\{room\.id\}\/playlist/);
  assert.match(config, /"binding":\s*"CLASS_FILES"/);
  assert.match(room, /ClassPlaylistManager/);
  assert.match(room, /ClassPlaylistBroadcaster/);
  assert.match(room, /__smartClassStopPlaylist/);
  assert.match(broadcaster, /captureStream\(30\)/);
  assert.match(broadcaster, /meeting\.self\.enableAudio\(audioTrack\)/);
  assert.match(broadcaster, /meeting\.self\.enableVideo\(videoTrack\)/);
  assert.match(broadcaster, /\(index \+ 1\) % items\.length/);
});

