import React, { useMemo } from "react";
import "./styles.css";
import type { Plate, SocketGroup } from "./types";
import useLocalStorage from "./hooks/useLocalStorage";
import StepPlates from "./components/StepPlates";
import StepSockets from "./components/StepSockets";
import CanvasView from "./components/CanvasView";
import { uid } from "./utils/geometry";

const DEFAULT_PLATE: Plate = { id: uid("plate"), width: 151.5, height: 36.8 };

export type Persisted = {
  plates: Plate[];
  socketsEnabled: boolean;
  groups: SocketGroup[];
  editingId: string | null;
  selectedPlateId: string | null;
};

export default function App() {
  const [state, setState] = useLocalStorage<Persisted>("plate-socket-gen:v1", {
    plates: [DEFAULT_PLATE, { id: uid("plate"), width: 200, height: 100 }],
    socketsEnabled: false,
    groups: [],
    editingId: null,
    selectedPlateId: null,
  });

  /* ---------------------- Plate operations ---------------------- */

  const setPlate = (id: string, data: Partial<Plate>) => {
    setState((s) => {
      const plates = s.plates.map((p) => (p.id === id ? { ...p, ...data } : p));

      // After size changed, remove groups on that plate and clear selection/editing if needed
      const before = s.plates.find((p) => p.id === id)!;
      const after = plates.find((p) => p.id === id)!;
      const resized =
        before.width !== after.width || before.height !== after.height;

      const groups = resized
        ? s.groups.filter((g) => g.plateId !== id)
        : s.groups;
      const editingRemoved =
        resized &&
        s.editingId &&
        s.groups.find((g) => g.id === s.editingId)?.plateId === id;

      const selectedRemoved =
        s.selectedPlateId === id ? null : s.selectedPlateId;

      return {
        ...s,
        plates,
        groups,
        editingId: editingRemoved ? null : s.editingId,
        selectedPlateId: selectedRemoved,
      };
    });
  };

  const addPlate = () =>
    setState((s) => ({
      ...s,
      plates: [...s.plates, { id: uid("plate"), width: 100, height: 50 }],
    }));

  const removePlate = (id: string) =>
    setState((s) => ({
      ...s,
      plates:
        s.plates.length > 1 ? s.plates.filter((p) => p.id !== id) : s.plates,
      groups: s.groups.filter((g) => g.plateId !== id),
      editingId:
        s.editingId &&
        s.groups.find((g) => g.id === s.editingId)?.plateId === id
          ? null
          : s.editingId,
      selectedPlateId: s.selectedPlateId === id ? null : s.selectedPlateId,
    }));

  const setGroups = (groups: SocketGroup[]) =>
    setState((s) => ({ ...s, groups }));

  /* ---------------------- Focused plate & groupsToShow ---------------------- */

  // check the focus
  const editingPlateId =
    state.groups.find((g) => g.id === state.editingId)?.plateId || null;

  // priority: explicitly selected plate > current editing group's plate > none
  const focusedPlateId = state.selectedPlateId || editingPlateId || undefined;

  // show ONLY groups from the focused plate
  const groupsToShow = useMemo(() => {
    if (!state.socketsEnabled || !focusedPlateId) return [] as SocketGroup[];
    return state.groups.filter((g) => g.plateId === focusedPlateId);
  }, [state.socketsEnabled, state.groups, focusedPlateId]);

  const selectedPlate = state.selectedPlateId
    ? state.plates.find((p) => p.id === state.selectedPlateId) || null
    : null;

  /* ---------------------- Render ---------------------- */

  return (
    <div className="wrap">
      <div className="left">
        <div style={{ width: "100%" }}>
          <CanvasView
            plates={state.plates}
            showOnlyPlateId={focusedPlateId} // scale to focused plate when set
            groupsToShow={groupsToShow} // only groups on that plate
            editingGroupId={state.editingId} // only this group is draggable
            onCommitGroup={(final) =>
              setState((s) => ({
                ...s,
                groups: s.groups.map((gg) => (gg.id === final.id ? final : gg)),
              }))
            }
          />
          {/* {selectedPlate && (
            // <div className="canvasFooter">
            //   {selectedPlate.width.toFixed(1)} ×{" "}
            //   {selectedPlate.height.toFixed(1)} cm
            // </div>
          )} */}
        </div>
      </div>

      <div className="right">
        <StepPlates
          plates={state.plates}
          setPlate={setPlate}
          addPlate={addPlate}
          removePlate={removePlate}
        />

        <StepSockets
          enabled={state.socketsEnabled}
          setEnabled={(v) => setState((s) => ({ ...s, socketsEnabled: v }))}
          plates={state.plates}
          groups={state.groups}
          setGroups={setGroups}
          editingId={state.editingId}
          setEditingId={(id) => setState((s) => ({ ...s, editingId: id }))}
          selectedPlateId={state.selectedPlateId}
          setSelectedPlateId={(id) =>
            setState((s) => ({ ...s, selectedPlateId: id }))
          }
        />
      </div>
    </div>
  );
}
