/* The painting's depth layers:
 *   sky → far hills & castle → mid garden (trees, maidens, roses) →
 *   princess → foreground flowery bank.
 * Coordinates: scene units 1600×1000, horizon ≈ y 560, princess at x 800.
 * Static scenery is one painted-once <svg>; every moving part is a sprite. */
import { blob, g, n, path, smooth, type Pt } from '../lib/svg';
import { between, pick, type Rng } from '../lib/random';
import { around, box, Stage } from '../lib/stage';
import type { Rig } from '../motion/rig';
import { flower, randomKind, ridge, roseBush, speckles, tree, tuft, type TreeOpts } from './flora';
import { figure } from './figures';

const TAU = Math.PI * 2;
const FULL = box(0, 0, 1600, 1000);

/** Sort independently-built items by depth (base y) and emit them in order. */
class DepthList {
  private items: Array<{ y: number; html: string }> = [];
  add(y: number, build: (st: Stage) => void): void {
    const st = new Stage();
    build(st);
    this.items.push({ y, html: st.html() });
  }
  emit(st: Stage): void {
    this.items.sort((a, b) => a.y - b.y).forEach((i) => st.raw(i.html));
  }
}

/* =================================================================== SKY */
export function buildSky(st: Stage, rig: Rig, r: Rng): void {
  st.art(
    `<rect width="1600" height="1000" fill="url(#gSky)"/>` +
    `<ellipse cx="800" cy="485" rx="780" ry="430" fill="url(#gSun)"/>` +
    `<ellipse cx="800" cy="430" rx="260" ry="235" fill="url(#gSun)" opacity=".85"/>`,
    FULL,
  );
  const clouds: Array<[number, number, number]> = [
    [190, 150, 1.1], [520, 92, 0.9], [1020, 118, 1.2], [1360, 182, 1], [770, 262, 0.62], [1510, 72, 0.8], [60, 270, 0.8], [1180, 300, 0.55],
  ];
  for (const [x, y, k] of clouds) {
    let c = '';
    for (let i = 0; i < 5; i++) {
      c += `<ellipse cx="${n(x + (i - 2) * 30 * k + (r() - 0.5) * 12)}" cy="${n(y + (r() - 0.5) * 16 * k)}" rx="${n(between(r, 42, 74) * k)}" ry="${n(between(r, 13, 22) * k)}" fill="url(#${r() < 0.35 ? 'gCloudPink' : 'gCloud'})"/>`;
    }
    const id = rig.id();
    const A = between(r, 18, 40), w = TAU / between(r, 60, 110), p = r() * TAU;
    rig.anim([id], x, ([el], t) => {
      (el as HTMLElement).style.transform = `translate(${n(A * Math.sin(t * w + p))}px,${n(A * 0.15 * Math.sin(t * w * 1.7 + p))}px)`;
    });
    st.sprite(around(x, y, 150 * k, 50 * k), c, { id, cullX: x });
  }
  // far-off birds gliding across the sky, flapping now and then
  for (let i = 0; i < 3; i++) {
    const id = rig.id(), wingId = rig.id();
    const y0 = between(r, 170, 300), speed = between(r, 14, 19), off = between(r, 0, 1800);
    const fw = TAU * between(r, 1.6, 2.1), fp = r() * TAU, size = between(r, 4.5, 6.5);
    rig.anim([id, wingId], 800, ([el, wing], t) => {
      const x = -120 + ((t * speed + off + i * 30) % 1850);
      const y = 8 * Math.sin(t * 0.3 + i);
      const f = 0.35 + 0.75 * Math.sin(t * fw + fp) * (0.55 + 0.45 * Math.sin(t * 0.45 + fp));
      (el as HTMLElement).style.transform = `translate(${n(x)}px,${n(y)}px)`;
      wing.setAttribute('d', `M${n(-size)} ${n(y0)}Q${n(-size / 2)} ${n(y0 - size * f)} 0 ${n(y0)}Q${n(size / 2)} ${n(y0 - size * f)} ${n(size)} ${n(y0)}`);
    });
    const b = box(-10, y0 - 10, 10, y0 + 6);
    st.open(b, { id }).art(path(`M${-size} ${n(y0)}L${size} ${n(y0)}`, { id: wingId, fill: 'none', stroke: '#7d6a5c', 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: 0.55 }), b).close();
  }
}

/* =================================================================== FAR */
export function buildFar(st: Stage, r: Rng): void {
  const yA = (x: number) => 478 + 16 * Math.sin(x * 0.004 + 1) + 9 * Math.sin(x * 0.011 + 2);
  const yB = (x: number) => 522 + 14 * Math.sin(x * 0.005 + 3) + 7 * Math.sin(x * 0.013);
  const yC = (x: number) => 556 + 10 * Math.sin(x * 0.006 + 0.5) + 6 * Math.sin(x * 0.017 + 1);
  let s = path(ridge(yA), { fill: 'url(#gHillA)' });
  const treeLine = (fy: (x: number) => number, color: string, scale: number, count: number, avoidCastle = false) => {
    let d = '';
    for (let i = 0; i < count; i++) {
      const x = between(r, -20, 1620);
      if (avoidCastle && Math.abs(x - 700) < 50) continue;
      const y = fy(x) + 3;
      if (r() < 0.42) {
        const h = between(r, 26, 50) * scale, w = h * 0.16;
        d += `M${n(x)} ${n(y)}C${n(x - w)} ${n(y - h * 0.3)} ${n(x - w * 0.7)} ${n(y - h * 0.8)} ${n(x)} ${n(y - h)}C${n(x + w * 0.7)} ${n(y - h * 0.8)} ${n(x + w)} ${n(y - h * 0.3)} ${n(x)} ${n(y)}Z`;
      } else {
        const rad = between(r, 8, 15) * scale;
        d += blob(x, y - rad * 1.1, rad, rad * 0.85, r, { points: 10 });
      }
    }
    return path(d, { fill: color });
  };
  s += treeLine(yA, '#a3b19b', 0.7, 26);
  s += path(ridge(yB), { fill: 'url(#gHillB)' });
  // a small castle on the hill (the princess's home), soft in the haze
  const cx = 700, cy = yB(700) + 2;
  s += g({ opacity: 0.92 },
    `<rect x="${cx - 38}" y="${n(cy - 15)}" width="76" height="17" fill="#e4d4bc"/>` +
    `<rect x="${cx - 15}" y="${n(cy - 36)}" width="30" height="36" fill="#efe2cc"/>` +
    `<rect x="${cx - 25}" y="${n(cy - 50)}" width="10" height="50" fill="#ebdcc4"/>` +
    `<rect x="${cx + 13}" y="${n(cy - 44)}" width="9" height="44" fill="#e7d7bf"/>` +
    path(`M${cx - 27.5} ${n(cy - 50)}L${cx - 20} ${n(cy - 67)}L${cx - 12.5} ${n(cy - 50)}ZM${cx + 11} ${n(cy - 44)}L${cx + 17.5} ${n(cy - 59)}L${cx + 24} ${n(cy - 44)}Z`, { fill: '#c08f88' }) +
    path(`M${cx - 20} ${n(cy - 67)}l0 -8l7 2.6l-7 2.4`, { fill: '#9c4a58', stroke: '#8a6f62', 'stroke-width': 0.6 }) +
    [-11, -4, 3, 10].map((dx) => `<rect x="${cx + dx}" y="${n(cy - 40)}" width="4" height="4" fill="#efe2cc"/>`).join('') +
    `<rect x="${cx - 2}" y="${n(cy - 26)}" width="4" height="7" rx="2" fill="#9c8577"/>` +
    `<rect x="${cx - 22}" y="${n(cy - 40)}" width="3" height="5" rx="1.5" fill="#9c8577"/>`,
  );
  s += treeLine(yB, '#8ea083', 0.85, 30, true);
  s += path(ridge(yC), { fill: 'url(#gHillC)' });
  s += treeLine(yC, '#7c9171', 1, 22);
  s += `<rect x="0" y="430" width="1600" height="200" fill="url(#gHaze)"/>`;
  st.art(g({ filter: 'url(#fFar)' }, s), FULL);
}

/* =================================================================== MID */
export function buildMid(st: Stage, rig: Rig, r: Rng, o: { ground: boolean; trees: boolean; figures: boolean }): void {
  if (o.ground) {
    const yM = (x: number) => 566 + 5 * Math.sin(x * 0.006) + 3 * Math.sin(x * 0.019 + 1);
    let ground = path(ridge(yM), { fill: 'url(#gMeadow)' });
    for (let i = 0; i < 14; i++) {
      const y = between(r, 600, 880), x = between(r, 0, 1600), w = between(r, 90, 220) * (0.6 + (y - 560) / 400);
      ground += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(w)}" ry="${n(w * 0.16)}" fill="url(#${i % 3 ? 'gPatchLight' : 'gPatchDark'})"/>`;
    }
    // the garden path the strolling maiden follows
    const topEdge: Pt[] = [], botEdge: Pt[] = [];
    for (let x = -60; x <= 1660; x += 80) {
      const y = 624 + 6 * Math.sin(x * 0.004) + 3 * Math.sin(x * 0.013);
      const w = 7 + 4 * Math.sin(x * 0.002 + 1);
      topEdge.push([x, y - w]);
      botEdge.push([x, y + w * 0.8]);
    }
    ground += path(smooth(topEdge) + 'L' + smooth(botEdge.reverse()).slice(1) + 'Z', { fill: 'url(#gPath)' });
    ground += speckles(r, 300, 596, 905);
    st.art(ground, FULL);
  }

  const list = new DepthList();
  if (o.trees) {
    const trees: TreeOpts[] = [
      { x: 140, base: 690, h: 480, lean: 8, crown: 132, fruit: 'orange', tint: 'B' },
      { x: 375, base: 652, h: 400, lean: -6, crown: 112, fruit: 'blossom', tint: 'A' },
      { x: 520, base: 726, h: 590, lean: 14, crown: 124, fruit: 'orange', tint: 'C' },
      { x: 1080, base: 726, h: 590, lean: -14, crown: 124, fruit: 'orange', tint: 'C' },
      { x: 1262, base: 668, h: 440, lean: -6, crown: 122, fruit: 'orange', tint: 'B', hang: [1238, 532] },
      { x: 1470, base: 700, h: 500, lean: 10, crown: 136, fruit: 'blossom', tint: 'A' },
    ];
    for (const t of trees) list.add(t.base, (s) => tree(s, rig, r, t));
    list.add(790, (s) => roseBush(s, rig, r, 612, 790, 130, 170));
    list.add(796, (s) => roseBush(s, rig, r, 1012, 796, 122, 150));
    // meadow flowers between the trees and the foreground bank
    for (let i = 0; i < 40; i++) {
      const y = between(r, 690, 900);
      const x = between(r, -10, 1610);
      const depth = (y - 690) / 210;
      if (Math.abs(x - 800) < 130 + depth * 90) continue; // hidden behind the gown anyway
      const h = between(r, 26, 52) * (0.6 + depth * 0.5);
      const size = between(r, 5, 8) * (0.6 + depth * 0.5);
      const kind = randomKind(r);
      list.add(y, (s) => flower(s, rig, r, { x, y, h, kind, size, cull: true }));
    }
  }
  if (o.figures) {
    list.add(624, (s) => figure(s, rig, r, { x: 1700, y: 624, h: 62, facing: -1, dress: 'gDressBlue', hair: '#6b4a32', pose: 'walk' }));
    list.add(668, (s) => figure(s, rig, r, { x: 300, y: 668, h: 118, facing: 1, dress: 'gDressCream', hair: '#c08a52', pose: 'danceL', sheer: true, wreath: true }));
    list.add(668.2, (s) => figure(s, rig, r, { x: 332, y: 668, h: 120, facing: -1, dress: 'gDressRose', hair: '#8a5a3a', pose: 'danceM', sheer: true }));
    list.add(668.1, (s) => figure(s, rig, r, { x: 364, y: 668, h: 117, facing: -1, dress: 'gDressCream', hair: '#d1a167', pose: 'danceR', sheer: true, wreath: true }));
    list.add(674, (s) => figure(s, rig, r, { x: 1206, y: 674, h: 128, facing: 1, dress: 'gDressSage', hair: '#a0663a', pose: 'pickOrange', basket: true }));
    list.add(702, (s) => figure(s, rig, r, { x: 664, y: 702, h: 122, facing: -1, dress: 'gDressGold', hair: '#7a4a2c', pose: 'reachRose', wreath: true }));
    list.add(716, (s) => figure(s, rig, r, { x: 946, y: 716, h: 124, facing: 1, dress: 'gDressRose', hair: '#5e3b26', pose: 'kneel', basket: true }));
  }
  list.emit(st);
}

/* ================================================================= FRONT */
export const bankY = (x: number): number =>
  878 + 62 * Math.exp(-(((x - 800) / 200) ** 2)) + 8 * Math.sin(x * 0.013 + 1) + 5 * Math.sin(x * 0.031);

export function buildFront(st: Stage, rig: Rig, r: Rng): void {
  let bank = path(ridge(bankY, 1010, -60, 1660, 30), { fill: 'url(#gBank)' });
  for (let i = 0; i < 10; i++) {
    const x = between(r, 0, 1600), y = bankY(x) + between(r, 20, 90);
    bank += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(between(r, 60, 150))}" ry="${n(between(r, 8, 16))}" fill="url(#gPatchDark)"/>`;
  }
  bank += speckles(r, 90, 905, 1000);
  st.art(bank, box(0, 780, 1600, 1000));

  const list = new DepthList();
  for (let i = 0; i < 46; i++) {
    const x = between(r, -10, 1610);
    const y = bankY(x) + between(r, 2, 14);
    const near = Math.abs(x - 800) < 170;
    const h = between(r, 24, 44) * (near ? 0.6 : 1);
    const blades = 5 + Math.floor(r() * 3);
    list.add(y, (s) => tuft(s, rig, r, x, y, h, blades, 'light'));
  }
  for (let i = 0; i < 56; i++) {
    const x = between(r, -10, 1610);
    const y = bankY(x) + between(r, 8, 80);
    const near = Math.abs(x - 800) < 175;
    const nearness = Math.min(1, (y - 870) / 120);
    const h = near ? between(r, 14, 30) : between(r, 38, 100) * (0.75 + nearness * 0.4);
    const kind = randomKind(r);
    const size = between(r, 7.5, 12) * (0.8 + nearness * 0.35);
    list.add(y, (s) => flower(s, rig, r, { x, y, h, kind, size, cull: true }));
  }
  for (let i = 0; i < 26; i++) {
    const x = between(r, -10, 1610);
    const near = Math.abs(x - 800) < 160;
    const y = between(r, 975, 1004);
    const h = between(r, 46, 74) * (near ? 0.55 : 1);
    const blades = 6 + Math.floor(r() * 3);
    list.add(y, (s) => tuft(s, rig, r, x, y, h, blades, 'dark'));
  }
  // broad leaves framing the lower corners of a phone screen
  for (const [x, flip] of [[575, 1], [612, 1], [992, -1], [1030, -1]] as const) {
    const y = 1004;
    let leaves = '', ribs = '';
    for (let k = 0; k < 3; k++) {
      const a = flip * (12 + k * 16) + between(r, -6, 6);
      const len = between(r, 70, 110);
      leaves += g({ transform: `rotate(${n(a)} ${x} ${y})` }, path(`M${x} ${y}C${n(x + len * 0.3)} ${n(y - len * 0.2)} ${n(x + len * 0.25)} ${n(y - len * 0.85)} ${x} ${n(y - len)}C${n(x - len * 0.28)} ${n(y - len * 0.8)} ${n(x - len * 0.3)} ${n(y - len * 0.25)} ${x} ${y}Z`, { fill: `url(#${pick(r, ['gLeaf', 'gBlade2'] as const)})` }));
      ribs += g({ transform: `rotate(${n(a)} ${x} ${y})` }, path(`M${x} ${y}Q${n(x + len * 0.04)} ${n(y - len * 0.5)} ${x} ${n(y - len * 0.95)}`, { fill: 'none', stroke: '#3b4d30', 'stroke-width': 1, opacity: 0.5 }));
    }
    const id = rig.sway({ x, amp: [1, 2.2], period: [6, 9], gust: 3 });
    list.add(1003, (s) => s.sprite(around(x, y - 60, 110, 70), leaves + ribs, { id, origin: [x, y], cullX: x }));
  }
  list.emit(st);
}
