import React, { useMemo } from "react";
import { LIMITS } from "../constants";
import NumberField from "./NumberField";
import PlatePicker from "./PlatePicker";
import Toggle from "./Toggle";
import type { Plate, SocketGroup } from "../types";
import {
  groupExtent,
  isPlateEligible,
  snapInsidePlate,
  uid,
  validateGroup,
} from "../utils/geometry";

export default function StepSockets({
  enabled,
  setEnabled,
  plates,
  groups,
  setGroups,
  editingId,
  setEditingId,
  selectedPlateId,
  setSelectedPlateId,
}: {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  plates: Plate[];
  groups: SocketGroup[];
  setGroups: (g: SocketGroup[]) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  selectedPlateId: string | null;
  setSelectedPlateId: (id: string | null) => void;
}) {
  const eligiblePlates = useMemo(
    () => plates.filter(isPlateEligible),
    [plates]
  );

  /* ---------------- Ready and summary section ----------- */
  const SOCKET_PRICE_EUR = 20; //Default 20 euro per socket
  const [isReady, setIsReady] = React.useState(false);

  // leave summary mode if context changes
  React.useEffect(() => {
    setIsReady(false);
  }, [selectedPlateId, editingId, groups.length]);

  // Small summary row for the currently open plate
  function PlateSummaryRow({
    index,
    plate,
    groupsOnPlate,
    pricePerSocket,
  }: {
    index: number;
    plate: Plate;
    groupsOnPlate: SocketGroup[];
    pricePerSocket: number;
  }) {
    const totalSockets = groupsOnPlate.reduce((s, g) => s + g.count, 0);
    const totalPrice = totalSockets * pricePerSocket;

    return (
      <div className="summaryCard">
        <div className="sumRow">
          <div className="sumLeft">
            <span className="sumIndex">{index + 1}.</span> Rückwand –{" "}
            {plate.width.toFixed(2)} × {plate.height.toFixed(2)} cm
          </div>
          <div className="sumRight">
            <span>{totalSockets} × Steckdose</span>
            <span className="dot">•</span>
            <span>{totalPrice.toFixed(2)} €</span>
          </div>
          <button
            className="sumEdit"
            title="Bearbeiten"
            onClick={() => {
              setSelectedPlateId(plate.id);
              const firstGroup = groupsOnPlate.length ? groupsOnPlate[0] : null;
              setIsReady(false);
              setEditingId(firstGroup ? firstGroup.id : null);
            }}
          >
            ⋮
          </button>
        </div>
      </div>
    );
  }

  /** Create one default 1-socket group on a specific plate */
  const createDefaultOnPlate = (plate: Plate): SocketGroup | null => {
    const created: SocketGroup = {
      id: uid("sg"),
      plateId: plate.id,
      count: 1,
      dir: "H",
      left: LIMITS.edgeMin,
      bottom: LIMITS.edgeMin,
    };
    const fixed = snapInsidePlate(created, plate);
    const siblings = groups.filter((g) => g.plateId === plate.id);
    const ok = validateGroup(fixed, plate, siblings);
    if (!ok.ok) {
      alert(
        ok.reason ??
          "Auf dieser Rückwand ist nicht genug Platz für eine Steckdosengruppe."
      );
      return null;
    }
    setGroups([...groups, fixed]);
    return created;
  };

  /** Add next group to selected (auto 4 cm to the right) */
  const addGroupToSelected = () => {
    if (!enabled) return;

    let plate: Plate | undefined = selectedPlateId
      ? plates.find((p) => p.id === selectedPlateId)
      : undefined;

    if (!plate || !isPlateEligible(plate)) {
      const firstEligible = eligiblePlates[0];
      if (!firstEligible) {
        alert("Keine geeignete Rückwand (min 40×40 cm).");
        return;
      }
      setSelectedPlateId(firstEligible.id);
      plate = firstEligible;
    }

    const created: SocketGroup = {
      id: uid("sg"),
      plateId: plate.id,
      count: 1,
      dir: "H",
      left: LIMITS.edgeMin,
      bottom: LIMITS.edgeMin,
    };

    const same = groups.filter((g) => g.plateId === plate!.id);
    if (same.length) {
      let rightMost = LIMITS.edgeMin;
      for (const g of same) {
        const ext = groupExtent(g);
        rightMost = Math.max(rightMost, g.left + ext.w);
      }
      const extNew = groupExtent(created);
      const proposed = rightMost + LIMITS.groupGap; // 4 cm
      const maxLeft = plate!.width - LIMITS.edgeMin - extNew.w;
      created.left =
        proposed <= maxLeft ? proposed : Math.max(LIMITS.edgeMin, maxLeft);
      created.bottom = LIMITS.edgeMin;
    }

    const fixed = snapInsidePlate(created, plate!);
    const siblings = groups.filter((g) => g.plateId === plate!.id);
    const ok = validateGroup(fixed, plate!, siblings);
    if (!ok.ok) {
      alert(
        ok.reason ??
          "Nicht genug Platz (inkl. Abstandsregeln) für eine weitere Steckdosengruppe."
      );
      return;
    }

    setGroups([...groups, fixed]);
    setEditingId(created.id);
    setIsReady(false);
  };

  /** Toggle ON/OFF (create ONE default on first eligible) */
  const onToggleEnabled = (on: boolean) => {
    setEnabled(on);
    if (!on) {
      setGroups([]);
      setEditingId(null);
      setSelectedPlateId(null);
      setIsReady(false);
      return;
    }
    if (groups.length === 0) {
      const first = eligiblePlates[0];
      if (first) {
        const created = createDefaultOnPlate(first);
        setSelectedPlateId(first.id);
        if (created) setEditingId(created.id);
      }
    }
  };

  // Prefer selection; else first eligible; else first plate.
  const openPlateId =
    selectedPlateId ??
    (eligiblePlates.length ? eligiblePlates[0].id : plates[0]?.id ?? null);

  const openPlate = openPlateId
    ? plates.find((p) => p.id === openPlateId) || null
    : null;

  const groupsOnOpen = openPlate
    ? groups.filter((g) => g.plateId === openPlate.id)
    : [];
  const activeGroup =
    groupsOnOpen.find((g) => g.id === editingId) ?? groupsOnOpen[0] ?? null;

  return (
    <section className="panel">
      <div className="panelTitle">
        <span className="badge">2</span> Steckdosen. Auswählen.
      </div>

      {/* Toggle row */}
      <div className="toggleBox" style={{ marginBottom: 12 }}>
        <span style={{ fontWeight: 600 }}>
          Ausschnitte für Steckdosen angeben?
        </span>
        <Toggle checked={enabled} onChange={onToggleEnabled} />
      </div>

      {!enabled ? (
        <div className="hint">
          Schalte die Steckdosen ein, um Gruppen hinzuzufügen.
        </div>
      ) : (
        <>
          {/* ----- Plate selector ----- */}
          <div style={{ marginTop: 8, marginBottom: 14 }}>
            <div className="nf_label" style={{ marginBottom: 8 }}>
              Wähle die Rückwand für die Steckdose
            </div>
            <PlatePicker
              plates={plates}
              value={openPlateId}
              onChange={(id) => {
                const p = plates.find((pl) => pl.id === id)!;
                if (!isPlateEligible(p)) {
                  const firstEligible = eligiblePlates[0];
                  if (!firstEligible) {
                    alert("Keine geeignete Rückwand (min 40×40 cm).");
                    return;
                  }
                  setSelectedPlateId(firstEligible.id);
                  const firstGroup =
                    groups.find((g) => g.plateId === firstEligible.id) || null;
                  setEditingId(firstGroup ? firstGroup.id : null);
                  return;
                }
                setSelectedPlateId(id);
                const firstGroup = groups.find((g) => g.plateId === id) || null;
                setEditingId(firstGroup ? firstGroup.id : null);
              }}
            />
          </div>

          {/* ----- Controls or Summary for the open plate ----- */}
          {openPlate ? (
            <>
              {isReady ? (
                <PlateSummaryRow
                  index={plates.findIndex((p) => p.id === openPlate.id)}
                  plate={openPlate}
                  groupsOnPlate={groupsOnOpen}
                  pricePerSocket={SOCKET_PRICE_EUR}
                />
              ) : activeGroup ? (
                <PlateControls
                  plate={openPlate}
                  group={activeGroup}
                  allGroupsOnPlate={groupsOnOpen}
                  plates={plates}
                  groups={groups}
                  onChangeGroup={(ng) => {
                    const sibs = groups.filter(
                      (g) => g.plateId === openPlate.id && g.id !== ng.id
                    );
                    const ok = validateGroup(ng, openPlate, sibs);
                    if (!ok.ok) return alert(ok.reason);
                    setGroups(groups.map((x) => (x.id === ng.id ? ng : x)));
                  }}
                  setEditingId={setEditingId}
                />
              ) : (
                <div className="hint">
                  Auf dieser Rückwand gibt es noch keine Steckdose. Klicke unten
                  auf <b>„Steckdose hinzufügen“</b>, um die erste Gruppe zu
                  erstellen.
                </div>
              )}

              {/* Actions: Add + Ready */}
              <div className="rowEnd gap">
                <button className="addBtn" onClick={addGroupToSelected}>
                  Steckdose hinzufügen
                </button>
                <button
                  className={`readyBtn ${isReady ? "active" : ""}`}
                  onClick={() => setIsReady((v) => !v)}
                  disabled={!groupsOnOpen.length}
                  title={
                    groupsOnOpen.length
                      ? ">= anzeigen"
                      : "Keine Steckdosen auf dieser Rückwand"
                  }
                >
                  {isReady ? "Bearbeiten" : "Zusammenfassung"}
                </button>
              </div>
            </>
          ) : (
            <div className="hint">Keine Rückwand ausgewählt.</div>
          )}
        </>
      )}
    </section>
  );
}

/* ----------------------- Controls for a single plate ----------------------- */

function PlateControls({
  plate,
  group,
  allGroupsOnPlate,
  onChangeGroup,
  setEditingId,
  plates,
  groups,
}: {
  plate: Plate;
  group: SocketGroup;
  allGroupsOnPlate: SocketGroup[];
  onChangeGroup: (g: SocketGroup) => void;
  setEditingId: (id: string | null) => void;
  plates: Plate[];
  groups: SocketGroup[];
}) {
  const { w, h } = groupExtent(group);

  const tryChange = (partial: Partial<SocketGroup>) =>
    onChangeGroup({ ...group, ...partial });

  // keep move logic unchanged
  const moveToPlate = (plateId: string) => {
    if (plateId === group.plateId) return;
    const target = plates.find((p) => p.id === plateId)!;
    if (!isPlateEligible(target)) {
      alert("Diese Rückwand ist zu klein (min 40×40 cm).");
      return;
    }
    const candidate = snapInsidePlate({ ...group, plateId }, target);
    const siblingsOnTarget = groups.filter(
      (g) => g.plateId === plateId && g.id !== group.id
    );
    const ok = validateGroup(candidate, target, siblingsOnTarget);
    if (!ok.ok) {
      alert(
        ok.reason ??
          "Auf der Ziel-Rückwand ist an dieser Position nicht genug Platz."
      );
      return;
    }
    onChangeGroup(candidate);
    setEditingId(candidate.id);
  };

  return (
    <div className="gCard">
      <div className="gHeader">
        <div className="gTitle">Steckdosen-Gruppen</div>

        {/* “Group N” tabs */}
        <div className="seg segSmall groupTabs" aria-label="Gruppe auswählen">
          {allGroupsOnPlate.map((g, i) => (
            <button
              key={g.id}
              className={g.id === group.id ? "sel" : ""}
              onClick={() => setEditingId(g.id)}
            >
              {`Group ${i + 1}`}
            </button>
          ))}
        </div>
      </div>

      {/* Plate selector */}
      <div className="gBlock">
        <label className="gLabel">Wählen Sie die Rückseite aus, um diese Steckdosengruppe zu verschieben </label>
        <div className="selectWrap">
          <select
            value={group.plateId}
            onChange={(e) => moveToPlate(e.target.value)}
          >
            {plates.map((p) => (
              <option key={p.id} value={p.id} disabled={!isPlateEligible(p)}>
                {p.width.toFixed(2)} × {p.height.toFixed(2)} cm
                {!isPlateEligible(p) ? " (zu klein)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Number + Orientation segments */}
      <div className="gPanel">
        <div className="gPanelCol">
          <div className="gSubTitle">Anzahl</div>
          <div className="seg">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={group.count === n ? "sel" : ""}
                onClick={() => tryChange({ count: n as any })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="gPanelCol">
          <div className="gSubTitle">Steckdosen-Ausrichtung</div>
          <div className="seg">
            <button
              className={group.dir === "H" ? "sel" : ""}
              onClick={() => tryChange({ dir: "H" })}
            >
              Horizontal
            </button>
            <button
              className={group.dir === "V" ? "sel" : ""}
              onClick={() => tryChange({ dir: "V" })}
            >
              Vertikal
            </button>
          </div>
        </div>
      </div>

      {/* Position inputs */}
      <div className="gBlock">
        <div className="gSubTitleRow">
          <span>Positioniere die Steckdose</span>
        </div>

        <div className="gPosGrid">
          <NumberField
            label="Abstand von Links"
            value={group.left}
            min={LIMITS.edgeMin}
            max={Math.max(LIMITS.edgeMin, plate.width - LIMITS.edgeMin)}
            suffix="cm"
            onChange={(v) => tryChange({ left: v })}
          />

          <div className="gTimes">×</div>

          <NumberField
            label="Abstand von unten"
            value={group.bottom}
            min={LIMITS.edgeMin}
            max={Math.max(LIMITS.edgeMin, plate.height - LIMITS.edgeMin)}
            suffix="cm"
            onChange={(v) => tryChange({ bottom: v })}
          />
        </div>
      </div>

      <div className="gHint">
        Gruppe: {w.toFixed(2)} × {h.toFixed(2)} cm • Randabstand greater than or
        equal {LIMITS.edgeMin} cm • Abstand zwischen Gruppen greater than or
        equal {LIMITS.groupGap} cm
      </div>
    </div>
  );
}
