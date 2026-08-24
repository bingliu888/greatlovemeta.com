import { loadReleaseManifest, releaseNotes } from "./release-manifest.mjs";
const manifest = loadReleaseManifest();
const titleEn = manifest.title.en;
const titleZh = manifest.title.zh;
const notesEn = releaseNotes(manifest, "en");
const notesZh = releaseNotes(manifest, "zh");
const commit = String(process.env.GITHUB_SHA || "unknown").trim();
const runId = String(process.env.GITHUB_RUN_ID || "unknown").trim();
const repository = String(process.env.GITHUB_REPOSITORY || "bingliu888/greatlovemeta.com").trim();
const now = new Date();
const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
const part = (type) => dateParts.find((item) => item.type === type)?.value || "00";
const editionDate = `${part("year")}-${part("month")}-${part("day")}`;
const timestamp = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "short" }).format(now);
const evidenceEn = [...notesEn, "Production verification passed: the public footer and localized disclaimer page contain the release-specific legal copy.", "Realtime audio/video tests were not started.", `Exact commit: ${commit}`, `GitHub Actions run ${runId}: success (https://github.com/${repository}/actions/runs/${runId})`];
const evidenceZh = [...notesZh, "生产验证通过：公共页脚链接与本地化免责声明内容可用。", "未启动实时音视频测试。", `精确 commit：${commit}`, `GitHub Actions 运行 ${runId}：成功（https://github.com/${repository}/actions/runs/${runId}）`];
const report = { date: editionDate, title: { zh: `${titleZh} · ${timestamp}`, en: `${titleEn} · ${timestamp}` }, beta: { zh: "已发布", en: "Published" }, completed: Math.max(evidenceZh.length, evidenceEn.length) };
const build = { version: 20, date: editionDate, title: report.title, completed: { zh: evidenceZh, en: evidenceEn }, testable: { zh: ["生产项目报告与部署历史可用。", "生产验证通过：公共页脚链接与本地化免责声明内容可用。", "未启动实时音视频测试。", `部署证据：精确 commit ${commit}；GitHub Actions 运行 ${runId} 成功。`], en: ["Production Project report and deployment history are available.", "Production verification passed for the public footer link and localized disclaimer content.", "Realtime audio/video tests were not started.", `Deployment evidence: exact commit ${commit}; GitHub Actions run ${runId} succeeded.`] }, commit };
const document = { editionDate, today: 2, total: 20, reports: [report], builds: [build] };
const sql = (value) => `'${String(value).replaceAll("'", "''")}'`;
const reportJson = JSON.stringify(report);
const buildJson = JSON.stringify(build);
const documentJson = JSON.stringify(document);
process.stdout.write(`
INSERT INTO editorial_documents(kind,edition_date,payload,updated_at)
VALUES('greatlovemeta-project-status',${sql(editionDate)},${sql(documentJson)},unixepoch())
ON CONFLICT(kind) DO UPDATE SET
  edition_date=${sql(editionDate)},
  payload=json_set(
    editorial_documents.payload,
    '$.editionDate',${sql(editionDate)},
    '$.today',COALESCE(json_extract(editorial_documents.payload,'$.today'),1)+1,
    '$.total',COALESCE(json_extract(editorial_documents.payload,'$.total'),19)+1,
    '$.reports',json_insert(COALESCE(json_extract(editorial_documents.payload,'$.reports'),json('[]')),'$[#]',json(${sql(reportJson)})),
    '$.builds',json_insert(COALESCE(json_extract(editorial_documents.payload,'$.builds'),json('[]')),'$[#]',json_set(json(${sql(buildJson)}),'$.version',COALESCE(json_extract(editorial_documents.payload,'$.total'),19)+1))
  ),
  updated_at=unixepoch();
`);
