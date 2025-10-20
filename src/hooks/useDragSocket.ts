import * as React from "react";
import type { Plate, SocketGroup } from "../types";
import { validateGroup } from "../utils/geometry";

type Params = {
  group: SocketGroup;
  plate: Plate;
  siblings: SocketGroup[];           
  scale: number;                     
  onCommit?: (g: SocketGroup) => void;
};

type DragState = {
  dragging: boolean;
  live: { left: number; bottom: number } | null; // Dragging preview while moving the socket (cm)
  invalidReason: string | null;
};

export function useDragSocket({
  group,
  plate,
  siblings,
  scale,
  onCommit,
}: Params) {
  const [state, setState] = React.useState<DragState>({
    dragging: false,
    live: null,
    invalidReason: null,
  });

  // pointers / starting values stored in refs to avoid re-renders during drag
  const startClient = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPos = React.useRef<{ left: number; bottom: number }>({
    left: group.left,
    bottom: group.bottom,
  });
  const lastValid = React.useRef<{ left: number; bottom: number }>({
    left: group.left,
    bottom: group.bottom,
  });

  // offset inside the element when grabbing (px)
  const offsetInEl = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    // Only primary button/finger
    if (e.button !== 0 && e.pointerType !== "touch") return;

    // prevent text selection / scroll while dragging
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();

    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    offsetInEl.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    startClient.current = { x: e.clientX, y: e.clientY };
    startPos.current = { left: group.left, bottom: group.bottom };
    lastValid.current = { left: group.left, bottom: group.bottom };

    setState((s) => ({
      ...s,
      dragging: true,
      live: { left: group.left, bottom: group.bottom },
      invalidReason: null,
    }));
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!state.dragging) return;

    // movement in px from pointer down
    const dxPx = e.clientX - startClient.current.x;
    const dyPx = e.clientY - startClient.current.y;

    // convert to cm
    const dx = dxPx / Math.max(scale, 0.000001);
    const dy = dyPx / Math.max(scale, 0.000001);

    // Bottom increases when  move UP.
    const candidate: SocketGroup = {
      ...group,
      left: startPos.current.left + dx,
      bottom: startPos.current.bottom - dy, 
    };

    // Validate vs siblings on same plate
    const sibs = siblings.filter((s) => s.id !== group.id);
    const ok = validateGroup(candidate, plate, sibs);

    if (ok.ok) {
      lastValid.current = { left: candidate.left, bottom: candidate.bottom };
      setState((s) => ({
        ...s,
        live: { left: candidate.left, bottom: candidate.bottom },
        invalidReason: null,
      }));
    } else {
      // keep last valid position and show reason and block invalid
      setState((s) => ({
        ...s,
        live: { ...lastValid.current },
        invalidReason: ok.reason ?? "Ungültige Position.",
      }));
    }
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!state.dragging) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);

    const final = lastValid.current;
    setState((s) => ({
      ...s,
      dragging: false,
      invalidReason: null,
      live: null,
    }));

    // Only commit if it actually changed
    if (final.left !== group.left || final.bottom !== group.bottom) {
      onCommit?.({ ...group, left: final.left, bottom: final.bottom });
    }
  };

  return {
    state,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}
