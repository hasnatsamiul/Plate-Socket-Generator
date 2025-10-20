// import React from "react";
import { LIMITS } from "../constants";
import NumberField from "./NumberField";
import type { Plate } from "../types";
// import { clamp } from "../utils/geometry";

export default function StepPlates({
  plates,
  setPlate,
  addPlate,
  removePlate,
}: {
  plates: Plate[];
  setPlate: (id: string, data: Partial<Plate>) => void;
  addPlate: () => void;
  removePlate: (id: string) => void;
}) {
  return (
    <section className="panel">
      <div className="panelTitle">
        <span className="badge">1</span> Maße. Eingeben.
      </div>

      {plates.map((p, idx) => (
        <div key={p.id} className="plateRow">
          <div className="plateIndex">{idx + 1}</div>

          <NumberField
            label="Breite"
            value={p.width}
            min={LIMITS.widthMin}
            max={LIMITS.widthMax}
            decimals={1}
            onChange={(v) => setPlate(p.id, { width: v })}
          />
          <span className="times">×</span>
          <NumberField
            label="Höhe"
            value={p.height}
            min={LIMITS.heightMin}
            max={LIMITS.heightMax}
            decimals={1}
            onChange={(v) => setPlate(p.id, { height: v })}
          />

          <button
            className="ghost"
            onClick={() => removePlate(p.id)}
            disabled={plates.length === 1}
            title="Rückwand entfernen"
          >
            –
          </button>
        </div>
      ))}

      <button className="addBtn" onClick={addPlate}>
        Rückwand hinzufügen +
      </button>
    </section>
  );
}
