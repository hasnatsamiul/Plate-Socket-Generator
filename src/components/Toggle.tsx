// import React from "react";

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
};

export default function Toggle({
  checked,
  onChange,
  disabled,
  label,
  id,
}: Props) {
  return (
    <label className={`tg_wrap ${disabled ? "disabled" : ""}`} htmlFor={id}>
      {label && <span className="tg_label">{label}</span>}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className={`tg_track ${checked ? "on" : ""}`}>
        <span className="tg_knob" />
      </span>
    </label>
  );
}
