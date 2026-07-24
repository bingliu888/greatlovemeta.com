"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { FormEvent, useEffect, useState } from "react";

export function ClerkAuthForm({ lang }: { lang: "en" | "zh" }) {
  const zh = lang === "zh";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<"code" | "password">("code");
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [flow, setFlow] = useState<"sign-in" | "sign-up" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { isLoaded, userId, getToken } = useAuth();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void (async () => {
      const token = await getToken();
      const response = await fetch("/api/auth/clerk-session", { method: "POST", headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json" }, body: JSON.stringify({ email: user?.primaryEmailAddress?.emailAddress, name: user?.fullName || user?.firstName }) });
      if (response.ok) window.location.replace(`/${lang}/dashboard`);
      else setError(zh ? "无法建立安全会话。" : "Unable to connect your secure session.");
    })();
  }, [getToken, isLoaded, lang, user, userId, zh]);

  function readableError(issue: unknown) {
    if (isClerkAPIResponseError(issue)) {
      const key = issue.errors[0]?.code;
      if (key === "form_code_incorrect") return zh ? "验证码不正确，请重试。" : "That code is incorrect. Please try again.";
      if (key === "verification_expired") return zh ? "验证码已过期，请重新发送。" : "That code expired. Request a new one.";
      if (key === "form_password_incorrect") return zh ? "密码不正确。" : "That password is incorrect.";
      return issue.errors[0]?.longMessage || issue.errors[0]?.message || (zh ? "请求失败。" : "Request failed.");
    }
    return issue instanceof Error ? issue.message : zh ? "请求失败。" : "Request failed.";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      if (!signInLoaded || !signUpLoaded || !signIn || !signUp) throw new Error(zh ? "登录功能仍在加载。" : "Sign-in is still loading.");
      const identifier = email.trim().toLowerCase();
      if (step === "credentials" && method === "code") {
        try {
          const attempt = await signIn.create({ identifier });
          const factor = attempt.supportedFirstFactors?.find(item => item.strategy === "email_code");
          if (!factor || factor.strategy !== "email_code") throw new Error(zh ? "邮箱验证码不可用。" : "Email-code sign-in is unavailable.");
          await attempt.prepareFirstFactor({ strategy: "email_code", emailAddressId: factor.emailAddressId });
          setFlow("sign-in");
        } catch (issue) {
          const missing = isClerkAPIResponseError(issue) && issue.errors.some(item => item.code === "form_identifier_not_found");
          if (!missing) throw issue;
          const attempt = await signUp.create({ emailAddress: identifier });
          await attempt.prepareEmailAddressVerification({ strategy: "email_code" });
          setFlow("sign-up");
        }
        setStep("code"); setMessage(zh ? "验证码已发送，请查看邮箱。" : "Code sent. Check your email.");
      } else if (step === "credentials") {
        try {
          const result = await signIn.create({ identifier, password });
          if (result.status !== "complete" || !result.createdSessionId) throw new Error(zh ? "登录需要额外步骤。" : "Sign-in needs another step.");
          await setActiveSignIn({ session: result.createdSessionId });
        } catch (issue) {
          const missing = isClerkAPIResponseError(issue) && issue.errors.some(item => item.code === "form_identifier_not_found");
          if (!missing) throw issue;
          const attempt = await signUp.create({ emailAddress: identifier, password });
          await attempt.prepareEmailAddressVerification({ strategy: "email_code" });
          setFlow("sign-up"); setStep("code"); setMessage(zh ? "请验证邮箱以完成注册。" : "Verify your email to finish creating your account.");
        }
      } else if (flow === "sign-in") {
        const result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
        if (result.status !== "complete" || !result.createdSessionId) throw new Error(zh ? "验证需要额外步骤。" : "Verification needs another step.");
        await setActiveSignIn({ session: result.createdSessionId });
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status !== "complete" || !result.createdSessionId) throw new Error(zh ? "验证需要额外步骤。" : "Verification needs another step.");
        await setActiveSignUp({ session: result.createdSessionId });
      }
    } catch (issue) { setError(readableError(issue)); } finally { setLoading(false); }
  }

  function reset(next = method) { setMethod(next); setStep("credentials"); setFlow(null); setCode(""); setError(""); setMessage(""); }

  if ((userLoaded && isSignedIn) || userId) return <p className="form-message success" role="status">{error || (zh ? "正在完成安全登录…" : "Completing secure sign-in…")}</p>;
  return <form className="auth-form" onSubmit={submit}>
    <label>{zh ? "电子邮箱" : "Email address"}<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} disabled={step === "code"} required /></label>
    {method === "password" && step === "credentials" && <label>{zh ? "密码" : "Password"}<input type="password" autoComplete="current-password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} required /></label>}
    {step === "code" && <label>{zh ? "一次性验证码" : "One-time code"}<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} required /></label>}
    {error && <p className="form-message error" role="alert">{error}</p>}{message && <p className="form-message success" role="status">{message}</p>}
    <button className="primary-button full" disabled={loading || !signInLoaded || !signUpLoaded}>{loading ? (zh ? "请稍候…" : "Please wait…") : step === "code" ? (zh ? "验证并继续" : "Verify & continue") : method === "code" ? (zh ? "发送安全验证码" : "Send secure code") : (zh ? "使用密码继续" : "Continue with password")}</button>
    {step === "code" ? <button className="form-link" type="button" onClick={() => reset()}>{zh ? "更换邮箱" : "Use another email"}</button> : <button className="form-link" type="button" onClick={() => reset(method === "code" ? "password" : "code")}>{method === "code" ? (zh ? "改用密码" : "Use password instead") : (zh ? "改用邮箱验证码" : "Use an email code instead")}</button>}
  </form>;
}
