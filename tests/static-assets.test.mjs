import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("..", import.meta.url).pathname);

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(path.join(directory, entry.name), relative));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }
  return files.sort();
}

test("every migrated public file is preserved byte-for-byte in the Cloudflare artifact", async () => {
  const publicRoot = path.join(root, "public");
  const artifactRoot = path.join(root, "dist", "client");
  const publicFiles = await listFiles(publicRoot);

  assert.ok(publicFiles.length > 20, "expected the migrated public asset library");
  for (const relative of publicFiles) {
    const [source, artifact] = await Promise.all([
      readFile(path.join(publicRoot, relative)),
      readFile(path.join(artifactRoot, relative)),
    ]);
    assert.deepEqual(artifact, source, `Cloudflare artifact changed or omitted ${relative}`);
  }
});
