"use client";

import { useReverification, useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError, isReverificationCancelledError } from "@clerk/nextjs/errors";
import { FormEvent, useEffect, useState } from "react";
import { portfolioAuthText } from "./auth-copy.generated";
import { PasswordField } from "./PasswordField";
import styles from "./identity.module.css";

export function PortfolioPasswordSettings({ locale: localeProp }: { locale?: string }) {
  const [detectedLocale, setDetectedLocale] = useState(localeProp || "en");
  const locale = localeProp || detectedLocale;
  const t = (english: string) => portfolioAuthText(locale, english);
  const { isLoaded, user } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const passwordEnabled = Boolean(user?.passwordEnabled);
  const savePassword = useReverification((params: { currentPassword?: string; newPassword: string }) => {
    if (!user) throw new Error(t("Your account is not ready."));
    return user.updatePassword({ ...params, signOutOfOtherSessions: false });
  });

  useEffect(() => {
    if (localeProp) return;
    const root = document.documentElement;
    const sync = () => setDetectedLocale(root.lang || "en");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, [localeProp]);

  function readableError(issue: unknown) {
    if (isReverificationCancelledError(issue)) return t("Your password was not changed because identity confirmation was cancelled.");
    if (isClerkAPIResponseError(issue)) {
      const clerkError = issue.errors[0];
      if (clerkError?.code === "form_password_incorrect") return t("Your current password is incorrect.");
      if (clerkError?.code === "session_reverification_required") return t("Confirm your identity to save the password, then try again.");
      return locale.toLowerCase().startsWith("en")
        ? clerkError?.longMessage || clerkError?.message || t("Could not save your password. Please try again.")
        : t("Could not save your password. Please try again.");
    }
    return issue instanceof Error && locale.toLowerCase().startsWith("en") ? issue.message : t("Could not save your password. Please try again.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!user) return setError(t("Your account is not ready."));
    if (passwordEnabled && !currentPassword) return setError(t("Enter your current password."));
    if (newPassword.length < 8) return setError(t("Your new password must be at least 8 characters."));
    if (newPassword !== confirmPassword) return setError(t("The new passwords do not match."));
    setBusy(true);
    try {
      await savePassword({ currentPassword: passwordEnabled ? currentPassword : undefined, newPassword });
      await user.reload();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(t("Password saved. You can sign in with a password or an email code."));
    } catch (issue) {
      setError(readableError(issue));
    } finally {
      setBusy(false);
    }
  }

  return <div className={styles.settings}>
    <p className={styles.kicker}>{t("ACCOUNT SECURITY")}</p>
    <h2>{passwordEnabled ? t("Update password") : t("Add password")}</h2>
    <p>{passwordEnabled
      ? t("Enter your current password. If this sign-in is no longer recent, a secure identity confirmation will appear before saving.")
      : t("Add a password from this signed-in session. A recent email-code sign-in needs no extra code, and both sign-in methods will remain available.")}</p>
    {!isLoaded ? <p className={styles.notice}>{t("Loading account…")}</p> : <form className={styles.settingsForm} onSubmit={submit}>
      {passwordEnabled ? <PasswordField locale={locale} label={t("Current password")} autoComplete="current-password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /> : null}
      <PasswordField locale={locale} label={t("New password")} autoComplete="new-password" minLength={8} required value={newPassword} onChange={event => setNewPassword(event.target.value)} hint={t("At least 8 characters. Use a unique password that you do not use on other sites.")} />
      <PasswordField locale={locale} label={t("Confirm new password")} autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {success ? <p className={styles.success} role="status">{success}</p> : null}
      <button type="submit" disabled={busy}>{busy ? t("Saving…") : passwordEnabled ? t("Update password") : t("Add password")}</button>
    </form>}
  </div>;
}
