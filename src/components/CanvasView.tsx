import React, { useEffect, useMemo, useRef, useState } from "react";
import { SOCKET } from "../constants";
import type { Cm, Plate, SocketGroup } from "../types";
import { groupExtent } from "../utils/geometry";
import GuidelineOverlay from "./GuidelineOverlay";
import { useDragSocket } from "../hooks/useDragSocket";

export default function CanvasView({
  plates,
  showOnlyPlateId,
  groupsToShow,
  onCommitGroup,
  editingGroupId,
}: {
  plates: Plate[];
  showOnlyPlateId?: string; // when set, only this plate is shown & scaled
  groupsToShow: SocketGroup[]; // groups to render (usually for the focused plate)
  onCommitGroup?: (g: SocketGroup) => void; // called when a drag finishes
  editingGroupId?: string | null; // which group is active/draggable
}) {
  const { canvasRef, bbox } = useScaleObserver();

  // plates are visibility
  const visiblePlates = useMemo(
    () =>
      showOnlyPlateId ? plates.filter((p) => p.id === showOnlyPlateId) : plates,
    [plates, showOnlyPlateId]
  );
  const visibleIds = useMemo(
    () => new Set(visiblePlates.map((p) => p.id)),
    [visiblePlates]
  );

  // Only groups for visible plates
  const groupsForVisible = useMemo(
    () => groupsToShow.filter((g) => visibleIds.has(g.plateId)),
    [groupsToShow, visibleIds]
  );

  // Build centered view for the plates we’re actually showing
  const view = useCenteredView(visiblePlates, bbox);

  return (
    <div className="canvas">
      {/* Inner stage provides a uniform gutter via CSS (see .canvasInner in styles.css) */}
      <div className="canvasInner" ref={canvasRef}>
        {/* Plates */}
        {visiblePlates.map((p) => {
          const pos = view.layout[p.id];
          const style: React.CSSProperties = {
            left: view.pxForCm(pos.x),
            top: view.pxForCm(pos.y),
            width: view.pxForCm(p.width),
            height: view.pxForCm(p.height),
          };
          const plateBottomPx = view.pxForCm(pos.y + p.height);
          const plateCenterPx = view.pxForCm(pos.x + p.width / 2);

          return (
            <React.Fragment key={p.id}>
              <div className="plate" style={style} />
              {/* Dimension label centered under the plate */}
              <div
                className="plateDimLabel"
                style={{
                  left: plateCenterPx,
                  top: plateBottomPx + 6,
                  transform: "translateX(-50%)",
                }}
              >
                {p.width.toFixed(1)} × {p.height.toFixed(1)} cm
              </div>
            </React.Fragment>
          );
        })}

        {/* Socket groups (only active is draggable) */}
        {groupsForVisible.map((g) => (
          <SocketGroupItem
            key={g.id}
            g={g}
            allGroups={groupsForVisible}
            plates={plates}
            layout={view.layout}
            pxForCm={view.pxForCm}
            isActive={editingGroupId === g.id}
            onCommitGroup={onCommitGroup}
            scale={view.scale}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Single socket group item (isolates hook usage) ---------- */
function SocketGroupItem({
  g,
  allGroups,
  plates,
  layout,
  pxForCm,
  isActive,
  onCommitGroup,
  scale,
}: {
  g: SocketGroup;
  allGroups: SocketGroup[];
  plates: Plate[];
  layout: Record<string, { x: Cm; y: Cm }>;
  pxForCm: (cm: Cm) => number;
  isActive: boolean;
  onCommitGroup?: (g: SocketGroup) => void;
  scale: number;
}) {
  const p = plates.find((pl) => pl.id === g.plateId)!;
  const base = layout[p.id];
  const ext = groupExtent(g);

  const { state, handlers } = useDragSocket({
    group: g,
    plate: p,
    siblings: allGroups,
    scale,
    onCommit: (final) => onCommitGroup?.(final),
  });

  const left = isActive && state.live ? state.live.left : g.left;
  const bottom = isActive && state.live ? state.live.bottom : g.bottom;

  // Convert bottom-left in cm then top-left CSS within the inner stage
  const topCm = base.y + (p.height - bottom - ext.h);
  const leftCm = base.x + left;

  const style: React.CSSProperties = {
    left: pxForCm(leftCm),
    top: pxForCm(topCm),
    width: pxForCm(ext.w),
    height: pxForCm(ext.h),
    cursor: isActive ? (state.dragging ? "grabbing" : "grab") : "default",
    pointerEvents: isActive ? "auto" : "none",
    opacity: isActive ? 1 : 0.4,
    position: "absolute",
  };

  const bubblePos: React.CSSProperties = {
    left: pxForCm(leftCm) + pxForCm(ext.w) / 2,
    top: pxForCm(topCm) - 8,
    transform: "translate(-50%, -100%)",
  };

  return (
    <>
      <div
        className={`socketGroup ${state.invalidReason ? "invalid" : ""} ${
          isActive ? "activeGroup" : "idleGroup"
        }`}
        style={style}
        onPointerDown={isActive ? handlers.onPointerDown : undefined}
        onPointerMove={isActive ? handlers.onPointerMove : undefined}
        onPointerUp={isActive ? handlers.onPointerUp : undefined}
        // onPointerCancel={isActive ? handlers.onPointerCancel : undefined}
      >
        {Array.from({ length: g.count }).map((_, i) => {
          const offset = i * (SOCKET.size + SOCKET.gap);
          const s: React.CSSProperties =
            g.dir === "H"
              ? {
                  left: pxForCm(offset),
                  top: 0,
                  width: pxForCm(SOCKET.size),
                  height: pxForCm(SOCKET.size),
                  position: "absolute",
                }
              : {
                  top: pxForCm(offset),
                  left: 0,
                  width: pxForCm(SOCKET.size),
                  height: pxForCm(SOCKET.size),
                  position: "absolute",
                };
          return (
            <div key={i} className="socket" style={s}>
              <img src={SOCKET.img} draggable={false} alt="socket" />
            </div>
          );
        })}
      </div>

      {/* guidelines + invalid reason bubble */}
      {isActive && state.dragging && (
        <>
          <GuidelineOverlay
            baseXcm={base.x}
            baseYcm={base.y}
            plate={p}
            leftCm={left}
            bottomCm={bottom}
            pxForCm={pxForCm}
          />
          {state.invalidReason && (
            <div className="dragError" style={bubblePos}>
              {state.invalidReason}
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ---------- canvas size observer: measures the inner stage ----- */
function useScaleObserver() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [bbox, setBbox] = useState({ w: 600, h: 600 });

  useEffect(() => {
    const obs = new ResizeObserver((ents) => {
      const cr = ents[0].contentRect;
      setBbox({ w: cr.width, h: cr.height });
    });
    if (canvasRef.current) obs.observe(canvasRef.current);
    return () => obs.disconnect();
  }, []);

  return { canvasRef, bbox };
}

/* ---------- centered view (bottom-aligned row) with robust deps ------- */

function useCenteredView(visible: Plate[], bbox: { w: number; h: number }) {
  const gapCm = 2;

  // depend on a width/height signature so memos refresh when values change
  const sig = useMemo(
    () => visible.map((p) => `${p.id}:${p.width}x${p.height}`).join("|"),
    [visible]
  );

  const span = useMemo(() => {
    const totalW =
      visible.reduce((acc, p, i) => acc + p.width + (i ? gapCm : 0), 0) || 1;
    const maxH = visible.reduce((m, p) => Math.max(m, p.height), 1);
    return { totalW, maxH };
  }, [sig]);

  const scale = useMemo(
    () => Math.min(bbox.w / span.totalW, bbox.h / span.maxH),
    [bbox.w, bbox.h, span.totalW, span.maxH]
  );

  const pxForCm = (cm: Cm) => cm * scale;

  const padXPx = Math.max(0, (bbox.w - scale * span.totalW) / 2);
  const padYPx = Math.max(0, (bbox.h - scale * span.maxH) / 2);
  const padXCm = padXPx / Math.max(scale, 0.0001);
  const padYCm = padYPx / Math.max(scale, 0.0001);

  // bottom alignment: all plates share a baseline centered vertically
  const layout = useMemo(() => {
    const o: Record<string, { x: Cm; y: Cm }> = {};
    let x = padXCm;
    const maxH = span.maxH;
    for (let i = 0; i < visible.length; i++) {
      const p = visible[i];
      const yTop = padYCm + (maxH - p.height);
      o[p.id] = { x, y: yTop };
      x += p.width + (i < visible.length - 1 ? gapCm : 0);
    }
    return o;
  }, [sig, padXCm, padYCm, span.maxH, visible.length]);

  return { pxForCm, layout, scale };
}
