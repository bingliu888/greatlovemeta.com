"use client";

import { useEffect, useState } from "react";
import type { TextAiProviderPreference } from "../lib/text-ai-provider";

export function AiProviderPreference() {
  const [preference, setPreference] = useState<TextAiProviderPreference>("auto");
  const [saved, setSaved] = useState(false);
  const [zh, setZh] = useState(false);

  useEffect(() => {
    setZh(document.documentElement.lang.toLowerCase().startsWith("zh") || location.pathname.startsWith("/zh"));
    fetch("/api/ai-provider", { cache: "no-store" })
      .then(response => response.json())
      .then(data => {
        if (data.preference === "openai" || data.preference === "deepseek") setPreference(data.preference);
      })
      .catch(() => undefined);
  }, []);

  async function update(value: TextAiProviderPreference) {
    setPreference(value);
    setSaved(false);
    const response = await fetch("/api/ai-provider", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ preference: value }),
    });
    setSaved(response.ok);
  }

  const options: Array<{ value: TextAiProviderPreference; title: string; detail: string }> = [
    {
      value: "auto",
      title: zh ? "自动（推荐）" : "Automatic (recommended)",
      detail: zh ? "中国优先使用深度求索极速文字模型，其他地区优先使用月神文字模型。" : "Prefer DeepSeek V4 Flash in China and GPT‑5.6 Luna elsewhere.",
    },
    {
      value: "openai",
      title: "OpenAI GPT‑5.6 Luna",
      detail: zh ? "始终使用月神文字模型。" : "Always use the OpenAI text model.",
    },
    {
      value: "deepseek",
      title: "DeepSeek V4 Flash",
      detail: zh ? "始终使用深度求索文字模型，便于在美国等地区进行对比测试。" : "Always use DeepSeek, including for comparison testing outside China.",
    },
  ];

  return <section aria-labelledby="ai-provider-title" style={{ width: "100%", maxWidth: "none", padding: "clamp(1rem, 3vw, 2rem)", boxSizing: "border-box", border: "1px solid color-mix(in srgb, currentColor 16%, transparent)", borderRadius: "1.25rem", margin: "1.5rem 0", background: "color-mix(in srgb, Canvas 94%, currentColor 6%)" }}>
    <p style={{ margin: "0 0 .4rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{zh ? "人工智能设置" : "AI SETTINGS"}</p>
    <h2 id="ai-provider-title" style={{ margin: "0 0 .5rem", fontSize: "clamp(1.35rem, 3vw, 2rem)" }}>{zh ? "默认文字人工智能模型" : "Default text AI model"}</h2>
    <p style={{ margin: "0 0 1rem", maxWidth: "70ch", overflowWrap: "anywhere" }}>{zh ? "此设置控制智能导师、消息润色及其他交互式文字功能；图片、语音和审核继续使用专用模型。" : "This controls Ask Guru, message polishing, and other interactive text features. Images, voice, and moderation continue to use specialist models."}</p>
    <div style={{ display: "grid", gap: ".75rem" }}>
      {options.map(option => <label key={option.value} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: ".75rem", alignItems: "start", padding: ".85rem 1rem", border: "1px solid color-mix(in srgb, currentColor 14%, transparent)", borderRadius: ".9rem", cursor: "pointer" }}>
        <input type="radio" name="ai-provider-preference" value={option.value} checked={preference === option.value} onChange={() => void update(option.value)} style={{ marginTop: ".25rem" }}/>
        <span style={{ minWidth: 0 }}><strong style={{ display: "block" }}>{option.title}</strong><small style={{ display: "block", marginTop: ".2rem", overflowWrap: "anywhere" }}>{option.detail}</small></span>
      </label>)}
    </div>
    <p role="status" aria-live="polite" style={{ minHeight: "1.4em", margin: ".75rem 0 0" }}>{saved ? (zh ? "已保存。" : "Saved.") : ""}</p>
  </section>;
}

