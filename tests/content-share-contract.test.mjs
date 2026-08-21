import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");
test("course hosts and co-hosts have unified content sharing",async()=>{
  const [share,studio]=await Promise.all([read("components/class-screen-share.tsx"),read("components/class-content-share.tsx")]);
  assert.match(share,/ensureCompanionStage/);
  assert.match(share,/getUserMedia\(\{audio:false,video:true\}\)/);
  assert.match(share,/ClassVideoContentShare/);
  assert.match(share,/maxTouchPoints\|\|0\)>1/);
  assert.match(studio,/captureStream\(15\)/);
  assert.match(studio,/onPointerDown/);
  assert.match(studio,/onWheel/);
  assert.match(studio,/"file" \| "web" \| "whiteboard"/);
});
