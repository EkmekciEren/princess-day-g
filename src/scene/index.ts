/* Assembles the layered painting and returns its animators.
 * Each depth layer is a div (moved by parallax) holding a 1600×1000 "stage"
 * in scene units, scaled to cover the screen like `preserveAspectRatio slice`
 * anchored at the bottom (the meadow is always visible). */
import { MOTION, PAINTING } from '../config';
import { mulberry32 } from '../lib/random';
import { Stage } from '../lib/stage';
import { Rig, type Animator } from '../motion/rig';
import { defsMarkup } from './defs';
import { buildFar, buildFront, buildMid, buildSky } from './layers';
import { buildPrincess } from './princess';

export interface SceneLayer {
  el: HTMLElement;
  /** 0 = infinitely far … 1 = closest; scales parallax and scroll shift. */
  depth: number;
}

export interface Scene {
  layers: SceneLayer[];
  animators: Animator[];
  /** Top-level parts with a scene x, for hiding what is off-screen. */
  cullables: Array<{ el: HTMLElement; x: number }>;
}

export const SCENE_W = 1600;
export const SCENE_H = 1000;

export function buildScene(host: HTMLElement): Scene {
  const seed = MOTION.seed;
  const layout = (k: number) => mulberry32(seed + k * 7919);
  const rigFor = (k: number, prefix: string) => new Rig(mulberry32(seed * 3 + k * 104729), prefix);

  const painting = __HAS_PAINTING__;
  const rigs: Rig[] = [];
  const parts: Array<{ name: string; depth: number; html: string }> = [];
  const add = (name: string, depth: number, k: number, build: (st: Stage, rig: Rig) => void) => {
    const st = new Stage();
    const rig = rigFor(k, name[0]);
    rigs.push(rig);
    build(st, rig);
    parts.push({ name, depth, html: st.html() });
  };

  if (!painting) {
    add('sky', 0.05, 1, (st, rig) => buildSky(st, rig, layout(1)));
    add('far', 0.18, 2, (st) => buildFar(st, layout(2)));
  }
  const figures = !painting || PAINTING.keepGardenFigures;
  if (!painting || figures) {
    add('mid', 0.42, 3, (st, rig) => buildMid(st, rig, layout(3), { ground: !painting, trees: !painting, figures }));
  }
  if (!painting || PAINTING.keepPrincess) add('princess', 0.68, 4, (st, rig) => buildPrincess(st, rig, layout(4)));
  if (!painting || PAINTING.keepFrontFlowers) add('front', 1, 5, (st, rig) => buildFront(st, rig, layout(5)));

  host.innerHTML =
    `<svg class="scene-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>${defsMarkup()}</defs></svg>` +
    (painting ? `<div class="layer layer--painting" style="background-image:url('${import.meta.env.BASE_URL}${PAINTING.file}')"></div>` : '') +
    parts.map((p) => `<div class="layer layer--${p.name}"><div class="stage">${p.html}</div></div>`).join('');

  const layers: SceneLayer[] = [];
  if (painting) layers.push({ el: host.querySelector<HTMLElement>('.layer--painting')!, depth: 0.1 });
  for (const p of parts) layers.push({ el: host.querySelector<HTMLElement>(`.layer--${p.name}`)!, depth: p.depth });

  const cullables = [...host.querySelectorAll<HTMLElement>('[data-x]')].map((el) => ({ el, x: Number(el.dataset.x) }));
  const animators = rigs.flatMap((r) => r.bind());
  return { layers, animators, cullables };
}

/** Fit the stage into a layer box of w×h CSS px ("slice", bottom-anchored). */
export function fitStage(boxW: number, boxH: number): { s: number; ox: number; oy: number } {
  const s = Math.max(boxW / SCENE_W, boxH / SCENE_H);
  return { s, ox: (boxW - SCENE_W * s) / 2, oy: boxH - SCENE_H * s };
}
