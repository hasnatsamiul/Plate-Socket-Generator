import React, { useMemo } from "react";
import type { Plate } from "../types";
import { isPlateEligible } from "../utils/geometry";

const TILE_W = 152; // preview box width (px) – match your UI
const TILE_H = 96; // preview box height (px)

type Props = {
  plates: Plate[];
  value: string | null; // selected plate id
  onChange: (id: string | null) => void;
  disabled?: boolean;
};

type Preview = { id: string; w: number; h: number };

export default function PlatePicker({
  plates,
  value,
  onChange,
  disabled,
}: Props) {
  // recompute on size changes
  const sig = useMemo(
    () => plates.map((p) => `${p.id}:${p.width}x${p.height}`).join("|"),
    [plates]
  );

  const previews = useMemo<Preview[]>(
    () =>
      plates.map((p) => {
        const scale = Math.min(TILE_W / p.width, TILE_H / p.height);
        return {
          id: p.id,
          w: Math.max(1, p.width * scale),
          h: Math.max(1, p.height * scale),
        };
      }),
    [sig, plates]
  );

  return (
    <div className="pp_wrap">
      {plates.map((p, i) => {
        const sel = value === p.id;
        const eligible = isPlateEligible(p);
        const prev = previews[i];

        const reason = eligible ? "" : "Zu klein – min 40 × 40 cm";

        return (
          <button
            key={p.id}
            className={`pp_tile ${sel ? "pp_sel" : ""} ${
              eligible ? "" : "pp_dis"
            }`}
            onClick={() => eligible && !disabled && onChange(p.id)}
            disabled={disabled || !eligible}
            aria-pressed={sel}
            aria-disabled={!eligible}
            title={
              eligible
                ? `${p.width.toFixed(2)} × ${p.height.toFixed(2)} cm`
                : reason
            }
            type="button"
          >
            <div className="pp_previewBox">
              <div
                className="pp_plateMini"
                style={{ width: prev.w, height: prev.h }}
                aria-hidden
              />
              {!eligible && (
                <div className="pp_overlay" role="note" aria-label={reason}>
                  <span className="pp_reason">{reason}</span>
                </div>
              )}
            </div>

            <div className="pp_label">
              {p.width.toFixed(2)} × {p.height.toFixed(2)} cm
            </div>
          </button>
        );
      })}
    </div>
  );
}
