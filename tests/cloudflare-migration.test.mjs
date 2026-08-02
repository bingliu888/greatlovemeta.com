import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Cloudflare migration export is private, paginated, and non-destructive", async () => {
  const [source, route] = await Promise.all([
    read("../lib/cloudflare-migration.ts"),
    read("../app/api/admin/cloudflare-migration/route.ts"),
  ]);
  assert.match(source, /MIGRATION_EXPORT_SECRET/);
  assert.match(source, /private, no-store/);
  assert.match(source, /SELECT rowid AS __migration_rowid__/);
  assert.match(source, /bucket\.get\(key, \{ range:/);
  assert.doesNotMatch(source, /\b(?:DELETE|DROP|UPDATE|INSERT)\b/);
  assert.match(route, /cloudflareMigrationExport/);
});

