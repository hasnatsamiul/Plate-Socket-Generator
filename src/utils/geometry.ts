import { LIMITS, SOCKET } from "../constants";
import type { Cm, Plate, SocketGroup } from "../types";

export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export const isPlateEligible = (p: Plate) =>
  p.width >= LIMITS.minSocketPlate && p.height >= LIMITS.minSocketPlate;

export function groupExtent(g: SocketGroup): { w: Cm; h: Cm } {
  const span = (g.count - 1) * (SOCKET.size + SOCKET.gap) + SOCKET.size;
  return g.dir === "H" ? { w: span, h: SOCKET.size } : { w: SOCKET.size, h: span };
}

export function rectsOverlap(
  a: { x: Cm; y: Cm; w: Cm; h: Cm },
  b: { x: Cm; y: Cm; w: Cm; h: Cm }
) {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

export function validateGroup(
  g: SocketGroup,
  plate: Plate,
  siblings: SocketGroup[]
): { ok: boolean; reason?: string } {
  if (!isPlateEligible(plate)) {
    return { ok: false, reason: "Rückwand ist zu klein (min 40×40 cm)." };
  }

  const { w, h } = groupExtent(g);

  // edge clearances
  if (g.left < LIMITS.edgeMin) return { ok: false, reason: `>= ${LIMITS.edgeMin} cm vom linken Rand.` };
  if (g.bottom < LIMITS.edgeMin) return { ok: false, reason: `>= ${LIMITS.edgeMin} cm vom unteren Rand.` };
  if (g.left + w > plate.width - LIMITS.edgeMin)
    return { ok: false, reason: `>= ${LIMITS.edgeMin} cm vom rechten Rand.` };
  if (g.bottom + h > plate.height - LIMITS.edgeMin)
    return { ok: false, reason: `>= ${LIMITS.edgeMin} cm vom oberen Rand.` };

  // spacing to other groups (a as this group; b as sibling expanded by groupGap)
  const a = { x: g.left, y: g.bottom, w, h };
  for (const s of siblings) {
    if (s.id === g.id) continue;
    const e = groupExtent(s);
    const b = {
      x: s.left - LIMITS.groupGap,
      y: s.bottom - LIMITS.groupGap,
      w: e.w + LIMITS.groupGap * 2,
      h: e.h + LIMITS.groupGap * 2,
    };
    if (rectsOverlap(a, b)) {
      return { ok: false, reason: `>= ${LIMITS.groupGap} cm Abstand zu anderen Gruppen.` };
    }
  }

  return { ok: true };
}

export function snapInsidePlate(g: SocketGroup, p: Plate): SocketGroup {
  const { w, h } = groupExtent(g);
  return {
    ...g,
    left: clamp(g.left, LIMITS.edgeMin, Math.max(LIMITS.edgeMin, p.width - LIMITS.edgeMin - w)),
    bottom: clamp(g.bottom, LIMITS.edgeMin, Math.max(LIMITS.edgeMin, p.height - LIMITS.edgeMin - h)),
  };
}
