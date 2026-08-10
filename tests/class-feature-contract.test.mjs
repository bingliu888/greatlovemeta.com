import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("classroom feature exposes bilingual directory and community entry points",()=>{
  assert.match(read("app/[lang]/classes/page.tsx"),/ClassDirectory/);
  assert.match(read("app/[lang]/page.tsx"),/home-community-classes/);
  assert.match(read("app/[lang]/dashboard/page.tsx"),/My classes|我的课程/);
  assert.match(read("components/CommunityClient.tsx"),/Enter classes|进入课堂/);
});

test("classroom data and media resources are site isolated",()=>{
  const config=read("wrangler.cloudflare.jsonc");
  assert.match(config,/greatlovemeta-com-class-files/);
  assert.match(config,/c8d137ee-863f-4913-9462-8cfd92bb7127/);
  assert.doesNotMatch(config,/0783d28d-15ca-43ca-8877-8c3aedfaff49|6600026b-1e03-40e9-a8cf-49802ca50c2d|40e38988-f116-43bd-91eb-6e5def18cf0c/);
  assert.match(read("drizzle/0099_class_rooms.sql"),/CREATE TABLE IF NOT EXISTS class_rooms/);
  assert.match(read("lib/class-runtime.ts"),/__CLASS_RUNTIME_ENV__/);
});

test("classroom publishing honors group, webinar, and livestream contracts",()=>{
  const rooms=read("lib/classrooms.ts");
  const join=read("app/api/classes/[code]/join/route.ts");
  const media=read("app/api/classes/[code]/media/route.ts");
  const client=read("components/class-room-client.tsx");
  assert.match(rooms,/group_call.*webinar.*livestream/);
  assert.match(join,/participantLimit:room\.realtimeMode==="group_call"\?100:null/);
  assert.match(join,/9-speaker stage is full/);
  assert.match(join,/Raise your hand and wait for host approval/);
  assert.match(join,/member email as a speaker/);
  assert.match(media,/request-stage/);
  assert.match(media,/add-speaker/);
  assert.match(client,/LivestreamPlayer/);
  assert.match(client,/setInterval\(\(\)=>void check\(\),3000\)/);
});
