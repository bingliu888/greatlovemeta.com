import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("course access labels use Open and 专属 product terminology", async () => {
  const copy = [
    await read("components/class-directory.tsx"),
    await read("components/class-detail-experience.tsx"),
    await read("components/ClassEditDialog.tsx"),
  ].join("\\n");
  for (const label of ["Open course", "公开课程", "Private course", "专属课堂"]) {
    assert.match(copy, new RegExp(label));
  }
  assert.doesNotMatch(copy, /"Public course"|"公课"|"私课"|"私有课程"/);
});

