/* Tiny helpers for building SVG markup as strings (fast, no framework). */
import type { Rng } from './random';

export type Pt = readonly [number, number];
type AttrValue = string | number | undefined | null | false;

/** Compact number for attributes (1 decimal place, no "-0"). */
export const n = (v: number): string => {
  const r = Math.round(v * 10) / 10;
  return r === 0 ? '0' : String(r);
};
const p = (pt: Pt): string => `${n(pt[0])} ${n(pt[1])}`;
const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

export function attrs(a: Record<string, AttrValue>): string {
  let s = '';
  for (const k in a) {
    const v = a[k];
    if (v === undefined || v === null || v === false) continue;
    s += ` ${k}="${typeof v === 'number' ? n(v) : v}"`;
  }
  return s;
}

export const tag = (name: string, a: Record<string, AttrValue>, children?: string): string =>
  children === undefined ? `<${name}${attrs(a)}/>` : `<${name}${attrs(a)}>${children}</${name}>`;

export const g = (a: Record<string, AttrValue>, children: string): string => tag('g', a, children);
export const path = (d: string, a: Record<string, AttrValue> = {}): string => tag('path', { d, ...a });

/** `translate(x y) rotate(a) scale(s)` – static placement for wrapper groups. */
export const place = (x: number, y: number, rot = 0, sx = 1, sy = sx): string =>
  `translate(${n(x)} ${n(y)})${rot ? ` rotate(${n(rot)})` : ''}${sx !== 1 || sy !== 1 ? ` scale(${n(sx)} ${n(sy)})` : ''}`;

/** Smooth path through points (quadratic curves between midpoints). */
export function smooth(pts: readonly Pt[], closed = false): string {
  if (pts.length < 3) return 'M' + pts.map(p).join('L') + (closed ? 'Z' : '');
  if (closed) {
    let d = `M${p(mid(pts[pts.length - 1], pts[0]))}`;
    for (let i = 0; i < pts.length; i++) d += `Q${p(pts[i])} ${p(mid(pts[i], pts[(i + 1) % pts.length]))}`;
    return d + 'Z';
  }
  let d = `M${p(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) d += `Q${p(pts[i])} ${p(mid(pts[i], pts[i + 1]))}`;
  return d + `L${p(pts[pts.length - 1])}`;
}

/** Continue an already-started path smoothly through points (no initial M). */
export function smoothTail(pts: readonly Pt[]): string {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) d += `Q${p(pts[i])} ${p(mid(pts[i], pts[i + 1]))}`;
  return d + `L${p(pts[pts.length - 1])}`;
}

/** Organic irregular blob — foliage clumps, clouds, bushes. */
export function blob(
  cx: number, cy: number, rx: number, ry: number, r: Rng,
  o: { points?: number; jag?: number; bumps?: number; flatBottom?: number } = {},
): string {
  const N = o.points ?? 16;
  const jag = o.jag ?? 0.12;
  const bumps = o.bumps ?? 0.07;
  const a1 = r() * 6.283, a2 = r() * 6.283, a3 = r() * 6.283;
  const pts: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    let k = 1 + jag * (0.6 * Math.sin(3 * th + a1) + 0.4 * Math.sin(5 * th + a2)) + bumps * Math.sin(11 * th + a3);
    k += (r() - 0.5) * jag * 0.6;
    let y = Math.sin(th) * ry * k;
    if (o.flatBottom && y > 0) y *= o.flatBottom;
    pts.push([cx + Math.cos(th) * rx * k, cy + y]);
  }
  return smooth(pts, true);
}

/** Almond leaf / petal growing from the origin towards -y. */
export function almond(len: number, wid: number, bend = 0): string {
  return (
    `M0 0C${n(wid)} ${n(-len * 0.28)} ${n(wid * 0.85 + bend)} ${n(-len * 0.75)} ${n(bend)} ${n(-len)}` +
    `C${n(-wid * 0.85 + bend)} ${n(-len * 0.75)} ${n(-wid)} ${n(-len * 0.28)} 0 0Z`
  );
}

/** Rounded petal (wider tip) growing from the origin towards -y. */
export function roundPetal(len: number, wid: number): string {
  return (
    `M0 0C${n(wid * 0.9)} ${n(-len * 0.2)} ${n(wid * 1.05)} ${n(-len * 0.95)} 0 ${n(-len)}` +
    `C${n(-wid * 1.05)} ${n(-len * 0.95)} ${n(-wid * 0.9)} ${n(-len * 0.2)} 0 0Z`
  );
}

/* -------------------------------------------------------------------------
 * Shapes as segment lists, so many rotated copies (petals of one flower) can
 * be merged into a single <path> — fewer elements, faster first paint.
 * ---------------------------------------------------------------------- */
export type Seg = readonly [string, ...number[]];

export function segsD(segs: readonly Seg[], angleDeg: number, tx: number, ty: number, s = 1): string {
  const a = (angleDeg * Math.PI) / 180;
  const c = Math.cos(a), sn = Math.sin(a);
  let d = '';
  for (const [cmd, ...v] of segs) {
    d += cmd;
    for (let i = 0; i < v.length; i += 2) {
      const x = v[i] * s, y = v[i + 1] * s;
      d += `${n(tx + x * c - y * sn)} ${n(ty + x * sn + y * c)}${i + 2 < v.length ? ' ' : ''}`;
    }
  }
  return d;
}

export const almondSegs = (len: number, wid: number, bend = 0): Seg[] => [
  ['M', 0, 0],
  ['C', wid, -len * 0.28, wid * 0.85 + bend, -len * 0.75, bend, -len],
  ['C', -wid * 0.85 + bend, -len * 0.75, -wid, -len * 0.28, 0, 0],
  ['Z'],
];

export const roundPetalSegs = (len: number, wid: number): Seg[] => [
  ['M', 0, 0],
  ['C', wid * 0.9, -len * 0.2, wid * 1.05, -len * 0.95, 0, -len],
  ['C', -wid * 1.05, -len * 0.95, -wid * 0.9, -len * 0.2, 0, 0],
  ['Z'],
];

/** Many circles as one path (static speckles, pearls…). */
export function circlesD(list: ReadonlyArray<readonly [number, number, number]>): string {
  let d = '';
  for (const [cx, cy, r] of list) d += `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0`;
  return d;
}

/** Tapered capsule between two points (arms, stems, trunks). */
export function limb(x0: number, y0: number, x1: number, y1: number, w0: number, w1: number): string {
  const dx = x1 - x0, dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const a: Pt = [x0 + (nx * w0) / 2, y0 + (ny * w0) / 2];
  const b: Pt = [x1 + (nx * w1) / 2, y1 + (ny * w1) / 2];
  const c: Pt = [x1 - (nx * w1) / 2, y1 - (ny * w1) / 2];
  const d: Pt = [x0 - (nx * w0) / 2, y0 - (ny * w0) / 2];
  return `M${p(a)}L${p(b)}A${n(w1 / 2)} ${n(w1 / 2)} 0 0 0 ${p(c)}L${p(d)}A${n(w0 / 2)} ${n(w0 / 2)} 0 0 0 ${p(a)}Z`;
}

/* -------------------------------------------------------------------------
 * Strands: tapered ribbons whose centre line bends like hair / silk in wind.
 * Re-computed every frame for hair locks, sashes, sleeves and veils.
 * ---------------------------------------------------------------------- */
export interface Strand {
  x: number; y: number;      // root
  angle: number;             // degrees, 90 = straight down
  len: number;
  w0: number; w1: number;    // width at root / tip
  seg: number;               // number of segments
  curl: number;              // total static curvature along the strand (deg)
  amp: number;               // wave amplitude (deg)
  period: number;            // seconds
  k: number;                 // wave number (radians along the strand)
  phase: number;
  gust: number;              // bend towards +x at full gust (deg)
  bulge?: number;            // widen the middle (veils)
  kink?: number;             // static S-waves along the strand (deg) — wavy hair
  kinkFreq?: number;         // waves per strand length
  kinkPhase?: number;
  taper0?: number;           // width at the very root as a fraction (hair grows in softly)
}

const DEG = Math.PI / 180;

export function strandPath(s: Strand, t: number, gust: number, breeze: number): string {
  const L: Pt[] = [];
  const R: Pt[] = [];
  const step = s.len / s.seg;
  let x = s.x, y = s.y;
  const w = (2 * Math.PI) / s.period;
  for (let i = 0; i <= s.seg; i++) {
    const u = i / s.seg;
    const wave = s.amp * breeze * (0.35 + u) * Math.sin(w * t - u * s.k + s.phase);
    const kink = s.kink ? s.kink * Math.sin(u * (s.kinkFreq ?? 1.5) * 2 * Math.PI + (s.kinkPhase ?? 0)) : 0;
    const a = (s.angle + s.curl * u + wave + kink - s.gust * gust * u * (0.6 + 0.4 * u)) * DEG;
    let half = (s.w0 + (s.w1 - s.w0) * u) / 2;
    if (s.bulge) half *= 1 + s.bulge * Math.sin(Math.PI * u);
    if (s.taper0 !== undefined && u < 0.2) half *= s.taper0 + (1 - s.taper0) * Math.sin((u / 0.2) * Math.PI * 0.5);
    const nx = -Math.sin(a), ny = Math.cos(a);
    L.push([x + nx * half, y + ny * half]);
    R.push([x - nx * half, y - ny * half]);
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
  }
  R.reverse();
  return `M${p(L[0])}` + smoothTail(L.slice(1)) + smoothTail(R) + 'Z';
}
