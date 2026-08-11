import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const join=fs.readFileSync(new URL("../app/api/classes/[code]/join/route.ts",import.meta.url),"utf8");
const media=fs.readFileSync(new URL("../app/api/classes/[code]/media/route.ts",import.meta.url),"utf8");
const client=fs.readFileSync(new URL("../components/class-room-client.tsx",import.meta.url),"utf8");

test("an idle playlist relay uses a constraint-safe atomic claim",()=>{
  assert.match(join,/playlistRequested/);
  assert.match(join,/class_playlist_relay_claims/);
  assert.match(join,/playlistRelay=Number\(claim\.meta\?\.changes\|\|0\)>0/);
  assert.match(join,/!providerMeetingId&&playlistRequested&&!playlistRelay/);
  assert.doesNotMatch(join,/stream_active=2/);
  assert.match(media,/DELETE FROM class_playlist_relay_claims/);
});

test("only the relay owner publishes and stops playlist delivery",()=>{
  assert.match(client,/playlistRelay&&playlistEnabled/);
  assert.doesNotMatch(client,/\(manager\|\|playlistRelay\)&&playlistEnabled/);
  assert.match(client,/onState=\{setPlaylistPublished\}/);
  assert.match(client,/playlistPublished\|\|room\.realtimeMode!=="livestream"/);
  assert.match(client,/playlistRelay\|\|Boolean\(client\?\.self\.audioEnabled\|\|client\?\.self\.videoEnabled\)/);
});
