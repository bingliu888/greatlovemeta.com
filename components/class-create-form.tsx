"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function defaultStartTime() {
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);
  return nextHour.toISOString().slice(0, 16);
}

export function ClassCreateForm({ lang }: { lang: "en" | "zh" }) {
  const zh = lang === "zh";
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [startsAt, setStartsAt] = useState(defaultStartTime);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const form = new FormData(event.currentTarget);
      const payload = Object.fromEntries(form.entries());
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({})) as { code?: string; error?: string };
      if (response.ok && result.code) {
        router.push(`/${lang}/classes/${result.code}`);
        return;
      }
      setError(result.error || (zh ? "无法创建课程" : "Unable to create course"));
    } catch {
      setError(zh ? "无法创建课程" : "Unable to create course");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="class-form" onSubmit={submit}>
      <label>{zh ? "课程标题" : "Course title"}<input name="title" required minLength={3} maxLength={120} /></label>
      <label>{zh ? "主题" : "Subject"}<input name="subject" maxLength={80} /></label>
      <label>{zh ? "介绍" : "Description"}<textarea name="description" maxLength={2000} /></label>
      <div>
        <label>{zh ? "课程类型" : "Course type"}<select name="classType" defaultValue="public"><option value="public">{zh ? "公开课程" : "Open course"}</option><option value="trial">{zh ? "推荐课程" : "Referred course"}</option><option value="private">{zh ? "专属课堂" : "Private course"}</option></select></label>
        <label>{zh ? "媒体模式" : "Media"}<select name="streamingMode" defaultValue="video"><option value="video">{zh ? "音频与视频" : "Audio / Video"}</option><option value="audio">{zh ? "仅音频" : "Audio only"}</option></select></label>
        <label>{zh ? "互动模式" : "Interaction"}<select name="realtimeMode" defaultValue="group_call"><option value="group_call">{zh ? "群组通话 · 最多 100 人互动" : "Group call · up to 100 interactive participants"}</option><option value="webinar">{zh ? "网络研讨会 · 举手上台，最多 9 人" : "Webinar · viewers raise hand, 9 on stage"}</option><option value="livestream">{zh ? "直播 · 指定嘉宾，最多 9 人" : "Livestream · invited speakers, 9 on stage"}</option></select></label>
      </div>
      <div>
        <label>{zh ? "开始时间" : "Start time"}<input name="startsAt" type="datetime-local" required value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
        <label>{zh ? "时长（分钟）" : "Duration (minutes)"}<input name="durationMinutes" type="number" min={15} max={480} defaultValue={60} /></label>
      </div>
      <div>
        <label>{zh ? "试课期限" : "Trial period"}<input readOnly value={zh ? "7 天" : "7 days"} /></label>
        <label>{zh ? "课程价格（美元）" : "Course price (USD)"}<input name="tuition" type="number" min={0} step="0.01" defaultValue={99} /></label>
      </div>
      <label>{zh ? "专属课堂邀请邮箱" : "Private-course invitation emails"}<textarea name="invites" placeholder="name@example.com, another@example.com" /></label>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy}>{busy ? (zh ? "正在创建…" : "Creating…") : (zh ? "创建课程" : "Create course")}</button>
    </form>
  );
}
