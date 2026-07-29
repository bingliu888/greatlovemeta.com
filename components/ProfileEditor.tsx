"use client";

import { useEffect, useState } from "react";
import { prepareAvatarUpload } from "./avatar-image";
import { TextSizeControl } from "./TextSizeControl";

type Introducer = { displayName: string; status: string } | null;

export function ProfileEditor({ lang, email, initialName, initialWalletAddress = "", initialIntroducer, initialImageUrl = "" }: { lang: "en" | "zh"; email: string; initialName: string; initialWalletAddress?: string; initialIntroducer: Introducer; initialImageUrl?: string }) {
  const zh = lang === "zh";
  const [displayName, setDisplayName] = useState(initialName);
  const [walletAddress, setWalletAddress] = useState(initialWalletAddress);
  const [walletEditing, setWalletEditing] = useState(!initialWalletAddress);
  const [introducer, setIntroducer] = useState<Introducer>(initialIntroducer);
  const [referralInput, setReferralInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);

  useEffect(() => {
    if (initialWalletAddress) return;
    void fetch("/api/profile", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        const savedWallet = result?.profile?.walletAddress;
        if (typeof savedWallet === "string" && savedWallet) {
          setWalletAddress(savedWallet);
          setWalletEditing(false);
        }
      })
      .catch(() => undefined);
  }, [initialWalletAddress]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const normalizedWallet = walletAddress.trim();
    if (normalizedWallet && !/^0x[a-fA-F0-9]{40}$/.test(normalizedWallet)) {
      setMessage(zh ? "请输入有效的 EVM 钱包地址（0x 开头）。" : "Enter a valid EVM wallet address beginning with 0x.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName, preferredLanguage: lang, walletAddress: normalizedWallet }) });
      if (!response.ok) throw new Error();
      setWalletAddress(normalizedWallet);
      setWalletEditing(false);
      setMessage(zh ? "个人资料已保存。" : "Profile saved.");
    } catch {
      setMessage(zh ? "保存失败，请重试。" : "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file?: File, input?: HTMLInputElement) {
    if (!file) return;
    if (input) input.value = "";
    setPhotoInputKey((value) => value + 1);
    const accepted = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!accepted.has(file.type)) {
      setMessage(zh ? "请选择 JPG、PNG 或 WebP 照片。" : "Choose a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage(zh ? "照片不能超过 5 MB。" : "Photo must be 5 MB or smaller.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const avatarFile = await prepareAvatarUpload(file);
      const form = new FormData();
      form.set("file", avatarFile);
      const response = await fetch("/api/profile", { method: "POST", body: form });
      const result = await response.json() as { imageUrl?: string };
      if (!response.ok || !result.imageUrl) throw new Error();
      setImageUrl(result.imageUrl);
      setMessage(zh ? "头像已更新并自动居中裁切。" : "Profile photo updated and centered automatically.");
    } catch {
      setMessage(zh ? "头像上传失败，请选择 JPG、PNG 或 WebP。" : "Photo upload failed. Choose a JPG, PNG, or WebP image.");
    } finally {
      setBusy(false);
    }
  }

  async function addIntroducer(event: React.FormEvent) {
    event.preventDefault();
    const referralCode = referralInput.trim().toUpperCase();
    if (!referralCode) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/platform", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "claim_referral", referralCode }) });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const errors: Record<string, string> = zh
          ? { invalid: "推荐码无效。", self: "不能使用自己的推荐码。", assigned: "推荐关系已经记录。" }
          : { invalid: "That referral code is invalid.", self: "You cannot use your own referral code.", assigned: "An introducer is already recorded." };
        throw new Error(errors[data.reason] || (zh ? "无法添加介绍人。" : "Could not add introducer."));
      }
      const profileResponse = await fetch("/api/profile");
      const profileData = profileResponse.ok ? await profileResponse.json() : null;
      setIntroducer(profileData?.introducer ?? null);
      setReferralInput("");
      setMessage(zh ? "介绍人已添加，双方各获得 100 积分。" : "Introducer added. Both members received 100 points.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (zh ? "无法添加介绍人。" : "Could not add introducer."));
    } finally {
      setBusy(false);
    }
  }

  return <div className="account-profile-grid">
    <form className="profile-form" onSubmit={save}>
      <div className="photo-row">
        <div className="profile-photo">{imageUrl ? <img src={imageUrl} alt=""/> : <span>{displayName.slice(0,1).toUpperCase()}</span>}</div>
        <label className="photo-button">{zh ? "上传头像" : "Upload photo"}<input key={photoInputKey} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={event => uploadPhoto(event.target.files?.[0], event.currentTarget)}/></label>
        <small>{zh ? "JPG、PNG 或 WebP，最大 5 MB" : "JPG, PNG, or WebP · 5 MB maximum"}</small>
      </div>
      <label>{zh ? "显示名称" : "Display name"}<input required minLength={2} maxLength={60} value={displayName} onChange={event => setDisplayName(event.target.value)}/></label>
      <div className="wallet-profile-field">
        <div><label htmlFor="profile-wallet">{zh ? "EVM 钱包" : "EVM wallet"}</label><button type="button" onClick={() => setWalletEditing(value => !value)}>{walletEditing ? (zh ? "取消" : "Cancel") : (walletAddress ? (zh ? "修改" : "Edit") : (zh ? "添加" : "Add"))}</button></div>
        <input id="profile-wallet" inputMode="text" autoComplete="off" readOnly={!walletEditing} placeholder="0x…" value={walletAddress} onChange={event => setWalletAddress(event.target.value)} />
        <small>{zh ? "用于游戏奖励兑换；您可随时修改。" : "Used for game reward redemption; you can update it at any time."}</small>
      </div>
      <button className="profile-save" disabled={busy}>{busy ? (zh ? "正在保存…" : "Saving…") : (zh ? "保存个人资料" : "Save profile")}</button>
      {message && <p className="profile-message" role="status">{message}</p>}
    </form>
    <aside className="account-facts">
      <article><span>{zh ? "登录邮箱" : "Sign-in email"}</span><b>{email}</b></article>
      <article><span>{zh ? "介绍人" : "Introducer"}</span>{introducer ? <><b>{introducer.displayName}</b><small>{zh ? (introducer.status === "qualified" ? "推荐奖励已确认" : "推荐关系已记录") : (introducer.status === "qualified" ? "Referral reward confirmed" : "Referral recorded")}</small></> : <><b>{zh ? "暂无介绍人" : "No introducer"}</b><form className="introducer-add" onSubmit={addIntroducer}><input aria-label={zh ? "推荐码" : "Referral code"} placeholder={zh ? "输入 6 位推荐码" : "Enter 6-character code"} value={referralInput} onChange={event => setReferralInput(event.target.value.toUpperCase())} maxLength={6}/><button disabled={busy || referralInput.trim().length !== 6}>{zh ? "添加" : "Add"}</button></form><small>{zh ? "成功添加后不能更换介绍人。" : "Your introducer cannot be changed after it is added."}</small></>}</article>
      <article><span>{zh ? "阅读设置" : "Reading settings"}</span><p>{zh ? "文字大小会应用到网站所有页面。" : "Text size applies across every page."}</p><TextSizeControl lang={lang}/></article>
    </aside>
  </div>;
}
