"use client";
import { useState } from "react";
/** Preserve an in-progress decimal without putting invalid values into the model. */
export default function NumericInput({
  value,
  min,
  max,
  step,
  label,
  id,
  disabled,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  id?: string;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="number"
      aria-label={label}
      id={id}
      min={min}
      max={max}
      step={step}
      value={draft ?? value}
      disabled={disabled}
      onFocus={() => setDraft(String(value))}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        const next = Number(text);
        if (text !== "" && Number.isFinite(next) && next >= min && next <= max)
          onChange(next);
      }}
      onBlur={() => {
        if (
          draft !== null &&
          draft.trim() !== "" &&
          Number.isFinite(Number(draft))
        )
          onChange(Math.min(max, Math.max(min, Number(draft))));
        setDraft(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(null);
          event.currentTarget.blur();
        }
      }}
    />
  );
}
