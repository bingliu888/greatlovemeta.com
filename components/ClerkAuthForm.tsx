"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { FormEvent, useEffect, useState } from "react";
import { resolveSignUpRequirements } from "../lib/clerk-auth-requirements";
import { authInterfaceCopyFor } from "../lib/auth-interface-copy";
import type { SiteLanguage } from "../lib/site-locale";

type SignUpResult = {
  status: string | null;
  createdSessionId: string | null;
  missingFields?: readonly string[];
};

export function ClerkAuthForm({ lang, returnTo = `/${lang}/dashboard` }: { lang: SiteLanguage; returnTo?: string }) {
  const zh = lang === "zh";
  const a = authInterfaceCopyFor(lang);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<"code" | "password">("code");
  const [step, setStep] = useState<"credentials" | "code" | "password-required">("credentials");
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
      if (response.ok) window.location.replace(returnTo);
      else setError(zh ? "无法建立安全会话。" : "Unable to connect your secure session.");
    })();
  }, [getToken, isLoaded, returnTo, user, userId, zh]);

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

  async function finishSignUp(result: SignUpResult) {
    if (result.status === "complete" && result.createdSessionId) {
      if (!setActiveSignUp) throw new Error(zh ? "登录功能仍在加载。" : "Sign-in is still loading.");
      await setActiveSignUp({ session: result.createdSessionId });
      return;
    }
    if (result.status === "missing_requirements") {
      const resolution = resolveSignUpRequirements(result.missingFields, zh ? "zh" : "en");
      if (resolution.kind === "password") {
        setStep("password-required");
        setCode("");
        setPassword("");
        setPasswordConfirmation("");
        setMessage(resolution.message);
        return;
      }
      throw new Error(resolution.message);
    }
    throw new Error(zh
      ? `无法完成账户创建（${result.status || "未知状态"}），请重新开始。`
      : `Account creation could not finish (${result.status || "unknown status"}). Please start again.`);
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
        setStep("code"); setMessage(zh ? `验证码已发送至 ${identifier}` : `Code sent to ${identifier}`);
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
          setFlow("sign-up"); setStep("code"); setMessage(zh ? `验证码已发送至 ${identifier}` : `Code sent to ${identifier}`);
        }
      } else if (flow === "sign-in") {
        const result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
        if (result.status !== "complete" || !result.createdSessionId) throw new Error(zh ? "验证需要额外步骤。" : "Verification needs another step.");
        await setActiveSignIn({ session: result.createdSessionId });
      } else if (step === "password-required" && flow === "sign-up") {
        if (password.length < 8) throw new Error(zh ? "密码至少需要 8 个字符。" : "Your password must be at least 8 characters.");
        if (password !== passwordConfirmation) throw new Error(zh ? "两次输入的密码不一致。" : "The passwords do not match.");
        const result = await signUp.update({ password });
        await finishSignUp(result);
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code });
        await finishSignUp(result);
      }
    } catch (issue) { setError(readableError(issue)); } finally { setLoading(false); }
  }

  function reset(next = method) { setMethod(next); setStep("credentials"); setFlow(null); setCode(""); setPassword(""); setPasswordConfirmation(""); setError(""); setMessage(""); }

  if ((userLoaded && isSignedIn) || userId) return <p className="form-message success" role="status">{error || a.completing}</p>;
  return <form className="auth-form" onSubmit={submit}>
    <label>{a.email}<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} disabled={step !== "credentials"} required /></label>
    {((method === "password" && step === "credentials") || step === "password-required") && <label>{step === "password-required" ? a.createPassword : a.password}<input type="password" autoComplete={step === "password-required" ? "new-password" : "current-password"} minLength={8} value={password} onChange={event => setPassword(event.target.value)} required /></label>}
    {step === "password-required" && <label>{a.confirmPassword}<input type="password" autoComplete="new-password" minLength={8} value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} required /></label>}
    {step === "code" && <label>{a.code}<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} required /></label>}
    {error && <p className="form-message error" role="alert">{error}</p>}{message && <p className="form-message success" role="status">{message}</p>}
    {step === "code" && <p className="form-message">{a.spam}</p>}
    <div id="clerk-captcha" />
    <button className="primary-button full" disabled={loading || !signInLoaded || !signUpLoaded}>{loading ? a.wait : step === "code" ? a.verify : step === "password-required" ? a.createAndSignIn : method === "code" ? a.sendCode : a.continuePassword}</button>
    {step === "code" || step === "password-required" ? <button className="form-link" type="button" onClick={() => reset()}>{a.anotherEmail}</button> : <button className="form-link" type="button" onClick={() => reset(method === "code" ? "password" : "code")}>{method === "code" ? a.usePassword : a.useCode}</button>}
  </form>;
}
