"use client";

import { InputHTMLAttributes, useId, useState } from "react";
import { portfolioAuthText } from "./auth-copy.generated";
import styles from "./identity.module.css";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  locale?: string;
  hint?: string;
};

export function PasswordField({ label, locale, hint, id, ...inputProps }: PasswordFieldProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const [revealed, setRevealed] = useState(false);
  const toggleLabel = portfolioAuthText(locale, revealed ? "Hide password" : "Show password");

  return <div className={styles.fieldGroup}>
    <label htmlFor={fieldId}>{label}</label>
    <span className={styles.passwordField}>
      <input {...inputProps} id={fieldId} type={revealed ? "text" : "password"} aria-describedby={hintId || inputProps["aria-describedby"]} />
      <button
        type="button"
        className={styles.eyeButton}
        onClick={() => setRevealed(value => !value)}
        aria-label={toggleLabel}
        aria-controls={fieldId}
        aria-pressed={revealed}
        title={toggleLabel}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {revealed ? <path d="m4 4 16 16" /> : null}
        </svg>
      </button>
    </span>
    {hint ? <small id={hintId}>{hint}</small> : null}
  </div>;
}
