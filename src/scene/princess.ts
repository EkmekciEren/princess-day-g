/* The princess: a Botticelli-like figure in a dusty-rose gown, long wavy
 * strawberry-blonde hair, a small gold crown and a rose in her hand.
 * Drawn in "design" coordinates (x relative to her centre line, feet at
 * y = 965) inside a frame that places and scales her in the scene. */
import { blob, circlesD, g, n, path, smooth, strandPath, type Pt, type Strand } from '../lib/svg';
import { between, lerp, type Rng } from '../lib/random';
import { around, box, type Stage } from '../lib/stage';
import { rotDeg, type Rig } from '../motion/rig';

export const PRINCESS = { x: 800, feet: 918, scale: 0.95 } as const;
export const PRINCESS_FRAME_ID = 'princessFrame';
const FEET = 965;
const WAIST_Y = 582;
const NECK_BASE: Pt = [0, 506];
const SPLIT_Y = 898; // the gown above this line is painted once; the hem below waves
const TAU = Math.PI * 2;

/** Place/scale the princess (feet at scene y = feet). */
export function placePrincess(el: HTMLElement, scale: number, feet: number): void {
  el.style.left = `${PRINCESS.x}px`;
  el.style.top = `${(feet - FEET * scale).toFixed(2)}px`;
  el.style.transform = `scale(${scale.toFixed(4)})`;
}

/* ------------------------------------------------------------ helpers */
type Cubic = readonly [Pt, Pt, Pt, Pt];
const cubicAt = (c: Cubic, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * c[0][0] + 3 * u * u * t * c[1][0] + 3 * u * t * t * c[2][0] + t * t * t * c[3][0],
    u * u * u * c[0][1] + 3 * u * u * t * c[1][1] + 3 * u * t * t * c[2][1] + t * t * t * c[3][1],
  ];
};
const sample = (c: Cubic, steps = 40): Pt[] => Array.from({ length: steps + 1 }, (_, i) => cubicAt(c, i / steps));

/** A strand whose path is recomputed every frame. */
function strand(rig: Rig, s: Strand, fill: string, extra: Record<string, string | number> = {}): string {
  const id = rig.path(PRINCESS.x, (t, w) => strandPath(s, t, w.gust(PRINCESS.x), w.breeze));
  return path(strandPath(s, 0, 0, 1), { id, fill: `url(#${fill})`, ...extra });
}

/** A lock of wavy hair: wide at the root, a soft rounded end (not a thin wisp). */
const lock = (r: Rng, x: number, y: number, angle: number, len: number, w0: number, curl: number, gust: number, kink = 12): Strand => ({
  x, y, angle, len, w0, w1: Math.max(2.2, w0 * 0.38), seg: 12, curl, taper0: 0.25,
  amp: between(r, 3.5, 6.5), period: between(r, 4.8, 7.5), k: between(r, 1.8, 2.8), phase: r() * TAU, gust,
  kink, kinkFreq: between(r, 1.2, 1.7), kinkPhase: r() * TAU,
});

export function buildPrincess(st: Stage, rig: Rig, r: Rng): void {
  const X = PRINCESS.x;
  const S = PRINCESS.scale;

  st.frame(X, PRINCESS.feet - FEET * S, S, S, { id: PRINCESS_FRAME_ID });
  st.art(`<ellipse cx="14" cy="950" rx="205" ry="20" fill="url(#gShadow)"/>`, box(-230, 920, 250, 980));
  // a very slow weight shift of the whole figure
  st.open(box(-260, 380, 280, 1000), { id: rig.sway({ x: X, amp: [0.2, 0.3], period: [10, 13], gust: 0.3 }), origin: [0, FEET] });

  /* ---------------------------------------------------- hair (back) */
  const hairBackId = rig.id();
  const hbBox = box(-100, 400, 150, 760);
  st.open(hbBox, { id: hairBackId, origin: NECK_BASE });
  st.art(
    path(
      'M0 410C-30 408 -44 428 -44 456C-44 480 -52 500 -58 528C-64 556 -56 580 -64 606C-70 630 -60 652 -50 672' +
      'C-40 650 -38 628 -32 606C-26 584 -30 566 -24 548L24 548C32 570 30 590 40 612C50 636 64 656 92 676' +
      'C86 650 80 628 74 604C68 580 70 560 62 532C56 504 46 480 44 456C44 428 30 408 0 410Z',
      { fill: 'url(#gHair)' },
    ) +
    path('M-30 470C-38 520 -46 580 -44 640M34 476C42 530 52 590 72 650', { fill: 'none', stroke: '#6f3a20', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.18 }) +
    path('M-36 456C-42 500 -48 540 -50 600M38 460C46 504 54 548 62 610M-22 470C-26 520 -28 560 -34 610', { fill: 'none', stroke: 'url(#gHairLight)', 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0.55 }),
    hbBox,
  );
  // flowing locks — repainted every frame, so they live on their own layer
  st.open(hbBox, { cls: 'hair-strands' });
  st.art(
    g({ class: 'wind-fx', filter: 'url(#fWind)' },
      strand(rig, lock(r, -38, 468, 99, 190, 20, -10, 14), 'gHair') +
      strand(rig, lock(r, -42, 500, 96, 165, 18, 8, 14, 11), 'gHair') +
      strand(rig, lock(r, -30, 522, 92, 140, 14, 4, 12), 'gHair') +
      strand(rig, lock(r, 40, 466, 76, 225, 21, 14, 24), 'gHair') +
      strand(rig, lock(r, 48, 498, 70, 205, 18, 18, 28, 11), 'gHair') +
      strand(rig, lock(r, 40, 526, 80, 170, 15, 10, 24), 'gHair') +
      strand(rig, lock(r, 30, 544, 86, 130, 12, 6, 20, 12), 'gHair') +
      strand(rig, { ...lock(r, 44, 474, 74, 210, 3.4, 16, 26), w1: 0.6 }, 'gHairLight') +
      strand(rig, { ...lock(r, -36, 478, 98, 175, 3.2, -8, 14), w1: 0.6 }, 'gHairLight') +
      strand(rig, { ...lock(r, 36, 520, 80, 160, 2.6, 10, 22), w1: 0.5 }, 'gHairLight')),
    hbBox,
  );
  st.close().close();

  /* ----------------------------------------------------------- gown */
  const leftSide: Cubic = [[-34, WAIST_Y], [-50, 650], [-98, 800], [-150, 935]];
  const rightSide: Cubic = [[34, WAIST_Y], [62, 664], [128, 822], [176, 944]];
  const L = sample(leftSide), R = sample(rightSide);
  const above = (pts: Pt[], y: number) => pts.filter((p) => p[1] <= y);
  const crossing = (pts: Pt[], y: number): Pt => {
    for (let i = 1; i < pts.length; i++) {
      if (pts[i][1] >= y) {
        const k = (y - pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1]);
        return [lerp(pts[i - 1][0], pts[i][0], k), y];
      }
    }
    return pts[pts.length - 1];
  };
  // upper gown: painted once
  const upperD = smooth([...above(L, SPLIT_Y), crossing(L, SPLIT_Y), crossing(R, SPLIT_Y), ...above(R, SPLIT_Y).reverse()], true);

  // lower gown (the hem strip): re-shaped every frame by wind and walk-less sway
  const top = SPLIT_Y - 10;
  const lowerL = L.filter((p) => p[1] >= top), lowerR = R.filter((p) => p[1] >= top);
  const hemPhase = r() * TAU;
  const hemGeometry = (t: number, gust: number, breeze: number) => {
    const s = Math.sin;
    const dL: Pt = [4 * s(t * 0.6 + 1) - gust * 4, 2 * s(t * 0.8)];
    const dR: Pt = [6 * s(t * 0.45) + gust * 18, -gust * 6];
    const bendSide = (pts: Pt[], d: Pt): Pt[] => pts.map(([x, y]) => {
      const k = Math.max(0, (y - SPLIT_Y) / (pts[pts.length - 1][1] - SPLIT_Y));
      const w = k * k;
      return [x + d[0] * w, y + d[1] * w];
    });
    const left = bendSide(lowerL, dL), right = bendSide(lowerR, dR);
    const Lh = left[left.length - 1], Rh = right[right.length - 1];
    const hem: Pt[] = [];
    const N = 12;
    for (let i = 1; i < N; i++) {
      const u = i / N;
      const wave = (4.5 + 4 * Math.max(0, gust)) * (0.6 + 0.4 * breeze) * s(t * 1.25 - u * 7.5 + hemPhase);
      hem.push([lerp(Lh[0], Rh[0], u) + gust * 6 * u, lerp(Lh[1], Rh[1], u) + wave + 3.5 * s(u * Math.PI * 6)]);
    }
    return { left, right, hem };
  };
  const stripD = (t: number, gust: number, breeze: number) => {
    const { left, right, hem } = hemGeometry(t, gust, breeze);
    return smooth([...left, ...hem, ...right.reverse()], true);
  };
  const hemLine = (t: number, gust: number, breeze: number, dy: number) => {
    const { left, right, hem } = hemGeometry(t, gust, breeze);
    const pts = [left[left.length - 1], ...hem, right[right.length - 1]].map(([x, y]): Pt => [x, y + dy]);
    return smooth(pts);
  };

  // decoration shared by both parts (identical where they overlap → no seam)
  let folds = '';
  for (let i = -3; i <= 3; i++) {
    const xt = i * 9, xb = i * 46 + 14, wb = 14 + Math.abs(i) * 2;
    folds += path(
      `M${n(xt - 2)} 592C${n(xt - 4 + i * 4)} 700 ${n(xb - wb - i * 6)} 840 ${n(xb - wb)} 990L${n(xb + wb)} 990C${n(xb + wb - i * 6)} 840 ${n(xt + 4 + i * 4)} 700 ${n(xt + 2)} 592Z`,
      { fill: `url(#${i % 2 === 0 ? 'gGownFold' : 'gGownSheen'})` },
    );
  }
  const panel =
    path('M-9 584C-22 700 -42 820 -66 990L72 990C52 830 26 700 9 584Z', { fill: 'url(#gUnderskirt)' }) +
    path('M-9 584C-22 700 -42 820 -66 990M9 584C26 700 52 830 72 990', { fill: 'none', stroke: 'url(#gGoldV)', 'stroke-width': 3 }) +
    path('M0 600C-2 700 -4 820 0 990', { fill: 'none', stroke: '#e6d0a8', 'stroke-width': 1.4, opacity: 0.6 });
  const flowerDots: Array<[number, number, number]> = [];
  const flowerCentres: Array<[number, number, number]> = [];
  let sprigs = '';
  for (let k = 0; k < 34; k++) {
    const y = between(r, 600, 930);
    const u = (y - 582) / 360;
    const half = 34 + u * 150;
    const panelHalf = 9 + u * 64;
    let x = between(r, -half, half + u * 20);
    if (Math.abs(x - u * 3) < panelHalf + 6) x = Math.sign(x || 1) * (panelHalf + 8 + r() * 20);
    const sz = 2.4 + u * 2.2;
    if (r() < 0.6) {
      for (let i = 0; i < 5; i++) {
        const a = (i * TAU) / 5 - Math.PI / 2;
        flowerDots.push([x + Math.cos(a) * sz * 0.6, y + Math.sin(a) * sz * 0.6, sz * 0.48]);
      }
      flowerCentres.push([x, y, sz * 0.28]);
    } else {
      const a = r() * TAU;
      sprigs += `M${n(x)} ${n(y)}l${n(Math.cos(a) * sz * 2)} ${n(Math.sin(a) * sz * 2)}`;
    }
  }
  const motifs =
    path(circlesPath(flowerDots), { fill: '#fbf2e6', opacity: 0.85 }) +
    path(circlesPath(flowerCentres), { fill: '#d7ad4e' }) +
    path(sprigs, { fill: 'none', stroke: '#93a77c', 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0.8 });
  const gownDecor = panel + motifs + folds;

  const upperClip = rig.id();
  const gownBox = box(-170, 575, 210, 900);
  st.art(
    `<clipPath id="${upperClip}"><path d="${upperD}"/></clipPath>` +
    path(upperD, { fill: 'url(#gGown)' }) + g({ 'clip-path': `url(#${upperClip})` }, gownDecor),
    gownBox,
  );
  // the hem strip, on its own layer because it changes every frame
  const stripId = rig.id(), stripClip = rig.id(), trimId = rig.id(), bandId = rig.id();
  rig.anim([stripId, trimId, bandId], X, (els, t, w) => {
    const gust = w.gust(X);
    els[0].setAttribute('d', stripD(t, gust, w.breeze));
    els[1].setAttribute('d', hemLine(t, gust, w.breeze, -3));
    els[2].setAttribute('d', hemLine(t, gust, w.breeze, -13));
  }, true);
  const stripBox = box(-200, top - 4, 240, 1000);
  st.open(stripBox, { cls: 'gown-hem' });
  st.art(
    `<clipPath id="${stripClip}"><use href="#${stripId}"/></clipPath>` +
    path(stripD(0, 0, 1), { id: stripId, fill: 'url(#gGown)' }) +
    g({ 'clip-path': `url(#${stripClip})` }, gownDecor) +
    path(hemLine(0, 0, 1, -13), { id: bandId, fill: 'none', stroke: '#f6e6cf', 'stroke-width': 1.3, opacity: 0.75, 'stroke-dasharray': '1 4', 'stroke-linecap': 'round' }) +
    path(hemLine(0, 0, 1, -3), { id: trimId, fill: 'none', stroke: 'url(#gGoldV)', 'stroke-width': 3.4, 'stroke-linecap': 'round' }),
    stripBox,
  );
  st.close();

  /* ------------------------------------------------------ upper body */
  const breathId = rig.id();
  const breathW = TAU / between(r, 4.4, 5);
  rig.anim([breathId], X, ([el], t) => {
    (el as HTMLElement).style.transform = `scaleY(${(1 + 0.0095 * Math.sin(t * breathW)).toFixed(4)})`;
  });
  st.open(box(-130, 395, 150, 720), { id: breathId, origin: [0, WAIST_Y] });

  let bodice =
    path('M-40 515Q-22 503 0 505Q22 503 40 515L33 522Q0 552 -33 522Z', { fill: 'url(#gSkinBody)' }) +
    path('M-33 522Q0 552 33 522L42 530C44 548 39 566 34 584L-34 584C-39 566 -44 548 -42 530Z', { fill: 'url(#gBodice)' }) +
    path('M-42 530C-44 548 -39 566 -34 584L-26 584C-30 566 -33 548 -31 532Z', { fill: '#8d4f53', opacity: 0.16 }) +
    path('M42 530C44 548 39 566 34 584L28 584C31 566 34 548 33 533Z', { fill: '#8d4f53', opacity: 0.1 }) +
    path('M-33 522Q0 552 33 522', { fill: 'none', stroke: 'url(#gGold)', 'stroke-width': 2.8 });
  const pearls: Array<[number, number, number]> = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    pearls.push([lerp(-30, 30, u), 522 + 30 * 2 * u * (1 - u) * 0.98 + 2.4, 1.15]);
  }
  bodice +=
    path(circlesPath(pearls), { fill: '#fbf4e6' }) +
    path('M-36 575Q0 584 36 575L36 586Q0 595 -36 586Z', { fill: 'url(#gGold)' }) +
    `<circle cx="0" cy="585" r="4" fill="url(#gGold)"/><circle cx="0" cy="585" r="2.6" fill="#7a2636"/><circle cx="-0.8" cy="584" r=".8" fill="#e9a0a8"/>` +
    // neck, the shadow under the chin, a fine gold chain with a pearl
    path('M-10 478C-10 492 -11 502 -13 512L13 512C11 502 10 492 10 478Z', { fill: 'url(#gSkinBody)' }) +
    `<ellipse cx="0" cy="485" rx="12" ry="6" fill="url(#gNeckShade)"/>` +
    path('M-12 507Q0 524 12 507', { fill: 'none', stroke: '#d9b45c', 'stroke-width': 1 }) +
    `<circle cx="0" cy="522.5" r="2.4" fill="#fbf4e6"/><circle cx="-0.6" cy="521.8" r=".7" fill="#fff"/>`;
  st.art(bodice, box(-50, 470, 50, 600));

  // her right arm (viewer's left) hanging softly, with a long hanging sleeve
  const sleeve = (m: 1 | -1) =>
    path(`M${-44 * m} 506C${-60 * m} 504 ${-70 * m} 526 ${-68 * m} 552C${-66 * m} 578 ${-58 * m} 594 ${-49 * m} 594C${-42 * m} 594 ${-39 * m} 580 ${-39 * m} 562C${-39 * m} 542 ${-37 * m} 522 ${-35 * m} 512Z`, { fill: 'url(#gSleeve)' }) +
    path(`M${-60 * m} 520C${-63 * m} 540 ${-62 * m} 565 ${-56 * m} 586M${-50 * m} 512C${-52 * m} 535 ${-51 * m} 565 ${-47 * m} 590`, { fill: 'none', stroke: '#d9a5a0', 'stroke-width': 2.2, opacity: 0.75, 'stroke-linecap': 'round' }) +
    path(`M${-64 * m} 584Q${-54 * m} 594 ${-41 * m} 588`, { fill: 'none', stroke: 'url(#gGold)', 'stroke-width': 2.4, 'stroke-linecap': 'round' }) +
    path(`M${-47 * m} 508Q${-56 * m} 512 ${-60 * m} 530`, { fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: 0.5, 'stroke-linecap': 'round' });

  const armLBox = box(-120, 495, -30, 800);
  st.open(armLBox, { id: rig.sway({ x: X, amp: [0.5, 0.9], period: [7, 10], gust: 0.8 }), origin: [-40, 516] });
  st.open(armLBox, { cls: 'drape' }).art(g({ class: 'wind-fx', filter: 'url(#fWind)' },
    strand(rig, { x: -60, y: 588, angle: 98, len: 165, w0: 15, w1: 22, seg: 10, curl: -6, amp: 4, period: 6.5, k: 2, phase: 0.8, gust: 16, bulge: 0.12 }, 'gDrape')), armLBox).close();
  const foreL = box(-82, 584, -54, 698);
  st.sprite(foreL,
    path('M-62 586L-49 590L-60 668L-72 664Z', { fill: 'url(#gBodice)' }) +
    path('M-72 662L-59 666L-60 671L-73 667Z', { fill: 'url(#gGold)' }) +
    path('M-73 666C-77 676 -74 689 -68 693C-63 691 -60 681 -60 670Z', { fill: 'url(#gSkinBody)' }),
    { id: rig.sway({ x: X, amp: [0.6, 1.2], period: [6, 9], gust: 0.6 }), origin: [-56, 590] });
  st.art(sleeve(1), box(-74, 500, -32, 600));
  st.close();

  // sash bow on her left hip, two silk tails fluttering downwind
  const sashBox = box(10, 570, 190, 790);
  st.open(sashBox, { cls: 'sash' }).art(
    g({ class: 'wind-fx', filter: 'url(#fWind)' },
      strand(rig, { x: 32, y: 588, angle: 70, len: 175, w0: 7.5, w1: 5, seg: 12, curl: 20, amp: 9, period: 4.8, k: 2.5, phase: 0.3, gust: 32 }, 'gSash') +
      strand(rig, { x: 28, y: 590, angle: 86, len: 140, w0: 6.5, w1: 4.6, seg: 12, curl: 10, amp: 10, period: 4.2, k: 2.9, phase: 1.9, gust: 28 }, 'gSash', { opacity: 0.92 })) +
    path(blob(36, 584, 9, 6, r, { points: 10, jag: 0.15 }), { fill: 'url(#gSash)' }) +
    path(blob(24, 586, 8, 5.5, r, { points: 10, jag: 0.15 }), { fill: 'url(#gSash)' }) +
    `<circle cx="30" cy="586" r="3.4" fill="#c9a24b"/>`,
    sashBox,
  ).close();

  // her left arm (viewer's right) folded at the waist, holding a rose
  const armRBox = box(-20, 495, 220, 800);
  st.open(armRBox, { id: rig.sway({ x: X, amp: [0.4, 0.8], period: [8, 11], gust: 0.5 }), origin: [40, 516] });
  st.open(armRBox, { cls: 'drape' }).art(g({ class: 'wind-fx', filter: 'url(#fWind)' },
    strand(rig, { x: 60, y: 588, angle: 74, len: 172, w0: 15, w1: 22, seg: 10, curl: 12, amp: 5, period: 6, k: 2.2, phase: 2.4, gust: 24, bulge: 0.12 }, 'gDrape')), armRBox).close();
  st.art(
    path('M48 584L62 590L22 612L14 600Z', { fill: 'url(#gBodice)' }) +
    path('M20 598L25 611L19 614L14 601Z', { fill: 'url(#gGold)' }) +
    path('M4 600Q-2 624 -10 650', { fill: 'none', stroke: '#5c7149', 'stroke-width': 1.8, 'stroke-linecap': 'round' }) +
    g({ transform: 'translate(-6 628) rotate(-130)' }, path('M0 0C4 -3 5 -9 0 -13C-5 -9 -4 -3 0 0Z', { fill: 'url(#gLeaf)' })),
    box(-20, 580, 70, 660),
  );
  st.sprite(around(3, 594, 13),
    `<circle cx="3" cy="594" r="8.5" fill="url(#gRoseDeep)"/>` +
    path('M-4 594C-4 586 9 585 10 593', { fill: 'none', stroke: '#c7727e', 'stroke-width': 1.4, opacity: 0.8 }) +
    path('M-1 596C0 590 7 590 7 595', { fill: 'none', stroke: '#e0a0a6', 'stroke-width': 1.1, opacity: 0.7 }) +
    path('M-5 597C-2 603 7 603 10 596', { fill: 'none', stroke: '#521a26', 'stroke-width': 1, opacity: 0.5 }),
    { id: rig.sway({ x: X, amp: [1, 2], period: [5, 7], gust: 1.5 }), origin: [4, 602] });
  st.art(
    `<ellipse cx="10" cy="606" rx="6.5" ry="5.2" fill="url(#gSkinBody)"/>` +
    path('M5 603Q9 600 14 603', { fill: 'none', stroke: '#d6a891', 'stroke-width': 0.8 }) + sleeve(-1),
    box(0, 500, 76, 616),
  );
  st.close();

  /* ------------------------------------------------------------ head */
  const headId = rig.id();
  const headBox = box(-75, 392, 85, 640);
  st.open(headBox, { id: headId, origin: NECK_BASE });

  const eyeWhite = (m: 1 | -1) => `M${14.8 * m} 448.4Q${9.6 * m} 442.8 ${4.2 * m} 447.6Q${9.4 * m} 452.2 ${14.8 * m} 448.4Z`;
  const iris = (m: 1 | -1) => {
    const ix = m * 9.2 - 0.6;
    return `<circle cx="${n(ix)}" cy="448" r="2.8" fill="url(#gIris)"/><circle cx="${n(ix)}" cy="448" r="1.25" fill="#24140f"/>` +
      `<circle cx="${n(ix + 0.9)}" cy="446.9" r=".75" fill="#fff"/>`;
  };
  const eyeClip = rig.id();
  st.art(
    path('M0 421C15.5 421 25.5 433 25.5 449C25.5 466 16 480.5 0 484C-16 480.5 -25.5 466 -25.5 449C-25.5 433 -15.5 421 0 421Z', { fill: 'url(#gSkin)' }) +
    `<ellipse cx="-13" cy="461" rx="7" ry="4.6" fill="url(#gBlush)"/><ellipse cx="13" cy="461" rx="7" ry="4.6" fill="url(#gBlush)"/>` +
    `<clipPath id="${eyeClip}"><path d="${eyeWhite(1)}${eyeWhite(-1)}"/></clipPath>` +
    path(eyeWhite(1) + eyeWhite(-1), { fill: '#f8f1ea' }) +
    g({ 'clip-path': `url(#${eyeClip})` }, iris(-1) + iris(1)) +
    path('M-14.2 445Q-9.6 441.2 -5 444.2M14.2 445Q9.6 441.2 5 444.2', { fill: 'none', stroke: '#cf9e8a', 'stroke-width': 0.6, opacity: 0.55 }) +
    path('M-13.6 449.9Q-9.4 451.9 -5.2 449.1M13.6 449.9Q9.4 451.9 5.2 449.1', { fill: 'none', stroke: '#c99583', 'stroke-width': 0.6, opacity: 0.5 }) +
    path('M-16.5 440.2Q-10 435.8 -4.2 438.8M16.5 440.2Q10 435.8 4.2 438.8', { fill: 'none', stroke: '#8a5534', 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: 0.72 }) +
    path('M-1.1 450C-1.7 456 -2.6 459.6 -1.4 462Q0.4 463.4 2.5 462', { fill: 'none', stroke: '#c58f7c', 'stroke-width': 0.9, 'stroke-linecap': 'round', opacity: 0.55 }) +
    path('M-6.2 470.3Q-3 468 -0.2 469.3Q0 469.1 0.2 469.3Q3 468 6.2 470.3Q3 471.8 0 471.6Q-3 471.8 -6.2 470.3Z', { fill: '#c56f6a' }) +
    path('M-5 470.9Q0 476.4 5 470.9Q0 472.5 -5 470.9Z', { fill: '#d68a83' }) +
    `<ellipse cx="-1.2" cy="472.9" rx="1.7" ry=".6" fill="#f2c2b8" opacity=".6"/>`,
    box(-28, 418, 28, 488),
  );

  // blinking: skin-coloured lids close from the top; the lash line follows
  const lidsId = rig.id(), lashId = rig.id();
  const lidBox = box(-17, 442, 17, 454);
  st.sprite(lidBox, path(eyeWhite(1) + eyeWhite(-1), { fill: '#f1d3c1' }), { id: lidsId, origin: [0, 442.6] });
  st.sprite(box(-18, 439, 18, 452),
    path('M-15.6 448Q-9.7 442.4 -3.9 447.3M15.6 448Q9.7 442.4 3.9 447.3', { fill: 'none', stroke: '#3f2219', 'stroke-width': 1.35, 'stroke-linecap': 'round' }) +
    path('M-15.6 448L-17.3 446.4M15.6 448L17.3 446.4', { fill: 'none', stroke: '#3f2219', 'stroke-width': 0.9, 'stroke-linecap': 'round' }),
    { id: lashId });
  let nextBlink = between(r, 2, 4), blinkStart = -10, double = false;
  rig.anim([lidsId, lashId], X, (els, t) => {
    if (t >= nextBlink) {
      blinkStart = t;
      double = r() < 0.18;
      nextBlink = t + between(r, 2.8, 6.5);
    }
    let u = t - blinkStart;
    if (double && u > 0.32) u -= 0.32;
    const c = u < 0.08 ? u / 0.08 : u < 0.13 ? 1 : u < 0.25 ? 1 - (u - 0.13) / 0.12 : 0;
    (els[0] as HTMLElement).style.transform = `scaleY(${Math.max(0.001, c).toFixed(3)})`;
    (els[1] as HTMLElement).style.transform = `translateY(${(c * 3.6).toFixed(2)}px)`;
  });

  // hair framing the face, flowers and the crown
  const crownY = (x: number) => 419 + 6 * (x / 19) ** 2;
  let crown = path('M-19 425Q0 413 19 425L19 429.4Q0 417.4 -19 429.4Z', { fill: 'url(#gGold)' });
  const crownPearls: Array<[number, number, number]> = [];
  [7, 10, 14, 10, 7].forEach((h, i) => {
    const x = (i - 2) * 8.6, y = crownY(x);
    crown += path(`M${n(x - 3.4)} ${n(y + 0.6)}Q${n(x - 1.2)} ${n(y - h * 0.55)} ${n(x)} ${n(y - h)}Q${n(x + 1.2)} ${n(y - h * 0.55)} ${n(x + 3.4)} ${n(y + 0.6)}Z`, { fill: 'url(#gGold)' });
    crownPearls.push([x, y - h - 1.3, 1.6]);
  });
  crown +=
    path(circlesPath(crownPearls), { fill: '#fbf4e6' }) +
    `<ellipse cx="0" cy="416.6" rx="2.4" ry="3.2" fill="#7a2232"/><ellipse cx="-0.7" cy="415.6" rx=".7" ry="1" fill="#e9a0a8"/>` +
    `<circle cx="-10" cy="422.6" r="1.1" fill="#c26d7a"/><circle cx="10" cy="422.6" r="1.1" fill="#c26d7a"/>`;
  let daisy = '';
  for (let i = 0; i < 8; i++) daisy += `<ellipse cx="0" cy="-3.2" rx="1.5" ry="2.8" transform="rotate(${i * 45})" fill="#fbf4e6"/>`;
  st.art(
    path('M-25 442C-27 424 -14 411 0 411C14 411 27 424 26 442C21 428 11 422 1 422L0 424.5L-1 422C-10 422 -20 428 -25 442Z', { fill: 'url(#gHair)' }) +
    path('M0 418C-16 416 -30 426 -32 444C-34 458 -29 470 -33 486C-37 500 -45 510 -44 528C-43 540 -48 552 -54 560L-44 558C-38 548 -36 538 -36 526C-36 510 -28 498 -27 482C-26 464 -24 442 -12 428C-8 424 -4 422 0 422Z', { fill: 'url(#gHair)' }) +
    path('M0 418C16 416 30 426 32 444C34 458 30 470 35 486C40 500 48 510 50 528C52 540 58 550 66 558L54 558C46 548 42 538 41 526C40 510 31 498 29 482C27 464 24 442 12 428C8 424 4 422 0 422Z', { fill: 'url(#gHair)' }) +
    path('M-4 417C-16 419 -25 431 -27 448C-28 462 -26 478 -30 492M5 417C17 419 26 431 28 449C29 464 28 478 33 492', { fill: 'none', stroke: 'url(#gHairLight)', 'stroke-width': 1.7, 'stroke-linecap': 'round', opacity: 0.7 }) +
    g({ transform: 'translate(24 434)' }, daisy + '<circle r="1.6" fill="#e2b64d"/>') +
    `<circle cx="18" cy="425" r="3.6" fill="url(#gRose)"/><circle cx="30" cy="444.5" r="2.6" fill="url(#gRose)"/>` +
    path('M30 428q5 -2 7 2q-4 2 -7 -2Z', { fill: 'url(#gLeaf)' }) +
    crown,
    box(-60, 398, 72, 566),
  );
  // two locks over her shoulder, moving on their own layer
  const frontBox = box(-75, 470, 85, 640);
  st.open(frontBox, { cls: 'hair-front' }).art(
    g({ class: 'wind-fx', filter: 'url(#fWind)' },
      strand(rig, lock(r, 31, 486, 84, 128, 12, -14, 14, 12), 'gHair') +
      strand(rig, lock(r, 37, 494, 80, 108, 9, -6, 16, 13), 'gHair') +
      strand(rig, lock(r, -30, 488, 97, 104, 10, 14, 10, 12), 'gHair') +
      strand(rig, { ...lock(r, 33, 490, 82, 112, 2.6, -12, 14, 12), w1: 0.5 }, 'gHairLight')),
    frontBox,
  ).close();

  // a glint on the crown now and then
  const glintId = rig.id();
  st.sprite(around(0, 401, 9),
    path('M0 394L1.1 399.9L7 401L1.1 402.1L0 408L-1.1 402.1L-7 401L-1.1 399.9Z', { fill: '#fffbe8' }) + '<circle cx="0" cy="401" r="1.6" fill="#fff"/>',
    { id: glintId, origin: [0, 401] });
  let nextGlint = between(r, 3, 5), glintAt = -10;
  rig.anim([glintId], X, ([el], t) => {
    if (t >= nextGlint) { glintAt = t; nextGlint = t + between(r, 5, 9); }
    const u = (t - glintAt) / 0.9;
    const s = u >= 0 && u <= 1 ? Math.sin(Math.PI * u) : 0;
    (el as HTMLElement).style.transform = `rotate(${(u * 45).toFixed(1)}deg) scale(${Math.max(0.001, s * 1.15).toFixed(3)})`;
  });
  st.close(); // head

  // head tilt (shared by the hair behind the shoulders)
  const tiltW = TAU / between(r, 9, 12), tiltP = r() * TAU;
  rig.anim([headId, hairBackId], X, (els, t, w) => {
    const a = -4 + 1.4 * Math.sin(t * tiltW + tiltP) + 0.5 * Math.sin(t * tiltW * 2.3 + 1) - 0.6 * w.gust(X);
    (els[0] as HTMLElement).style.transform = rotDeg(a);
    (els[1] as HTMLElement).style.transform = rotDeg(a * 0.85);
  });

  st.close(); // breath / upper body
  st.close(); // body sway
  st.close(); // frame
}

const circlesPath = circlesD;
