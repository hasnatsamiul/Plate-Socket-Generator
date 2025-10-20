import React from "react";
import type { Cm, Plate } from "../types";

export default function GuidelineOverlay({
  baseXcm,
  baseYcm,
  plate,
  leftCm,
  bottomCm,
  pxForCm,
}: {
  baseXcm: Cm; // plate origin (logical cm) from canvas left
  baseYcm: Cm; // plate origin (logical cm) from canvas top
  plate: Plate;
  leftCm: Cm; // anchor from left
  bottomCm: Cm; // anchor from bottom
  pxForCm: (cm: Cm) => number;
}) {
  const xAnchor = pxForCm(baseXcm + leftCm);
  const yAnchor = pxForCm(baseYcm + (plate.height - bottomCm));
  const xLeft = pxForCm(baseXcm);
  const yBottom = pxForCm(baseYcm + plate.height);

  return (
    <>
      {/* anchor point */}
      <div
        className="anchorDot"
        style={{ left: xAnchor, top: yAnchor }}
        aria-hidden
      />

      {/* horizontal guide (left edge -> anchor) */}
      <div
        className="guide guideH"
        style={{ left: xLeft, top: yAnchor, width: xAnchor - xLeft }}
      />
      <div
        className="guideLabel"
        style={{ left: xLeft + (xAnchor - xLeft) / 2, top: yAnchor - 16 }}
      >
        {leftCm.toFixed(1)} cm
      </div>

      {/* vertical guide (bottom edge -> anchor) */}
      <div
        className="guide guideV"
        style={{ left: xAnchor, top: yAnchor, height: yBottom - yAnchor }}
      />
      <div
        className="guideLabel"
        style={{
          left: xAnchor + 8,
          top: yAnchor + (yBottom - yAnchor) / 2 - 8,
        }}
      >
        {bottomCm.toFixed(1)} cm
      </div>
    </>
  );
}
