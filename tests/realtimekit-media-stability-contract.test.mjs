import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("classroom controls use live tracks and independently repair receivers", () => {
  const client = read("components/class-room-client.tsx");
  const cssPath = existsSync("app/classes/classes.css")
    ? "app/classes/classes.css"
    : "app/[lang]/classes/classes.css";
  const css = read(cssPath);

  assert.match(client, /createLocalMediaHealthMonitor/);
  assert.match(client, /createRemoteMediaRecovery/);
  assert.match(client, /participants\.subscribe\(ids,\s*\["audio"\]\)/);
  assert.match(client, /participants\.subscribe\(ids,\s*\["video"\]\)/);
  assert.doesNotMatch(client, /participants\.subscribe\(ids,\s*\["audio",\s*"video"\]\)/);
  assert.match(client, /pendingMedia\?\.mic \?\? mic/);
  assert.match(client, /speakerPlaybackState\(\{/);
  assert.match(client, /speakerControlAppearance\(speakerState\)/);
  assert.match(client, /mediaOperationBusy\.current/);
  assert.match(client, /addingSecondDevice/);
  assert.match(css, /button\.pending\{border-color:#d86b19;background:#e77820/);
});
