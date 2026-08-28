"use client";

import { useAuth } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { portfolioAuthText } from "./auth-copy.generated";
import { PasswordField } from "./PasswordField";

type AuthMethod = "code" | "password";
type AuthStep = "credentials" | "code" | "password-required" | "recovery-email" | "recovery-code";
type AuthFlow = "sign-in" | "sign-up" | "second-factor" | "recovery" | null;

export type ClerkDualAuthFormProps = {
  locale?: string;
  returnTo: string;
  completionPath?: string;
  bridgeEndpoint?: string;
  formClassName?: string;
  primaryButtonClassName?: string;
  secondaryButtonClassName?: string;
};

export function ClerkDualAuthForm({
  locale: localeProp,
  returnTo,
  completionPath,
  bridgeEndpoint,
  formClassName = "auth-form",
  primaryButtonClassName = "primary-button full",
  secondaryButtonClassName = "form-link",
}: ClerkDualAuthFormProps) {
  const [detectedLocale, setDetectedLocale] = useState(localeProp || "en");
  const locale = localeProp || detectedLocale;
  const t = useCallback((english: string) => portfolioAuthText(locale, english), [locale]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<AuthMethod>("password");
  const [step, setStep] = useState<AuthStep>("credentials");
  const [flow, setFlow] = useState<AuthFlow>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const bridgeStarted = useRef(false);
  const { isLoaded: authLoaded, userId, getToken } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();
  type SignInResult = Awaited<ReturnType<NonNullable<typeof signIn>["create"]>>;
  type SignUpResult = Awaited<ReturnType<NonNullable<typeof signUp>["create"]>>;

  useEffect(() => {
    if (localeProp) return;
    const root = document.documentElement;
    const sync = () => setDetectedLocale(root.lang || "en");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, [localeProp]);

  useEffect(() => {
    if (!authLoaded || !userId || bridgeStarted.current) return;
    bridgeStarted.current = true;
    if (completionPath) {
      window.location.replace(completionPath);
      return;
    }
    if (!bridgeEndpoint) {
      window.location.replace(returnTo);
      return;
    }
    void (async () => {
      try {
        const token = await getToken();
        const response = await fetch(bridgeEndpoint, {
          method: "POST",
          headers: {
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) throw new Error(t("Unable to connect your secure session."));
        window.location.replace(returnTo);
      } catch (issue) {
        bridgeStarted.current = false;
        setError(issue instanceof Error ? issue.message : t("Unable to connect your secure session."));
      }
    })();
  }, [authLoaded, bridgeEndpoint, completionPath, getToken, returnTo, t, userId]);

  function activationTarget() {
    if (completionPath) return completionPath;
    if (!bridgeEndpoint) return returnTo;
    const target = new URL(window.location.href);
    target.searchParams.set("authComplete", "1");
    return `${target.pathname}${target.search}${target.hash}`;
  }

  function activateSession(setActive: typeof setActiveSignIn, session: string) {
    if (!setActive) throw new Error(t("Sign-in is still loading."));
    return setActive({
      session,
      navigate: async ({ decorateUrl }) => {
        window.location.href = decorateUrl(activationTarget());
      },
    });
  }

  function readableError(issue: unknown) {
    if (isClerkAPIResponseError(issue)) {
      const key = issue.errors[0]?.code;
      if (key === "form_code_incorrect") return t("That code is incorrect. Please try again.");
      if (key === "verification_expired") return t("That code expired. Request a new one.");
      if (key === "form_identifier_not_found") return t("No account exists with that email.");
      if (key === "form_password_incorrect") return t("That password is incorrect.");
      if (key === "form_password_length_too_short") return t("Your password must be at least 8 characters.");
      return locale.toLowerCase().startsWith("en")
        ? issue.errors[0]?.longMessage || issue.errors[0]?.message || t("Request failed.")
        : t("Request failed. Please try again later.");
    }
    if (issue instanceof Error) return issue.message;
    return t("Request failed.");
  }

  async function finishSignUp(result: SignUpResult) {
    if (result.status === "complete" && result.createdSessionId) {
      await activateSession(setActiveSignUp, result.createdSessionId);
      return;
    }
    if (result.status === "missing_requirements" && result.missingFields?.length === 1 && result.missingFields[0] === "password") {
      setStep("password-required");
      setCode("");
      setPassword("");
      setPasswordConfirmation("");
      setMessage(t("Your email is verified. Create a password to finish signing in."));
      return;
    }
    throw new Error(t("Your account requires additional information before sign-in can finish. Use another sign-in method or contact an administrator."));
  }

  async function finishSignIn(result: SignInResult, identifier: string) {
    if (result.status === "complete" && result.createdSessionId) {
      await activateSession(setActiveSignIn, result.createdSessionId);
      return;
    }
    if (result.status === "needs_second_factor" || result.status === "needs_client_trust") {
      const factor = result.supportedSecondFactors?.find(item => item.strategy === "email_code");
      if (!factor || factor.strategy !== "email_code") throw new Error(t("This account requires another security factor. Contact an administrator."));
      await result.prepareSecondFactor({ strategy: "email_code", emailAddressId: factor.emailAddressId });
      setFlow("second-factor");
      setStep("code");
      setCode("");
      setPassword("");
      setMessage(t("This device needs extra verification. A new security code was sent to {identifier}").replace("{identifier}", identifier));
      return;
    }
    throw new Error(t("Sign-in needs another step ({status}).").replace("{status}", result.status || t("unknown")));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (!signInLoaded || !signUpLoaded || !signIn || !signUp) throw new Error(t("Sign-in is still loading."));
      const identifier = email.trim().toLowerCase();
      if (step === "recovery-email") {
        await signIn.create({ strategy: "reset_password_email_code", identifier });
        setFlow("recovery");
        setStep("recovery-code");
        setMessage(t("Account found. Check {identifier} and enter the one-time reset code from the email.").replace("{identifier}", identifier));
      } else if (step === "recovery-code" && flow === "recovery") {
        if (password.length < 8) throw new Error(t("Your new password must be at least 8 characters."));
        if (password !== passwordConfirmation) throw new Error(t("The new passwords do not match."));
        const result = await signIn.attemptFirstFactor({ strategy: "reset_password_email_code", code, password });
        await finishSignIn(result, identifier);
      } else if (step === "credentials" && method === "code") {
        try {
          const attempt = await signIn.create({ identifier });
          const factor = attempt.supportedFirstFactors?.find(item => item.strategy === "email_code");
          if (!factor || factor.strategy !== "email_code") throw new Error(t("Request failed."));
          await attempt.prepareFirstFactor({ strategy: "email_code", emailAddressId: factor.emailAddressId });
          setFlow("sign-in");
        } catch (issue) {
          const missing = isClerkAPIResponseError(issue) && issue.errors.some(item => item.code === "form_identifier_not_found");
          if (!missing) throw issue;
          const attempt = await signUp.create({ emailAddress: identifier });
          await attempt.prepareEmailAddressVerification({ strategy: "email_code" });
          setFlow("sign-up");
        }
        setStep("code");
        setMessage(t("Code sent to {identifier}").replace("{identifier}", identifier));
      } else if (step === "credentials") {
        try {
          const result = await signIn.create({ identifier, password });
          await finishSignIn(result, identifier);
        } catch (issue) {
          const missing = isClerkAPIResponseError(issue) && issue.errors.some(item => item.code === "form_identifier_not_found");
          if (!missing) throw issue;
          const result = await signUp.create({ emailAddress: identifier, password });
          await finishSignUp(result);
        }
      } else if (flow === "second-factor") {
        const result = await signIn.attemptSecondFactor({ strategy: "email_code", code });
        await finishSignIn(result, identifier);
      } else if (flow === "sign-in") {
        const result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
        await finishSignIn(result, identifier);
      } else if (step === "password-required" && flow === "sign-up") {
        if (password.length < 8) throw new Error(t("Your password must be at least 8 characters."));
        if (password !== passwordConfirmation) throw new Error(t("The passwords do not match."));
        await finishSignUp(await signUp.update({ password }));
      } else {
        await finishSignUp(await signUp.attemptEmailAddressVerification({ code }));
      }
    } catch (issue) {
      setError(readableError(issue));
    } finally {
      setLoading(false);
    }
  }

  function reset(nextMethod = method) {
    setMethod(nextMethod);
    setStep("credentials");
    setFlow(null);
    setCode("");
    setPassword("");
    setPasswordConfirmation("");
    setError("");
    setMessage("");
  }

  function startRecovery() {
    setStep("recovery-email");
    setFlow(null);
    setCode("");
    setPassword("");
    setPasswordConfirmation("");
    setError("");
    setMessage(t("Enter your account email to receive a one-time reset code."));
  }

  const primaryAction = loading ? t("Please wait…")
    : step === "recovery-email" ? t("Send reset code")
      : step === "recovery-code" ? t("Reset password & sign in")
        : step === "code" ? t("Verify & continue")
          : step === "password-required" ? t("Create password & sign in")
            : method === "code" ? t("Send secure code") : t("Continue with password");
  const secondaryAction = step !== "credentials" ? t("Use another email")
    : method === "code" ? t("Use password instead") : t("Use an email code instead");

  if (userId) return <p className="form-message success" role="status">{error || t("Connecting your secure session…")}</p>;
  return <form className={formClassName} onSubmit={submit}>
    <label>{t("Email address")}<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} disabled={step === "code" || step === "password-required" || step === "recovery-code"} required /></label>
    {((method === "password" && step === "credentials") || step === "password-required" || step === "recovery-code") ? <PasswordField locale={locale} label={step === "credentials" ? t("Password") : t("New password")} autoComplete={step === "credentials" ? "current-password" : "new-password"} minLength={8} value={password} onChange={event => setPassword(event.target.value)} required /> : null}
    {(step === "password-required" || step === "recovery-code") ? <PasswordField locale={locale} label={t("Confirm new password")} autoComplete="new-password" minLength={8} value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} required /> : null}
    {method === "password" && step === "credentials" ? <button className={`${secondaryButtonClassName} auth-forgot-password`} type="button" onClick={startRecovery}>{t("Forgot password?")}</button> : null}
    {(step === "code" || step === "recovery-code") ? <label>{t("One-time code")}<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} required /></label> : null}
    {error ? <p className="form-message error" role="alert">{error}</p> : null}
    {message ? <p className="form-message success" role="status">{message}</p> : null}
    {(step === "code" || step === "recovery-code") ? <p className="form-message">{t("If you don't see the code email in your inbox, check your Spam or Junk folder.")}</p> : null}
    {step === "recovery-email" ? <p className="form-message">{t("Self-service recovery cannot work if the account email is false or unreachable.")}</p> : null}
    <div id="clerk-captcha" />
    <button className={primaryButtonClassName} disabled={loading || !signInLoaded || !signUpLoaded}>{primaryAction}</button>
    <button className={secondaryButtonClassName} type="button" onClick={() => step !== "credentials" ? reset() : reset(method === "code" ? "password" : "code")}>{secondaryAction}</button>
  </form>;
}
