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

test("classroom publishing follows manager and eight-speaker controls",()=>{
  assert.match(read("app/api/classes/[code]/media/route.ts"),/PUBLISHER_LIMIT/);
  assert.match(read("app/api/classes/[code]/media/route.ts"),/>=8/);
  assert.match(read("lib/classrooms.ts"),/isAdminUser/);
});
