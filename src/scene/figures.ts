/* Garden maidens: small, faceless, elegant silhouettes in period dress.
 * Each figure is drawn in a 100-unit tall local frame (feet at 0,0, facing
 * +x) and every joint is its own sprite: body (feet), skirt & torso (waist),
 * head (neck), arms (shoulder) and forearms (elbow). */
import { g, limb, n, path, place } from '../lib/svg';
import { between, type Rng } from '../lib/random';
import { box, type Box, type Stage } from '../lib/stage';
import { keyframes, rotDeg, type Rig } from '../motion/rig';
import type { WindLike } from '../motion/wind';

export type Pose = 'stand' | 'reachRose' | 'pickOrange' | 'kneel' | 'danceL' | 'danceM' | 'danceR' | 'walk';

export interface FigureOpts {
  x: number;
  y: number;          // feet
  h: number;          // standing height in scene units
  facing: 1 | -1;
  dress: string;      // gradient id
  hair: string;       // colour
  pose: Pose;
  sheer?: boolean;
  /** A flower basket on the ground beside her. */
  basket?: boolean;
  wreath?: boolean;
}

const SKIN = '#efd3c1';
const SHOULDER_F = [1.6, -77.5] as const;
const SHOULDER_B = [-1.8, -77.5] as const;
const ELBOW_DROP = 14;
const NECK = [0.4, -84.5] as const;
const WAIST = -63;
const KNEEL_DROP = 28;
const TAU = Math.PI * 2;

function arm(st: Stage, id: string, foreId: string, sx: number, sy: number, dress: string): void {
  const ex = sx, ey = sy + ELBOW_DROP;
  const upper: Box = box(sx - 4, sy - 3.5, sx + 4, ey + 3);
  st.open(upper, { id, origin: [sx, sy] }).art(path(limb(sx, sy, ex, ey + 1, 5, 3.6), { fill: `url(#${dress})` }), upper);
  const fore: Box = box(ex - 3, ey - 2.5, ex + 3, ey + 17);
  st.sprite(fore,
    path(limb(ex, ey, ex, ey + 12.5, 3.2, 2.4), { fill: `url(#${dress})` }) +
    path(limb(ex, ey + 10.5, ex, ey + 12.6, 3, 2.8), { fill: '#f7eee0', opacity: 0.85 }) +
    `<ellipse cx="${n(ex + 0.2)}" cy="${n(ey + 14.2)}" rx="1.35" ry="1.8" fill="${SKIN}"/>`,
    { id: foreId, origin: [ex, ey] });
  st.close();
}

const basketShape = (x: number, y: number, s = 1): string =>
  g({ transform: place(x, y, 0, s) },
    path('M-6.4 0L6.4 0L8 -6.5L-8 -6.5Z', { fill: 'url(#gBasket)' }) +
    path('M-6.6 -6.4Q0 -17 6.6 -6.4', { fill: 'none', stroke: '#7d5a32', 'stroke-width': 1.2 }) +
    '<circle cx="-4" cy="-7.4" r="2.2" fill="#e6b7b0"/><circle cx="0.5" cy="-8" r="2.4" fill="#fbf4e6"/><circle cx="4.4" cy="-7.2" r="2" fill="#e2b64d"/>' +
    path('M-7 -3.2L7 -3.2', { stroke: '#6a4a28', 'stroke-width': 0.6, opacity: 0.6 }));

export function figure(st: Stage, rig: Rig, r: Rng, o: FigureOpts): void {
  const s = o.h / 100;
  const kneel = o.pose === 'kneel';
  const walker = o.pose === 'walk';
  const ids = {
    root: rig.id(), body: rig.id(), skirt: rig.id(), torso: rig.id(), head: rig.id(),
    armF: rig.id(), foreF: rig.id(), armB: rig.id(), foreB: rig.id(),
  };
  const op = o.sheer ? 0.9 : 1;
  const waistY = kneel ? WAIST + KNEEL_DROP : WAIST;

  st.frame(o.x, o.y, s * o.facing, s, { id: ids.root, layer: walker, cullX: walker ? undefined : o.x });
  st.art(
    `<ellipse cx="0" cy="0.5" rx="${kneel ? 24 : 18}" ry="2.6" fill="url(#gShadow)"/>` + (o.basket ? basketShape(kneel ? -24 : 16, 0, 1.1) : ''),
    box(-34, -16, 34, 4),
  );
  st.open(box(-30, -104, 30, 6), { id: ids.body, origin: [0, 0] });

  /* --- skirt --- */
  const skirtArt = kneel
    ? path('M-4.6 -35C-9 -26 -19 -12 -23 -1Q-4 3 21 -0.6C17 -11 10 -24 4.6 -35Z', { fill: `url(#${o.dress})`, opacity: op }) +
      path('M0 -30C-3 -20 -8 -9 -12 0', { fill: 'none', stroke: '#000', 'stroke-opacity': 0.12, 'stroke-width': 1.6 })
    : path('M-4.6 -63C-7.6 -45 -12.6 -21 -17.6 -1Q-14.5 1.8 -6 1.4Q4 2.2 13.5 0.2C10.6 -20 7.8 -45 4.6 -63Z', { fill: `url(#${o.dress})`, opacity: op }) +
      path('M-1 -58C-3 -40 -6 -20 -8.5 0', { fill: 'none', stroke: '#000', 'stroke-opacity': 0.12, 'stroke-width': 1.8 }) +
      path('M2.6 -56C4 -38 6 -18 7.4 0', { fill: 'none', stroke: '#fff', 'stroke-opacity': 0.22, 'stroke-width': 1.6 });
  st.sprite(kneel ? box(-25, -37, 23, 4) : box(-20, -65, 16, 4), skirtArt, { id: ids.skirt, origin: [0, waistY] });

  /* --- upper body --- */
  if (kneel) st.frame(0, KNEEL_DROP, 1, 1);
  st.open(box(-10, -100, 10, -60), { id: ids.torso, origin: [0, WAIST] });
  arm(st, ids.armB, ids.foreB, SHOULDER_B[0], SHOULDER_B[1], o.dress);
  st.art(
    path('M-1.6 -79.5L-1.2 -85.6L2.2 -85.6L2.4 -79.5Z', { fill: SKIN }) +
    path('M-4.6 -63C-5.2 -68 -5.6 -73.5 -5.2 -78.6Q-1 -81 3.4 -79.6C5.4 -77.5 6.8 -73.5 6.2 -70.5C5.8 -67.6 5 -65 4.6 -63Z', { fill: `url(#${o.dress})` }) +
    path('M-4.9 -64.4L5 -64.4L4.7 -62.6L-4.7 -62.6Z', { fill: 'url(#gGold)' }),
    box(-8, -88, 8, -60),
  );
  const wreath = o.wreath
    ? '<circle cx="-2.6" cy="-96" r="1.3" fill="#fbf4e6"/><circle cx="0.4" cy="-97" r="1.3" fill="#e6b7b0"/><circle cx="3.2" cy="-96.2" r="1.2" fill="#fbf4e6"/>'
    : '';
  st.sprite(box(-10, -100, 8, -64),
    path('M0.4 -95.9C3.6 -95.9 5.5 -93.6 5.4 -90.9L6.4 -89.2L5.4 -88.4C5.3 -86.4 3.9 -84.8 1.4 -84.8C-2.5 -84.8 -3.7 -87.7 -3.7 -90.4C-3.7 -93.6 -2.2 -95.9 0.4 -95.9Z', { fill: SKIN }) +
    path(
      'M4.6 -93.4C3.8 -96.9 -1.4 -97.6 -3.9 -95.1C-6.1 -92.9 -5.5 -88.6 -6.3 -84.5C-7.1 -79.6 -8.7 -73.8 -8.4 -66.8L-6 -68.5' +
      'C-5.4 -74 -3.6 -79.5 -3 -84.8C-1.4 -86.6 0.3 -89 0.9 -92C2.2 -92.6 3.6 -92.6 4.6 -93.4Z',
      { fill: o.hair },
    ) + wreath,
    { id: ids.head, origin: [NECK[0], NECK[1]] });
  arm(st, ids.armF, ids.foreF, SHOULDER_F[0], SHOULDER_F[1], o.dress);
  st.close(); // torso
  if (kneel) st.close();
  st.close(); // body
  st.close(); // frame

  /* --- motion --- */
  const order = [ids.root, ids.body, ids.skirt, ids.torso, ids.head, ids.armF, ids.foreF, ids.armB, ids.foreB];
  const driver = poseDriver(r, o);
  const rootScale = `scale(${s * o.facing},${s})`;
  rig.anim(order, walker ? 800 : o.x, (els, t, w) => {
    const v = driver(t, w);
    const e = els as HTMLElement[];
    if (v.rootX !== undefined) e[0].style.transform = `translate(${n(v.rootX - o.x)}px,0) ${rootScale}`;
    e[1].style.transform = `translate(0,${n(v.bob)}px) ${rotDeg(v.body)}`;
    e[2].style.transform = rotDeg(v.skirt);
    e[3].style.transform = rotDeg(v.torso);
    e[4].style.transform = rotDeg(v.head);
    e[5].style.transform = rotDeg(v.armF);
    e[6].style.transform = rotDeg(v.foreF);
    e[7].style.transform = rotDeg(v.armB);
    e[8].style.transform = rotDeg(v.foreB);
  });
}

interface PoseValues {
  rootX?: number; bob: number; body: number; skirt: number; torso: number; head: number;
  armF: number; foreF: number; armB: number; foreB: number;
}

/** Returns a function computing every joint angle for time t. */
function poseDriver(r: Rng, o: FigureOpts): (t: number, w: WindLike) => PoseValues {
  const ph = () => r() * TAU;
  const w = (a: number, b: number) => TAU / between(r, a, b);
  // idle "life" common to everyone: never in sync thanks to the seeded params
  const wb = w(6, 9), pb = ph(), ws = w(4, 6.5), ps = ph(), wh = w(8, 12), phh = ph(), wa = w(5, 8), pa = ph();
  const gx = o.facing; // gust pushes skirts downwind; flip for figures facing left
  const v: PoseValues = { bob: 0, body: 0, skirt: 0, torso: 0, head: 0, armF: 6, foreF: -12, armB: 5, foreB: -10 };
  const idle = (t: number, wind: WindLike) => {
    const gust = wind.gust(o.x);
    v.body = 0.7 * Math.sin(t * wb + pb);
    v.skirt = 1.6 * Math.sin(t * ws + ps) + 3 * gust * gx;
    v.head = 1.8 * Math.sin(t * wh + phh);
    v.torso = 0.6 * Math.sin(t * wb * 0.7 + pa);
    v.armF = 6 + 2 * Math.sin(t * wa + pa);
    v.foreF = -12 + 3 * Math.sin(t * wa * 0.8 + pb);
    v.armB = 5 + 1.6 * Math.sin(t * wa * 0.9 + ps);
    v.foreB = -10;
    v.bob = 0;
  };

  switch (o.pose) {
    case 'reachRose': {
      // reach to a rose, pick it, bring it to her face to smell it, rest
      const kf = keyframes([
        [0, [0, 0, 6, -12]],
        [2.4, [7, 4, -68, -8]],
        [3.6, [8, 6, -72, -4]],
        [5.6, [2, 10, -40, -105]],
        [7.2, [2, 12, -36, -110]],
        [9.4, [0, 0, 8, -14]],
      ], between(r, 11.5, 13));
      const off = r() * 12;
      return (t, wind) => {
        idle(t, wind);
        const k = kf(t + off);
        v.torso += k[0]; v.head += k[1]; v.armF = k[2] + 1.5 * Math.sin(t * wa + pa); v.foreF = k[3];
        return v;
      };
    }
    case 'pickOrange': {
      const kf = keyframes([
        [0, [0, 0, 8, -12]],
        [2.6, [-5, -14, -135, -18]],
        [4, [-6, -16, -142, -10]],
        [6.4, [3, 6, -30, -60]],
        [7.6, [4, 8, -25, -62]],
        [9.4, [0, 0, 8, -12]],
      ], between(r, 10.5, 12));
      const off = r() * 11;
      return (t, wind) => {
        idle(t, wind);
        const k = kf(t + off);
        v.torso += k[0]; v.head += k[1]; v.armF = k[2]; v.foreF = k[3];
        v.armB = 4; v.foreB = -38;
        return v;
      };
    }
    case 'kneel': {
      // gathering flowers, then looking up and turning towards the light
      const kf = keyframes([
        [0, [8, 0, -20, -20]],
        [2.5, [30, 8, -38, -14]],
        [4.5, [33, 10, -42, -10]],
        [6.6, [10, -8, -32, -72]],
        [8.2, [8, -12, -30, -74]],
      ], between(r, 10, 11.5));
      const off = r() * 10;
      return (t, wind) => {
        idle(t, wind);
        const k = kf(t + off);
        v.torso = k[0] + 0.6 * Math.sin(t * wb + pb); v.head += k[1]; v.armF = k[2]; v.foreF = k[3];
        v.armB = -14; v.foreB = -30; v.body = 0;
        return v;
      };
    }
    case 'danceL':
    case 'danceM':
    case 'danceR': {
      // the three graces: hands joined above their heads, swaying together
      const wd = TAU / 7.2;
      const pd = o.pose === 'danceL' ? 0 : o.pose === 'danceM' ? 0.5 : 1;
      const raisedF = -152, raisedB = o.pose === 'danceM' ? 156 : 14;
      return (t, wind) => {
        const gust = wind.gust(o.x);
        const sx = Math.sin(t * wd + pd);
        v.body = 1.3 * sx;
        v.bob = -1.1 * (0.5 + 0.5 * Math.sin(t * wd * 2 + pd));
        v.skirt = 2.6 * Math.sin(t * wd * 1.3 + pd + 1) + 3 * gust * gx;
        v.torso = Math.sin(t * wd + pd + 0.6);
        v.head = 3 * Math.sin(t * wd * 0.7 + pd);
        v.armF = raisedF - 3 * sx; v.foreF = -10 + 3 * Math.sin(t * wd + pd + 1);
        v.armB = raisedB + (o.pose === 'danceM' ? 3 * sx : 2 * Math.sin(t * wa + pa)); v.foreB = o.pose === 'danceM' ? 8 : -12;
        return v;
      };
    }
    case 'walk': {
      const step = between(r, 0.9, 1.1);
      const speed = between(r, 16, 20); // units per second → crosses in ~90 s
      const span = 1900;
      const start = o.x;
      return (t, wind) => {
        const gust = wind.gust(o.x);
        const u = (t * Math.PI) / step;
        let x = start - ((t * speed) % span);
        if (x < -150) x += span;
        v.rootX = x;
        v.bob = -0.9 * Math.abs(Math.sin(u));
        v.body = 2 + 0.4 * Math.sin(u * 2);
        v.skirt = 3.4 * Math.sin(u) + 3 * gust * gx;
        v.torso = 0;
        v.head = 1.4 * Math.sin(t * wh + phh);
        v.armF = 10 * Math.sin(u); v.foreF = -14;
        v.armB = -10 * Math.sin(u); v.foreB = -14;
        return v;
      };
    }
    default:
      return (t, wind) => {
        idle(t, wind);
        return v;
      };
  }
}
