import React, { useEffect, useRef, useState } from "react";

type Props = {
  label?: string;
  value: number; // canonical value from parent
  onChange: (n: number) => void; // called on commit (Enter or blur)
  step?: number;
  suffix?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  decimals?: number; // default 1
  required?: boolean; // default true
};

export default function NumberField({
  label,
  value,
  onChange,
  step = 0.1,
  suffix = "cm",
  min,
  max,
  disabled,
  decimals = 1,
  required = true,
}: Props) {
  const [text, setText] = useState<string>(format(value, decimals));
  const [error, setError] = useState<string | null>(null);
  const lastCommitted = useRef<number>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // keep local text in sync when parent changes
  useEffect(() => {
    if (value !== lastCommitted.current) {
      setText(format(value, decimals));
      lastCommitted.current = value;
      setError(null);
    }
  }, [value, decimals]);

  const validateLive = (raw: string): string | null => {
    const s = raw.trim().replace(",", ".");
    if (s === "") return required ? "Pflichtfeld" : null;
    if (!/^-?\d*\.?\d*$/.test(s)) return "Nur Zahlen erlaubt";
    const n = Number(s);
    if (!isFinite(n)) return "Ungültige Zahl";
    if (typeof min === "number" && n < min) return `Min. ${min}`;
    if (typeof max === "number" && n > max) return `Max. ${max}`;
    return null;
  };

  const commit = () => {
    const s = text.trim().replace(",", ".");
    // hard validation again
    const liveErr = validateLive(s);
    if (liveErr) {
      setError(liveErr);
      return;
    }

    let n = Number(s);
    // clamp
    if (typeof min === "number" && n < min) n = min;
    if (typeof max === "number" && n > max) n = max;

    lastCommitted.current = n;
    setText(format(n, decimals));
    setError(null);
    onChange(n);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(); // commit immediately on Enter
      inputRef.current?.blur(); // optional: remove focus so UI redraws
    } else if (e.key === "Escape") {
      e.preventDefault();
      setText(format(lastCommitted.current, decimals));
      setError(null);
      inputRef.current?.blur();
    }
  };

  return (
    <label className="nf">
      {label && <div className="nf_label">{label}</div>}
      <div className={`nf_field ${error ? "error" : ""}`}>
        <input
          ref={inputRef}
          type="text" // lets user type freely (., ,)
          inputMode="decimal"
          value={text}
          disabled={disabled}
          onChange={(e) => {
            const val = e.target.value;
            setText(val);
            setError(validateLive(val)); // live validation
          }}
          onBlur={commit}
          onKeyDown={onKeyDown}
          aria-invalid={!!error}
          aria-describedby={label ? `${slugify(label)}-err` : undefined}
        />
        <span className="nf_suffix">{suffix}</span>
      </div>
      {error && (
        <div
          className="nf_error"
          id={label ? `${slugify(label)}-err` : undefined}
        >
          {error}
        </div>
      )}
    </label>
  );
}

function format(n: number, decimals = 1) {
  if (!isFinite(n)) return "";
  return Number(n.toFixed(decimals)).toString();
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
