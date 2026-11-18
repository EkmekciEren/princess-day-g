/* Entry point: builds the living painting and wires up the page. */
import './style.css';
import { COLORS, MOTION } from './config';
import { mulberry32 } from './lib/random';
import { Engine } from './motion/engine';
import { Parallax } from './motion/parallax';
import { Wind } from './motion/wind';
import { Ambient } from './particles/ambient';
import { Burst } from './particles/burst';
import { buildScene, fitStage } from './scene';
import { placePrincess, PRINCESS, PRINCESS_FRAME_ID } from './scene/princess';
import { buildPoem, fillText, revealOnView, setupWish } from './ui/content';
import { buildFrame } from './ui/frame';
import { setupMusic } from './ui/music';
import { craquelureSvg, grainCss } from './ui/texture';
import { setupTilt } from './ui/tilt';

const $ = <T extends Element = HTMLElement>(sel: string): T => document.querySelector<T>(sel)!;
const wait = (ms: number) => new Promise<void>((res) => window.setTimeout(res, ms));
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- palette & static decoration ---- */
for (const [k, v] of Object.entries(COLORS)) root.style.setProperty(`--${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`, v);
root.classList.toggle('reduced-motion', reducedMotion);
fillText();
buildPoem($('#poemLines'));
buildFrame($('#frame'));
$('#overlay').style.setProperty('--grain', grainCss());
$('#overlay').innerHTML = craquelureSvg();

/* ---- the painting ---- */
const scene = buildScene($('#scene'));
const wind = new Wind(mulberry32(MOTION.seed + 99), reducedMotion);
const engine = new Engine(wind);
engine.add(scene.animators);
// "?fixq" keeps full quality (handy when profiling)
engine.adaptive = !new URLSearchParams(location.search).has('fixq');
const parallax = new Parallax(scene.layers);

/* Fit the 1600×1000 stage to the screen, hide off-screen parts, and place
 * the princess just below the title (so her crown never hides behind it). */
const OVERSCAN = 48; // px the layers extend beyond the viewport (see .layer)
let view: [number, number] = [0, 1600];
const measure = () => {
  const layerEl = scene.layers[scene.layers.length - 1].el;
  const { s, ox, oy } = fitStage(layerEl.offsetWidth, layerEl.offsetHeight);
  $('#scene').style.setProperty('--st', `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${s.toFixed(5)})`);
  const toSceneX = (px: number) => (px + OVERSCAN - ox) / s;
  const toSceneY = (py: number) => (py + OVERSCAN - oy) / s;
  view = [toSceneX(0), toSceneX(window.innerWidth)];
  engine.setVisibleRange(view[0] - 90, view[1] + 90);
  for (const c of scene.cullables) c.el.classList.toggle('off', c.x < view[0] - 160 || c.x > view[1] + 160);

  const frame = document.getElementById(PRINCESS_FRAME_ID);
  if (frame) {
    const titleBottom = $('.hero__title').getBoundingClientRect().bottom + window.scrollY;
    const crownTarget = toSceneY(titleBottom) + 12;
    const feet = PRINCESS.feet;
    const scale = Math.min(PRINCESS.scale, Math.max(0.6, (feet - crownTarget) / (965 - 402)));
    placePrincess(frame, scale, feet);
  }
};
measure();

const ambient = new Ambient($<HTMLCanvasElement>('#ambient'), mulberry32(MOTION.seed + 7), wind, (fx) => view[0] + fx * (view[1] - view[0]));
const burst = new Burst($<HTMLCanvasElement>('#fx'));

// global wind: the displacement noise drifts, and swells during gusts
const noise = document.getElementById('windNoise');
const disp = document.getElementById('windDisp');
const windFx = (t: number) => {
  if (!noise || !disp || engine.quality >= 1) return;
  noise.setAttribute('baseFrequency', `${(0.011 + 0.0025 * Math.sin(t * 0.13)).toFixed(4)} ${(0.026 + 0.005 * Math.sin(t * 0.17 + 1)).toFixed(4)}`);
  disp.setAttribute('scale', (4 + 6 * Math.max(0, wind.gust(PRINCESS.x))).toFixed(2));
};

engine.onFrame((t, dt) => {
  windFx(t);
  ambient.update(t, dt);
  parallax.update(dt);
});
engine.onQuality((q) => {
  root.dataset.quality = String(q);
  if (q >= 1) document.querySelectorAll('.wind-fx').forEach((el) => el.removeAttribute('filter'));
  ambient.setQuality(q);
});

/* ---- interaction ---- */
if (!reducedMotion) {
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') parallax.pointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => parallax.pointer(0, 0));
  setupTilt($<HTMLButtonElement>('#tilt'), (x, y) => parallax.tilt(x, y));
  window.addEventListener('scroll', () => parallax.setScroll(window.scrollY / Math.max(1, window.innerHeight)), { passive: true });
}
window.addEventListener('scroll', () => root.classList.toggle('is-scrolled', window.scrollY > 40), { passive: true });

let resizeTimer = 0;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    measure();
    ambient.resize();
    if (reducedMotion) ambient.draw(0);
  }, 150);
});

const music = setupMusic($<HTMLButtonElement>('#music'));
setupWish($<HTMLButtonElement>('#wishButton'), $('#wishCard'), (x, y) => {
  if (!reducedMotion) burst.fire(x, y);
});
revealOnView($('.poem__card'), 0.25);
revealOnView($('.wish'), 0.4);
revealOnView($('.footer'), 0.6);

/* ---- pause everything while the tab is hidden ---- */
let opened = false;
document.addEventListener('visibilitychange', () => {
  root.classList.toggle('is-paused', document.hidden);
  if (document.hidden) {
    engine.stop();
    music.suspend();
  } else {
    if (opened && !reducedMotion) engine.start();
    music.restore();
  }
});

/* ---- opening: the cream curtain rises and the painting comes alive ---- */
const nextPaint = () => new Promise<void>((res) => requestAnimationFrame(() => requestAnimationFrame(() => res())));
async function open(): Promise<void> {
  // Let every sprite get painted once at full size (crisp), then pose it.
  await nextPaint();
  if (reducedMotion) {
    engine.render(12, true); // fully bloomed, calm
    ambient.draw(0);
  } else {
    engine.render(0, true); // closed buds under the curtain
  }
  // keep the curtain a moment so "Prensesime" can be read, but never wait long for fonts
  await Promise.all([Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(2500)]), wait(reducedMotion ? 300 : 1600)]);
  measure(); // the title's final size (web fonts) decides where the princess stands
  await wait(reducedMotion ? 50 : 250);
  const curtain = $('#curtain');
  requestAnimationFrame(() => {
    opened = true;
    root.classList.add('is-open');
    if (!reducedMotion && !document.hidden) engine.start();
    window.setTimeout(() => $('#hero').classList.add('is-revealed'), reducedMotion ? 150 : 1300);
  });
  const remove = () => curtain.remove();
  curtain.addEventListener('transitionend', (e) => { if (e.target === curtain) remove(); });
  window.setTimeout(remove, 4200);
}
void open();
