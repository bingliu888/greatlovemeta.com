"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveReferralMedia } from "../lib/referral-media-library";

type Platform = { referral: { code: string; url: string } };

const COPY = {
  zh: {
    eyebrow: "AI 邀请工作室",
    title: "把你的专属邀请变成一张动漫作品。",
    description: "AI 只生成背景；推荐码、链接和品牌文字由网站后期清晰合成，确保内容准确。",
    style: "画面风格",
    anime: "动漫插画（推荐）",
    classic: "国际城市网络（无人）",
    festive: "节庆剪纸动漫",
    minimal: "极简数字身份（无人）",
    prompt: "自定义画风提示词（可选）",
    promptHelp: "例如：水彩动漫、夕阳暖光、国际城市网络。选择“国际城市网络”或“极简数字身份”时，系统会强制不出现人物。",
    promptPlaceholder: "描述颜色、光线、构图、材质或动漫画风…",
    generate: "生成 AI 邀请图",
    generating: "正在生成背景…",
    sharePhoto: "分享图片",
    makeClip: "生成 5 秒短片",
    makingClip: "短片生成中",
    shareClip: "分享短片",
    downloadClip: "下载短片",
    retry: "重新生成",
    clipReady: "5 秒短片已生成，可预览、分享或下载。",
    clipUnsupported: "当前浏览器不支持短片录制，请先分享邀请图片。",
    clipFailed: "短片生成失败，请重试或分享图片。",
    imageFailed: "图片生成失败，请稍后重试。",
    imageLoadFailed: "背景图片无法载入，请重新生成。",
  },
  en: {
    eyebrow: "AI INVITE STUDIO",
    title: "Turn your invitation into an anime-style artwork.",
    description: "AI creates the background only. The site adds the exact brand, referral code and link afterward so every character stays correct.",
    style: "Visual style",
    anime: "Anime illustration (recommended)",
    classic: "Global city network (no people)",
    festive: "Festive paper-cut anime",
    minimal: "Minimal digital identity (no people)",
    prompt: "Custom art direction (optional)",
    promptHelp: "For example: watercolor anime, warm sunset light, connected global cities. Global-network and minimal-identity styles always exclude people.",
    promptPlaceholder: "Describe colors, lighting, composition, materials or anime style…",
    generate: "Generate AI invite",
    generating: "Generating background…",
    sharePhoto: "Share photo",
    makeClip: "Create 5-second clip",
    makingClip: "Creating clip",
    shareClip: "Share clip",
    downloadClip: "Download clip",
    retry: "Generate again",
    clipReady: "Your 5-second clip is ready to preview, share or download.",
    clipUnsupported: "This browser cannot record a clip. Please share the invitation image instead.",
    clipFailed: "The clip could not be created. Please retry or share the image.",
    imageFailed: "Generation failed. Please try again.",
    imageLoadFailed: "The background could not be loaded. Please generate it again.",
  },
} as const;

function recorderType() {
  if (!("MediaRecorder" in window)) return "";
  return ["video/mp4;codecs=h264", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
    .find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export function ShareStudio({ lang }: { lang: "en" | "zh" }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const clipUrlRef = useRef("");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [background, setBackground] = useState("");
  const [style, setStyle] = useState("anime");
  const [stylePrompt, setStylePrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [clipBusy, setClipBusy] = useState(false);
  const [clipProgress, setClipProgress] = useState(0);
  const [clipUrl, setClipUrl] = useState("");
  const [clipType, setClipType] = useState("");
  const [notice, setNotice] = useState("");
  const zh = lang === "zh";
  const t = COPY[lang];

  useEffect(() => {
    fetch("/api/platform").then((response) => response.ok ? response.json() : null).then(setPlatform);
  }, []);

  useEffect(() => () => {
    if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
  }, []);

  function clearClip() {
    if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    clipUrlRef.current = "";
    setClipUrl("");
    setClipType("");
    setClipProgress(0);
  }

  const draw = useCallback(async (source: string) => {
    const node = canvas.current;
    if (!node || !platform) return false;
    const context = node.getContext("2d");
    if (!context) return false;
    const image = new Image();
    image.src = source;
    try {
      await image.decode();
    } catch {
      return false;
    }
    context.clearRect(0, 0, 1024, 1024);
    context.drawImage(image, 0, 0, 1024, 1024);
    const gradient = context.createLinearGradient(0, 480, 0, 1024);
    gradient.addColorStop(0, "rgba(10,38,42,0)");
    gradient.addColorStop(.34, "rgba(10,38,42,.78)");
    gradient.addColorStop(1, "rgba(10,38,42,.98)");
    context.fillStyle = gradient;
    context.fillRect(0, 450, 1024, 574);
    context.fillStyle = "#fffaf0";
    context.font = "700 62px Georgia,serif";
    context.fillText(zh ? "大爱元宇宙" : "GreatLoveMeta.com", 72, 720);
    context.font = "700 40px system-ui";
    context.fillText(zh ? "一起学全球公民，双方各得 100 积分" : "Learn together · 100 points each", 72, 790);
    context.fillStyle = "#e3bd63";
    context.font = "700 36px ui-monospace,monospace";
    context.fillText(`${zh ? "推荐码" : "CODE"}: ${platform.referral.code}`, 72, 858);
    context.fillStyle = "#fffaf0";
    context.font = "700 40px system-ui";
    context.fillText(platform.referral.url, 72, 915);
    return true;
  }, [platform, zh]);

  useEffect(() => {
    if (background && platform) void draw(background);
  }, [background, draw, platform]);

  async function generate() {
    setBusy(true);
    setNotice("");
    clearClip();
    try {
      const response = await fetch("/api/referral-media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: lang, style, stylePrompt: stylePrompt.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.image) {
        setNotice(result.error || t.imageFailed);
        return;
      }
      setBackground(result.image);
      if (platform) {
        if (!(await draw(result.image))) setNotice(t.imageLoadFailed);
        else {
          const blob = await canvasBlob();
          if (blob) await saveReferralMedia(blob, "image", `greatlovemeta-guru-invite-${Date.now()}.png`).catch(() => setNotice(zh ? "图片已生成，但无法保存到作品历史。" : "Image created, but it could not be saved to history."));
        }
      }
    } catch {
      setNotice(t.imageFailed);
    } finally {
      setBusy(false);
    }
  }

  function canvasBlob() {
    return new Promise<Blob | null>((resolve) => canvas.current?.toBlob(resolve, "image/png"));
  }

  async function shareFile(file: File) {
    if (!platform) return false;
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      const text = zh
        ? `和我一起学习全球公民。填写推荐码 ${platform.referral.code}，双方各得 100 积分。\n${platform.referral.url}`
        : `Learn GreatLove Meta with me. Add referral code ${platform.referral.code} and we each receive 100 points.\n${platform.referral.url}`;
      await navigator.share({ title: zh ? "大爱元宇宙" : "GreatLoveMeta.com", text, url: platform.referral.url, files: [file] });
      return true;
    }
    return false;
  }

  async function sharePhoto() {
    const blob = await canvasBlob();
    if (!blob) return;
    const file = new File([blob], "greatlovemeta-guru-invite.png", { type: "image/png" });
    if (await shareFile(file)) return;
    await navigator.clipboard?.writeText(platform?.referral.url || "").catch(() => undefined);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    setNotice(zh ? "图片已下载，推荐链接也已复制。请在微信、Telegram、Messenger、X 或 Facebook 中附加图片并粘贴链接。" : "The image was downloaded and the referral link copied. Attach the image in WeChat, Telegram, Messenger, X, or Facebook and paste the link.");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function makeClip() {
    const node = canvas.current;
    const mimeType = recorderType();
    if (!node || !platform || typeof MediaRecorder === "undefined" || typeof node.captureStream !== "function") {
      setNotice(t.clipUnsupported);
      return;
    }
    setClipBusy(true);
    setClipProgress(0);
    setNotice("");
    clearClip();
    const stream = node.captureStream(24);
    const chunks: BlobPart[] = [];
    let stillUrl = "";
    try {
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      const stopped = new Promise<void>((resolve, reject) => {
        recorder.onstop = () => resolve();
        recorder.onerror = () => reject(new Error("recording failed"));
      });
      const base = await canvasBlob();
      if (!base) throw new Error("canvas unavailable");
      const still = new Image();
      stillUrl = URL.createObjectURL(base);
      still.src = stillUrl;
      await still.decode();
      const context = node.getContext("2d");
      if (!context) throw new Error("canvas unavailable");
      recorder.start(250);
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const frame = (time: number) => {
          const progress = Math.min((time - start) / 5000, 1);
          setClipProgress(Math.max(1, Math.ceil(progress * 5)));
          context.clearRect(0, 0, 1024, 1024);
          context.save();
          const eased = 1 - Math.pow(1 - progress, 3);
          const scale = 1.035 + eased * .075;
          const driftX = Math.sin(progress * Math.PI) * 13;
          const driftY = -eased * 10;
          context.translate(512 + driftX, 512 + driftY);
          context.rotate(Math.sin(progress * Math.PI * 2) * .0035);
          context.scale(scale, scale);
          context.drawImage(still, -512, -512, 1024, 1024);
          context.restore();

          const sweepX = -420 + progress * 1880;
          const sweep = context.createLinearGradient(sweepX - 230, 0, sweepX + 230, 1024);
          sweep.addColorStop(0, "rgba(255,226,151,0)");
          sweep.addColorStop(.5, `rgba(255,232,173,${.12 * Math.sin(progress * Math.PI)})`);
          sweep.addColorStop(1, "rgba(255,226,151,0)");
          context.fillStyle = sweep;
          context.fillRect(0, 0, 1024, 1024);

          for (let index = 0; index < 18; index++) {
            const phase = (progress * .62 + index * .137) % 1;
            const x = (index * 173 + 91) % 1024 + Math.sin(progress * 6 + index) * 18;
            const y = 1050 - phase * 980;
            const radius = 1.8 + (index % 4) * .8;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fillStyle = `rgba(245,202,105,${Math.sin(phase * Math.PI) * .58})`;
            context.fill();
          }

          const vignette = context.createRadialGradient(512, 470, 280, 512, 512, 760);
          vignette.addColorStop(0, "rgba(7,25,28,0)");
          vignette.addColorStop(1, "rgba(7,25,28,.24)");
          context.fillStyle = vignette;
          context.fillRect(0, 0, 1024, 1024);
          if (progress < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      recorder.stop();
      await stopped;
      const actualType = recorder.mimeType || mimeType;
      const blob = new Blob(chunks, { type: actualType });
      if (!blob.size) throw new Error("empty recording");
      const url = URL.createObjectURL(blob);
      clipUrlRef.current = url;
      setClipUrl(url);
      setClipType(actualType);
      setNotice(t.clipReady);
      const extension = actualType.includes("mp4") ? "mp4" : "webm";
      await saveReferralMedia(blob, "video", `greatlovemeta-guru-invite-${Date.now()}.${extension}`).catch(() => setNotice(zh ? "短片已生成，但无法保存到作品历史。" : "Clip created, but it could not be saved to history."));
    } catch {
      setNotice(t.clipFailed);
    } finally {
      stream.getTracks().forEach((track) => track.stop());
      if (stillUrl) URL.revokeObjectURL(stillUrl);
      if (background) await draw(background);
      setClipBusy(false);
    }
  }

  async function shareClip() {
    if (!clipUrl) return;
    const blob = await fetch(clipUrl).then((response) => response.blob());
    const extension = clipType.includes("mp4") ? "mp4" : "webm";
    const file = new File([blob], `greatlovemeta-guru-invite.${extension}`, { type: clipType });
    if (await shareFile(file)) return;
    downloadClip();
  }

  function downloadClip() {
    if (!clipUrl) return;
    const extension = clipType.includes("mp4") ? "mp4" : "webm";
    const link = document.createElement("a");
    link.href = clipUrl;
    link.download = `greatlovemeta-guru-invite.${extension}`;
    link.click();
  }

  return (
    <section className="share-studio">
      <div className="share-controls">
        <p className="eyebrow jade">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p>{t.description}</p>
        <label>{t.style}
          <select value={style} onChange={(event) => setStyle(event.target.value)}>
            <option value="anime">{t.anime}</option>
            <option value="classic">{t.classic}</option>
            <option value="festive">{t.festive}</option>
            <option value="minimal">{t.minimal}</option>
          </select>
        </label>
        <label>{t.prompt}
          <textarea maxLength={240} rows={3} value={stylePrompt} onChange={(event) => setStylePrompt(event.target.value)} placeholder={t.promptPlaceholder} />
          <small>{t.promptHelp}</small>
        </label>
        <button onClick={generate} disabled={busy}>{busy ? t.generating : background ? t.retry : t.generate}</button>
        {notice && <p className="share-notice" aria-live="polite">{notice}</p>}
      </div>
      <div className="share-preview">
        <canvas ref={canvas} width="1024" height="1024" aria-label={zh ? "邀请图预览" : "Invitation preview"} />
        <div className="share-actions">
          <button disabled={!background || clipBusy} onClick={sharePhoto}>{t.sharePhoto}</button>
          <button disabled={!background || clipBusy} onClick={makeClip}>
            {clipBusy ? `${t.makingClip} ${clipProgress}/5` : t.makeClip}
          </button>
        </div>
        {clipUrl && (
          <section className="clip-result" aria-live="polite">
            <video src={clipUrl} controls playsInline preload="metadata" />
            <div>
              <button onClick={shareClip}>{t.shareClip}</button>
              <button className="secondary" onClick={downloadClip}>{t.downloadClip}</button>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
