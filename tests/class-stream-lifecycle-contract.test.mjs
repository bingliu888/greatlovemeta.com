import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const media = fs.readFileSync(new URL("../app/api/classes/[code]/media/route.ts", import.meta.url), "utf8");
const client = fs.readFileSync(new URL("../components/class-room-client.tsx", import.meta.url), "utf8");

test("the final manager publisher closes streaming even while viewers remain", () => {
  assert.match(media, /activePublishers/);
  assert.match(media, /access\.manager&&Number\(activePublishers\?\.count\|\|0\)===0/);
  assert.match(client, /livestream\.stop\(\)/);
  assert.match(client, /wasPublishing=Boolean\(client\?\.self\.audioEnabled\|\|client\?\.self\.videoEnabled\)/);
  assert.ok(client.indexOf("client?.livestream.stop()") < client.indexOf("client?.self.disableAudio()"));
  assert.match(client, /for\(let attempt=0;attempt<4&&!cancelled;attempt\+=1\)/);
  assert.match(client, /humanStreamSeen/);
  assert.match(client, /enabled=\{playlistEnabled&&!humanStreamActive&&!humanStreamSeen\}/);
  assert.match(client, /humanSourceActive/);
});
