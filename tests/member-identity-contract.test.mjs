import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const root = new URL("..", import.meta.url); const read = path => readFile(new URL(path, root), "utf8");
test("Clerk sessions preserve real email and saved display name", async () => { const route=await read("app/api/auth/clerk-session/route.ts"); const auth=await read("lib/auth.ts"); assert.doesNotMatch(route,/@unverified\.invalid|localEmail/); assert.doesNotMatch(auth,/@unverified\.invalid|SET email = \?, display_name = \?/); assert.match(auth,/UPDATE users SET email = \?, email_verified = \? WHERE id = \?/); });
