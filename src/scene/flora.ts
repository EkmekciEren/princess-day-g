/* Flowers, leaves, grass tufts, trees and rose bushes — each moving part is
 * its own sprite with a pivot at its natural hinge: stems sway from their
 * base, leaves flutter from their stalk, flower heads bloom about their
 * centre, canopies sway about the top of the trunk. All coordinates are
 * scene units. */
import { almondSegs, blob, circlesD, g, n, path, roundPetalSegs, segsD, smooth, type Pt } from '../lib/svg';
import { between, pick, weighted, type Rng } from '../lib/random';
import { around, box, type Stage } from '../lib/stage';
import type { Rig } from '../motion/rig';

export type FlowerKind = 'daisy' | 'rose' | 'buttercup' | 'forgetmenot' | 'poppy' | 'bell';

const ROSE_FILLS = ['gRose', 'gRose', 'gRoseDeep', 'gRoseCream'] as const;
const STEM = '#5c7149';

/** Bloom start time: ripples outwards from the princess. */
export const bloomStart = (r: Rng, x: number): number => 0.5 + (Math.abs(x - 800) / 800) * 2.4 + r() * 1.1;

/* ------------------------------------------------------------------ heads
 * Drawn around (cx, cy); all petals of a ring are merged into one path.   */

function ring(count: number, segs: (i: number) => Parameters<typeof segsD>[0], cx: number, cy: number, rot0: number, jitter: number, r: Rng): string {
  let d = '';
  for (let i = 0; i < count; i++) d += segsD(segs(i), rot0 + (360 / count) * i + (r() - 0.5) * jitter, cx, cy);
  return d;
}

export function daisyHead(r: Rng, cx: number, cy: number, size: number): string {
  const count = 11 + Math.floor(r() * 4);
  return (
    path(ring(count, () => almondSegs(size * 0.95, size * 0.2), cx, cy, 180 / count, 8, r), { fill: '#e9dcc4' }) +
    path(ring(count, () => almondSegs(size, size * 0.22, (r() - 0.5) * 2), cx, cy, 0, 8, r), { fill: 'url(#gHeadCream)' }) +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(size * 0.3)}" fill="url(#gCenterGold)"/>` +
    `<circle cx="${n(cx - size * 0.06)}" cy="${n(cy - size * 0.07)}" r="${n(size * 0.12)}" fill="#f7e3a0" opacity=".7"/>`
  );
}

export function roseHead(r: Rng, cx: number, cy: number, size: number, fill: string): string {
  const c = size * 0.34;
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(size)}" fill="url(#${fill})"/>` +
    path(ring(5, () => roundPetalSegs(size * 1.05, size * 0.62), cx, cy, r() * 72, 14, r), { fill: `url(#${fill})`, opacity: 0.9 }) +
    path(ring(4, () => roundPetalSegs(size * 0.68, size * 0.48), cx, cy, 40, 10, r), { fill: `url(#${fill})` }) +
    path(
      `M${n(cx - c)} ${n(cy)}C${n(cx - c)} ${n(cy - c * 1.2)} ${n(cx + c)} ${n(cy - c * 1.2)} ${n(cx + c * 0.8)} ${n(cy + c * 0.1)}` +
      `C${n(cx + c * 0.6)} ${n(cy + c * 0.9)} ${n(cx - c * 0.4)} ${n(cy + c * 0.8)} ${n(cx - c * 0.2)} ${n(cy)}`,
      { fill: 'none', stroke: '#6e2a35', 'stroke-width': n(Math.max(0.6, size * 0.08)), 'stroke-linecap': 'round', opacity: 0.5 },
    )
  );
}

function buttercupHead(r: Rng, cx: number, cy: number, size: number): string {
  return (
    path(ring(5, () => roundPetalSegs(size, size * 0.62), cx, cy, r() * 72, 10, r), { fill: 'url(#gHeadGold)' }) +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(size * 0.26)}" fill="#9a8a3c"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(size * 0.14)}" fill="#e8cf74"/>`
  );
}

function forgetMeNots(r: Rng, cx: number, cy: number, size: number): string {
  const petals: Array<[number, number, number]> = [];
  const centres: Array<[number, number, number]> = [];
  const k = 4 + Math.floor(r() * 3);
  for (let j = 0; j < k; j++) {
    const ox = cx + (r() - 0.5) * size * 2.6, oy = cy + (r() - 0.5) * size * 2;
    const fs = size * between(r, 0.55, 0.85);
    const a0 = r() * 6.28;
    for (let i = 0; i < 5; i++) {
      const a = a0 + (i * Math.PI * 2) / 5;
      petals.push([ox + Math.cos(a) * fs * 0.55, oy + Math.sin(a) * fs * 0.55, fs * 0.45]);
    }
    centres.push([ox, oy, fs * 0.22]);
  }
  return path(circlesD(petals), { fill: 'url(#gHeadBlue)' }) + path(circlesD(centres), { fill: '#f0d77a' });
}

function poppyHead(r: Rng, cx: number, cy: number, size: number): string {
  return (
    path(ring(4, () => roundPetalSegs(size, size * 0.85), cx, cy, 45 + r() * 20, 12, r), { fill: 'url(#gHeadCoral)', opacity: 0.95 }) +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(size * 0.3)}" fill="#3c2a2c"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(size * 0.14)}" fill="#7c6a4c"/>`
  );
}

/** Static leaf path at (x,y), pointing at angle (deg, 0 = up). */
export const leafD = (x: number, y: number, angle: number, len: number, wid: number, bend = 0): string =>
  segsD(almondSegs(len, wid, bend), angle, x, y);

/** A single fluttering leaf sprite. */
export function leafSprite(st: Stage, rig: Rig, sceneX: number, x: number, y: number, angle: number, len: number, wid: number, fill = 'gLeaf'): void {
  const id = rig.sway({ x: sceneX, amp: [1.5, 4], period: [4, 7], flutter: 1.2, gust: 3 });
  st.sprite(around(x, y, len + 2), path(leafD(x, y, angle, len, wid, (rig.rng() - 0.5) * len * 0.15), { fill: `url(#${fill})` }), { id, origin: [x, y] });
}

/* ---------------------------------------------------------------- flowers */

export interface FlowerOpts {
  x: number;       // base, scene coords
  y: number;
  h: number;       // stem height
  kind: FlowerKind;
  size?: number;   // head radius
  bloom?: boolean;
  cull?: boolean;  // top-level item: mark for off-screen culling
}

export function flower(st: Stage, rig: Rig, r: Rng, o: FlowerOpts): void {
  const size = o.size ?? between(r, 7, 12);
  const { x, y, h } = o;
  const bend = (r() - 0.5) * h * 0.35;
  const hx = x + bend, hy = y - h;
  const ctrlX = x + bend * 0.2 + (r() - 0.5) * h * 0.25;
  const stemW = Math.max(1.3, size * 0.2);
  let art = path(`M${n(x)} ${n(y)}Q${n(ctrlX)} ${n(y - h * 0.55)} ${n(hx)} ${n(hy)}`, {
    fill: 'none', stroke: STEM, 'stroke-width': n(stemW), 'stroke-linecap': 'round',
  });
  let leaves = '';
  const leafCount = o.kind === 'forgetmenot' ? 2 : 1 + Math.floor(r() * 2);
  let leafReach = 0;
  for (let i = 0; i < leafCount; i++) {
    const u = between(r, 0.15, 0.5);
    const lx = (1 - u) * (1 - u) * x + 2 * u * (1 - u) * ctrlX + u * u * hx;
    const ly = y - h * (2 * u * (1 - u) * 0.55 + u * u);
    const side = i % 2 === 0 ? -1 : 1;
    const len = size * between(r, 1.2, 1.9);
    leafReach = Math.max(leafReach, len);
    leaves += leafD(lx, ly, side * between(r, 35, 70), len, size * between(r, 0.35, 0.5), (r() - 0.5) * 2);
  }
  art += path(leaves, { fill: 'url(#gLeaf)' });

  const R = size * 1.25;
  let headArt = '';
  let canBloom = o.bloom !== false;
  let extraR = 0;
  switch (o.kind) {
    case 'daisy': headArt = daisyHead(r, hx, hy, size); break;
    case 'rose': headArt = roseHead(r, hx, hy, size * 0.9, pick(r, ROSE_FILLS)); break;
    case 'buttercup': headArt = buttercupHead(r, hx, hy, size * 0.75); break;
    case 'poppy': headArt = poppyHead(r, hx, hy, size); break;
    case 'forgetmenot':
      art += forgetMeNots(r, hx, hy, size * 0.5);
      canBloom = false;
      extraR = size * 0.8;
      break;
    case 'bell': {
      // arching stem with nodding lavender bells
      const ax = hx + size * 2.2, ay = hy + size * 1.2;
      art += path(`M${n(hx)} ${n(hy)}Q${n(hx + size * 1.2)} ${n(hy - size * 0.6)} ${n(ax)} ${n(ay)}`, { fill: 'none', stroke: STEM, 'stroke-width': 1.2 });
      let bells = '';
      for (let i = 0; i < 3; i++) {
        const bx = hx + size * (0.6 + i * 0.8), by = hy - size * 0.2 + i * size * 0.55;
        bells +=
          `M${n(bx - size * 0.45)} ${n(by + size * 1.35)}C${n(bx - size * 0.5)} ${n(by + size * 0.6)} ${n(bx - size * 0.3)} ${n(by + size * 0.45)} ${n(bx)} ${n(by + size * 0.45)}` +
          `C${n(bx + size * 0.3)} ${n(by + size * 0.45)} ${n(bx + size * 0.5)} ${n(by + size * 0.6)} ${n(bx + size * 0.45)} ${n(by + size * 1.35)}` +
          `Q${n(bx + size * 0.25)} ${n(by + size * 1.15)} ${n(bx)} ${n(by + size * 1.4)}Q${n(bx - size * 0.25)} ${n(by + size * 1.15)} ${n(bx - size * 0.45)} ${n(by + size * 1.35)}Z`;
      }
      art += path(bells, { fill: 'url(#gHeadLav)' });
      canBloom = false;
      extraR = size * 3;
      break;
    }
  }
  if (headArt && !canBloom) art += g({ transform: `rotate(${n((r() - 0.5) * 30)} ${n(hx)} ${n(hy)})` }, headArt);

  const pad = Math.max(leafReach, R + extraR) + 3;
  const b = box(Math.min(x, hx, ctrlX) - pad, hy - R - extraR - 3, Math.max(x, hx, ctrlX) + pad, y + 3);
  const swayId = rig.sway({ x, amp: [1.2, 3.5], period: [4.5, 9], gust: between(r, 3, 6) });
  st.open(b, { id: swayId, origin: [x, y], cullX: o.cull ? x : undefined }).art(art, b);
  if (headArt && canBloom) {
    const tilt = (r() - 0.5) * 30;
    const bid = rig.bloom({ x, start: bloomStart(r, x), dur: between(r, 2.2, 3.4) });
    const hb = around(hx, hy, R + 2);
    st.open(hb, { id: bid, origin: [hx, hy] }).art(g({ transform: `rotate(${n(tilt)} ${n(hx)} ${n(hy)})` }, headArt), hb).close();
  }
  st.close();
}

export const randomKind = (r: Rng): FlowerKind =>
  weighted(r, [['daisy', 30], ['rose', 18], ['buttercup', 18], ['forgetmenot', 13], ['poppy', 10], ['bell', 9]] as const);

/* ------------------------------------------------------------ grass tufts */

export function tuft(st: Stage, rig: Rig, r: Rng, x: number, y: number, h: number, blades: number, palette: 'light' | 'dark' = 'light'): void {
  const fills = palette === 'light' ? ['gBlade1', 'gBlade3'] : ['gBlade2', 'gBlade1'];
  let a = '', b = '';
  let minX = x, maxX = x;
  for (let i = 0; i < blades; i++) {
    const bx = x + (i - blades / 2) * h * 0.06 + (r() - 0.5) * h * 0.08;
    const bh = h * between(r, 0.55, 1);
    const bend = (r() - 0.35) * bh * 0.5;
    const w = h * between(r, 0.035, 0.06);
    minX = Math.min(minX, bx - w, bx + bend);
    maxX = Math.max(maxX, bx + w, bx + bend);
    const d = `M${n(bx - w)} ${n(y)}Q${n(bx - w * 0.4 + bend * 0.35)} ${n(y - bh * 0.55)} ${n(bx + bend)} ${n(y - bh)}Q${n(bx + w * 0.5 + bend * 0.4)} ${n(y - bh * 0.5)} ${n(bx + w)} ${n(y)}Z`;
    if (i % 2) a += d; else b += d;
  }
  const bx = box(minX - 3, y - h - 3, maxX + 3, y + 2);
  st.open(bx, { layer: false, cullX: x });
  st.sprite(bx, path(a, { fill: `url(#${fills[0]})` }), { id: rig.sway({ x, amp: [1.8, 3.6], period: [4, 7], gust: between(r, 5, 8) }), origin: [x, y] });
  st.sprite(bx, path(b, { fill: `url(#${fills[1]})` }), { id: rig.sway({ x, amp: [1.5, 3.2], period: [4.5, 8], gust: between(r, 4, 7) }), origin: [x, y] });
  st.close();
}

/* ------------------------------------------------------------------ trees */

export interface TreeOpts {
  x: number;
  base: number;
  h: number;
  lean: number;
  crown: number;           // canopy radius
  fruit: 'orange' | 'blossom';
  tint: 'A' | 'B' | 'C';
  /** Optional low hanging branch (for the orange picker). */
  hang?: Pt;
}

export function blossomD(x: number, y: number, s: number): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    out.push([x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.5]);
  }
  return out;
}

export function tree(st: Stage, rig: Rig, r: Rng, o: TreeOpts): void {
  const topX = o.x + o.lean, topY = o.base - o.h * 0.52;
  const w0 = o.h * 0.042, w1 = o.h * 0.02;
  const midX = o.x + o.lean * 0.3 + (r() - 0.5) * 10;
  const midY = o.base - o.h * 0.26;
  let trunk = path(
    `M${n(o.x - w0 * 0.9)} ${n(o.base + 3)}Q${n(o.x - w0 * 0.5)} ${n(o.base - 8)} ${n(midX - w0 * 0.42)} ${n(midY)}` +
    `Q${n(topX - w1 * 0.6)} ${n(topY + 30)} ${n(topX - w1 / 2)} ${n(topY - 10)}L${n(topX + w1 / 2)} ${n(topY - 10)}` +
    `Q${n(topX + w1 * 0.6)} ${n(topY + 30)} ${n(midX + w0 * 0.42)} ${n(midY)}Q${n(o.x + w0 * 0.5)} ${n(o.base - 8)} ${n(o.x + w0 * 0.9)} ${n(o.base + 3)}Z`,
    { fill: 'url(#gTrunk)' },
  );
  let branches = '';
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1;
    const sy = topY + between(r, -10, 40);
    const ex = topX + side * o.crown * between(r, 0.4, 0.75);
    const ey = topY - o.crown * between(r, 0.2, 0.75);
    branches += `M${n(topX)} ${n(sy)}Q${n((topX + ex) / 2)} ${n(sy - 10)} ${n(ex)} ${n(ey)}`;
  }
  trunk += path(branches, { fill: 'none', stroke: '#4a3a2f', 'stroke-width': n(w1 * 0.45), 'stroke-linecap': 'round' });
  trunk += `<ellipse cx="${n(o.x + 30)}" cy="${n(o.base + 4)}" rx="${n(o.crown * 0.9)}" ry="${n(o.crown * 0.12)}" fill="url(#gShadow)"/>`;

  const cx = topX, cy = topY - o.crown * 0.45;
  const fills = { A: ['gLeafA', 'gLeafB'], B: ['gLeafB', 'gLeafC'], C: ['gLeafC', 'gMyrtle'] }[o.tint];
  const span = o.crown * 1.75;
  const canopyBox = box(cx - span, cy - o.crown * 1.25, cx + span, topY + 60);

  st.open(box(o.x - o.crown * 2, cy - o.crown * 1.3, o.x + o.crown * 2.2, o.base + 12), { layer: false, cullX: o.x });
  st.art(trunk, box(o.x - o.crown * 1.2, topY - o.crown, o.x + o.crown * 1.3, o.base + 12));
  st.open(canopyBox, { id: rig.sway({ x: o.x, amp: [0.4, 0.9], period: [10, 14], gust: 1.2 }), origin: [topX, topY] });

  const clusters = 9 + Math.floor(r() * 3);
  let edgeStatic = '';
  for (let i = 0; i < clusters; i++) {
    const a = (i / clusters) * Math.PI * 2 + r() * 0.5;
    const rr = o.crown * between(r, 0.25, 0.62);
    const kx = cx + Math.cos(a) * rr * 1.15, ky = cy + Math.sin(a) * rr * 0.8;
    const size = o.crown * between(r, 0.36, 0.52);
    const lit = Math.cos(a + 2.3) > 0; // upper-left clusters catch the light
    let c = path(blob(kx, ky, size, size * 0.82, r, { jag: 0.14, bumps: 0.09 }), { fill: `url(#${lit ? fills[0] : fills[1]})` });
    let light = '', dark = '';
    for (let k = 0; k < 4; k++) {
      const d = blob(kx + (r() - 0.5) * size, ky + (r() - 0.5) * size * 0.8, size * 0.22, size * 0.16, r, { points: 9 });
      if (k % 2) light += d; else dark += d;
    }
    c += path(light, { fill: '#a7b98d', opacity: 0.28 }) + path(dark, { fill: '#344429', opacity: 0.22 });
    const extras = Math.floor(between(r, 1, 3.5));
    const fruit: Array<[number, number, number]> = [];
    let blossoms: Array<[number, number, number]> = [];
    for (let k = 0; k < extras; k++) {
      const fx = kx + (r() - 0.5) * size * 1.2, fy = ky + between(r, -0.2, 0.55) * size;
      if (o.fruit === 'orange') fruit.push([fx, fy, between(r, 4.5, 7)]);
      else blossoms = blossoms.concat(blossomD(fx, fy, between(r, 3, 4.6)));
    }
    if (fruit.length) c += path(circlesD(fruit), { fill: 'url(#gOrange)' });
    if (blossoms.length) c += path(circlesD(blossoms), { fill: '#fbf4e6' });
    // a couple of leaves on the rim of each clump
    for (let k = 0; k < 2; k++) {
      const la = r() * Math.PI * 2;
      const lx = kx + Math.cos(la) * size * 0.95, ly = ky + Math.sin(la) * size * 0.78;
      edgeStatic += leafD(lx, ly, (la * 180) / Math.PI + 90, between(r, 9, 14), between(r, 3.5, 5));
    }
    const cb = around(kx, ky, size * 1.3, size * 1.15);
    const id = rig.sway({ x: o.x, amp: [0.6, 1.6], period: [6, 11], gust: 1.4 });
    st.sprite(cb, c, { id, origin: [cx + (kx - cx) * 0.3, cy + (ky - cy) * 0.3 + 20] });
  }
  st.art(path(edgeStatic, { fill: 'url(#gLeaf)' }), canopyBox);
  // a few individually fluttering leaves
  for (let i = 0; i < 4; i++) {
    const a = r() * Math.PI * 2;
    const lx = cx + Math.cos(a) * o.crown * between(r, 0.85, 1.02);
    const ly = cy + Math.sin(a) * o.crown * between(r, 0.6, 0.78);
    leafSprite(st, rig, o.x, lx, ly, (a * 180) / Math.PI + 90, between(r, 10, 15), between(r, 3.8, 5.5), r() < 0.5 ? 'gLeaf' : 'gLeafPale');
  }
  // hanging branch with fruit (the orange picker reaches for it)
  if (o.hang) {
    const [hx, hy] = o.hang;
    let hb = path(`M${n(cx + (hx - cx) * 0.2)} ${n(cy + 30)}Q${n(hx + 20)} ${n(hy - 50)} ${n(hx)} ${n(hy)}`, {
      fill: 'none', stroke: '#4a3a2f', 'stroke-width': 2.4, 'stroke-linecap': 'round',
    });
    hb += path(blob(hx + 6, hy - 22, 26, 18, r), { fill: `url(#${fills[1]})` });
    hb += path(blob(hx - 8, hy - 8, 16, 12, r), { fill: `url(#${fills[0]})` });
    let lv = '';
    for (let i = 0; i < 5; i++) lv += leafD(hx + between(r, -18, 24), hy + between(r, -30, 4), between(r, -160, 160), 11, 4.4);
    hb += path(lv, { fill: 'url(#gLeaf)' });
    hb += path(circlesD([[hx - 2, hy + 4, 6], [hx + 12, hy - 6, 5]]), { fill: 'url(#gOrange)' });
    const hbBox = box(Math.min(cx, hx) - 40, cy, Math.max(cx, hx) + 50, hy + 14);
    st.sprite(hbBox, hb, { id: rig.sway({ x: o.x, amp: [1, 2], period: [5, 8], gust: 2 }), origin: [cx, cy + 30] });
  }
  st.close(); // canopy
  st.close(); // tree
}

/* -------------------------------------------------------------- rose bush */

export function roseBush(st: Stage, rig: Rig, r: Rng, x: number, base: number, w: number, h: number): void {
  st.open(box(x - w, base - h * 1.3, x + w, base + 12), { layer: false, cullX: x });
  st.art(`<ellipse cx="${n(x)}" cy="${n(base + 2)}" rx="${n(w * 0.62)}" ry="${n(h * 0.1)}" fill="url(#gShadow)"/>`, box(x - w, base - 20, x + w, base + 12));
  // foliage in three swaying masses
  const parts = 8;
  const groups: string[] = ['', '', ''];
  const groupBoxes: Box4[] = [[1e9, 1e9, -1e9, -1e9], [1e9, 1e9, -1e9, -1e9], [1e9, 1e9, -1e9, -1e9]];
  for (let i = 0; i < parts; i++) {
    const u = i / (parts - 1);
    const bx = x + (u - 0.5) * w * 0.8 + (r() - 0.5) * 14;
    const by = base - h * (0.3 + 0.45 * Math.sin(Math.PI * u)) + (r() - 0.5) * 12;
    const size = w * between(r, 0.2, 0.3);
    const k = Math.min(2, Math.floor(u * 3));
    groups[k] += path(blob(bx, by, size, size * 0.85, r, { jag: 0.16, bumps: 0.1 }), { fill: `url(#${i % 3 === 0 ? 'gLeafB' : 'gMyrtle'})` }) +
      path(blob(bx - size * 0.25, by - size * 0.3, size * 0.4, size * 0.25, r, { points: 9 }), { fill: '#a3b68a', opacity: 0.25 });
    const gb = groupBoxes[k];
    gb[0] = Math.min(gb[0], bx - size * 1.3); gb[1] = Math.min(gb[1], by - size * 1.2);
    gb[2] = Math.max(gb[2], bx + size * 1.3); gb[3] = Math.max(gb[3], by + size * 1.2);
  }
  groups.forEach((markup, k) => {
    if (!markup) return;
    const [x0, y0, x1, y1] = groupBoxes[k];
    st.sprite(box(x0, y0, x1, y1), markup, { id: rig.sway({ x, amp: [0.5, 1.4], period: [6, 10], gust: 1.5 }), origin: [x, base] });
  });
  let leaves = '';
  for (let i = 0; i < 10; i++) {
    const u = r();
    const lx = x + (u - 0.5) * w;
    const ly = base - h * (0.2 + 0.55 * Math.sin(Math.PI * u)) + between(r, -10, 10);
    leaves += leafD(lx, ly, (u - 0.5) * 140 + between(r, -20, 20), between(r, 10, 14), between(r, 4, 5.5));
  }
  st.art(path(leaves, { fill: 'url(#gLeaf)' }), box(x - w, base - h * 1.2, x + w, base + 5));
  // roses on top and sides, each blooming and nodding
  for (let i = 0; i < 9; i++) {
    const u = between(r, 0.08, 0.92);
    const rx = x + (u - 0.5) * w * 0.85;
    const ry = base - h * (0.35 + 0.5 * Math.sin(Math.PI * u)) + between(r, -6, 14);
    const size = between(r, 6, 9.5);
    const id = rig.swayBloom({ x, amp: [1.5, 3], period: [4.5, 8], gust: 3, start: bloomStart(r, x), dur: between(r, 2.4, 3.6) });
    const rb = around(rx, ry, size * 1.4);
    st.sprite(rb, g({ transform: `rotate(${n(r() * 90)} ${n(rx)} ${n(ry)})` }, roseHead(r, rx, ry, size, pick(r, ROSE_FILLS))), { id, origin: [rx, ry + 3] });
  }
  st.close();
}
type Box4 = [number, number, number, number];

/** Static millefleur speckles (tiny far flowers), merged per colour. */
export function speckles(r: Rng, count: number, y0: number, y1: number, x0 = -20, x1 = 1620): string {
  const colors = ['#fbf4e6', '#f4ead8', '#e6b7b0', '#d9a5a0', '#e8c76a', '#b9c3dc', '#c9b6d9', '#f0d1c8'];
  const buckets = new Map<string, Array<[number, number, number]>>();
  for (let i = 0; i < count; i++) {
    const y = between(r, y0, y1);
    const depth = (y - 560) / 440; // 0 far … 1 near
    const x = between(r, x0, x1);
    const rad = 0.9 + depth * 2.4 * between(r, 0.6, 1.1);
    const c = pick(r, colors);
    const key = `${c}|${depth > 0.55 ? 1 : 0}`;
    const list = buckets.get(key) ?? [];
    list.push([x, y, rad]);
    if (r() < 0.35) list.push([x + rad * 1.6, y + rad * 0.4, rad * 0.75]);
    buckets.set(key, list);
  }
  let s = '';
  for (const [key, list] of buckets) {
    const [c, near] = key.split('|');
    s += path(circlesD(list), { fill: c, opacity: near === '1' ? 0.9 : 0.7 });
  }
  return s;
}

/** Helper for smooth ground/hill silhouettes. */
export function ridge(fn: (x: number) => number, bottom = 1010, x0 = -60, x1 = 1660, step = 40): string {
  const pts: Pt[] = [];
  for (let x = x0; x <= x1; x += step) pts.push([x, fn(x)]);
  return smooth(pts) + `L${x1} ${bottom}L${x0} ${bottom}Z`;
}
