const titleEn = String(process.env.RELEASE_TITLE || "Production release").trim();
const titleZh = String(process.env.RELEASE_TITLE_ZH || titleEn).trim();
const notesEn = String(process.env.RELEASE_NOTES || titleEn).split("|").map((value) => value.trim()).filter(Boolean);
const notesZh = String(process.env.RELEASE_NOTES_ZH || process.env.RELEASE_NOTES || titleZh).split("|").map((value) => value.trim()).filter(Boolean);
const commit = String(process.env.GITHUB_SHA || "unknown").slice(0, 12);
const runId = String(process.env.GITHUB_RUN_ID || "unknown");
const now = new Date();
const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
const part = (type) => dateParts.find((item) => item.type === type)?.value || "00";
const editionDate = `${part("year")}-${part("month")}-${part("day")}`;
const timestamp = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "short" }).format(now);
const report = { date: editionDate, title: { zh: `${titleZh} · ${timestamp}`, en: `${titleEn} · ${timestamp}` }, beta: { zh: "已发布", en: "Published" }, completed: Math.max(notesZh.length, notesEn.length) };
const build = { version: 20, date: editionDate, title: report.title, completed: { zh: notesZh, en: notesEn }, testable: { zh: ["订阅套餐与页脚入口", "Connect wallet 与加密付款", `GitHub Actions ${runId}`], en: ["Subscription plans and footer entry", "Connect wallet and crypto checkout", `GitHub Actions ${runId}`] }, commit };
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
