import { readFile } from "node:fs/promises";

const PUBLIC_ENTRY_FILES = [
  "app/[lang]/page.tsx",
];

const PROTECTED_ROUTE_MARKERS = [
  "/account",
  "/community",
  "/dashboard",
  "/members",
  "/messages",
  "/share",
];

function protectedDestination(linkTag) {
  return PROTECTED_ROUTE_MARKERS.find((route) => linkTag.includes(route)) ||
    (linkTag.includes("/api/game-launch")
      ? "/api/game-launch"
      : "") ||
    (linkTag.includes("/games/") && linkTag.includes("mode=play")
      ? "/games/*?mode=play"
      : "");
}

let failures = 0;
for (const file of PUBLIC_ENTRY_FILES) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  const lines = source.split("\n");
  for (const [index, line] of lines.entries()) {
    for (const linkTag of line.match(/<Link\b[^>]*>/g) ?? []) {
      const destination = protectedDestination(linkTag);
      if (!destination) continue;
      failures += 1;
      console.error(
        `::error file=${file},line=${index + 1}::Anonymous navigation to ${destination} must use <a href> or window.location.assign, not next/link.`,
      );
    }
  }
}

if (failures > 0) {
  console.error(`Protected-navigation policy failed with ${failures} soft navigation violation(s).`);
  process.exitCode = 1;
} else {
  console.log(`Protected-navigation policy passed for ${PUBLIC_ENTRY_FILES.length} public entry file(s).`);
}
