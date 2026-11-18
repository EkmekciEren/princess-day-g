/* The "rig": while the scene markup is generated, every moving part
 * registers how it moves (period, amplitude, gust response…). After the markup
 * is in the DOM, bind() turns those registrations into animators that the
 * engine ticks every frame. All randomness comes from a seeded PRNG, so each
 * part gets its own timing — never in sync — yet the result is reproducible.
 *
 * Rigid motion is applied as a CSS transform on the part's sprite (its pivot
 * is the sprite's transform-origin), so the browser only has to move an
 * already-painted GPU layer. */
import type { Rng } from '../lib/random';
import { easeInOutSine } from '../lib/random';
import type { WindLike } from './wind';

export interface Animator {
  /** Scene x (SVG units) – used for culling and for gust travel delay. */
  x: number;
  tick(t: number, w: WindLike): void;
  /** Re-shaped (repainted) parts update at half rate: slow motion looks the same, costs half. */
  half?: boolean;
}

const TAU = Math.PI * 2;
const f2 = (v: number): string => (Math.round(v * 100) / 100).toString();
const f3 = (v: number): string => (Math.round(v * 1000) / 1000).toString();

/** CSS rotation (degrees) about the element's transform-origin. */
export const rotDeg = (a: number): string => `rotate(${f2(a)}deg)`;

type Range = number | readonly [number, number];

export interface SwayOpts {
  x: number;
  /** Degrees. */
  amp?: Range;
  /** Seconds per cycle. */
  period?: Range;
  /** Lean (deg) at full gust. Negative for things that hang down. */
  gust?: number;
  /** Static base angle (deg). */
  lean?: number;
  /** Small quick secondary motion (leaf flutter), deg. */
  flutter?: number;
}

export interface BloomOpts {
  x: number;
  /** Seconds after the curtain starts lifting. */
  start: number;
  dur: number;
  closedScale?: number;
  closedRot?: number;
}

/** Sway parameters, resolved once from the seeded PRNG. */
export interface SwayParams { amp: number; w1: number; w2: number; p1: number; p2: number; gust: number; lean: number; fl: number; wf: number; pf: number }

/** Angle of a swaying part at time t (deg). */
export function swayAngle(s: SwayParams, x: number, t: number, w: WindLike): number {
  const g = w.gust(x);
  let a = s.lean + s.amp * w.breeze * (0.74 * Math.sin(t * s.w1 + s.p1) + 0.26 * Math.sin(t * s.w2 + s.p2)) + s.gust * g;
  if (s.fl) a += s.fl * (0.35 + 1.4 * Math.abs(g)) * Math.sin(t * s.wf + s.pf);
  return a;
}

/** Bloom state (scale, rotation) at time t. */
export function bloomState(start: number, dur: number, cs: number, cr: number, wb: number, pb: number, t: number): [number, number] {
  const p = (t - start) / dur;
  if (p < 1) {
    const e = easeInOutSine(p);
    // a little overshoot near the end makes the opening feel alive
    const over = p > 0.55 ? Math.sin(((p - 0.55) / 0.45) * Math.PI) * 0.06 : 0;
    return [cs + (1 - cs) * e + over, cr * (1 - e)];
  }
  return [1 + 0.018 * Math.sin(t * wb + pb), 0];
}

export class Rig {
  private seq = 0;
  private binders: Array<() => Animator | null> = [];

  constructor(readonly rng: Rng, private readonly prefix: string) {}

  /** Unique element id; the "_" keeps it from ever matching a page id like "fx". */
  id(): string {
    return `${this.prefix}_${(this.seq++).toString(36)}`;
  }

  r(range: Range): number {
    return typeof range === 'number' ? range : range[0] + (range[1] - range[0]) * this.rng();
  }

  swayParams(o: SwayOpts): SwayParams {
    const period = this.r(o.period ?? [5, 10]);
    const w1 = TAU / period;
    return {
      amp: this.r(o.amp ?? [1, 3]),
      w1,
      w2: w1 * (2.1 + this.rng() * 0.6), // detuned overtone → never a perfect loop
      p1: this.rng() * TAU,
      p2: this.rng() * TAU,
      gust: o.gust ?? 0,
      lean: o.lean ?? 0,
      fl: o.flutter ?? 0,
      wf: TAU / (0.9 + this.rng() * 0.9),
      pf: this.rng() * TAU,
    };
  }

  /** Rotate gently about the sprite's pivot, organically (two detuned sines + gusts). */
  sway(o: SwayOpts, id = this.id()): string {
    const s = this.swayParams(o);
    const x = o.x;
    this.anim([id], x, ([el], t, w) => {
      (el as HTMLElement).style.transform = rotDeg(swayAngle(s, x, t, w));
    });
    return id;
  }

  /** A flower head opening once (scale + unfurl), then softly "breathing". */
  bloom(o: BloomOpts, id = this.id()): string {
    const cs = o.closedScale ?? 0.18, cr = o.closedRot ?? -70;
    const wb = TAU / this.r([5, 9]), pb = this.rng() * TAU;
    this.anim([id], o.x, ([el], t) => {
      const [s, r] = bloomState(o.start, o.dur, cs, cr, wb, pb, t);
      (el as HTMLElement).style.transform = `rotate(${f2(r)}deg) scale(${f3(s)})`;
    });
    return id;
  }

  /** Sway and bloom on one sprite (roses on the bush). */
  swayBloom(o: SwayOpts & BloomOpts, id = this.id()): string {
    const s = this.swayParams(o);
    const cs = o.closedScale ?? 0.18, cr = o.closedRot ?? -70;
    const wb = TAU / this.r([5, 9]), pb = this.rng() * TAU;
    this.anim([id], o.x, ([el], t, w) => {
      const [sc, r] = bloomState(o.start, o.dur, cs, cr, wb, pb, t);
      (el as HTMLElement).style.transform = `rotate(${f2(swayAngle(s, o.x, t, w) + r)}deg) scale(${f3(sc)})`;
    });
    return id;
  }

  /** Re-generate a path's "d" (hems, hair, ribbons); repaints, so half rate. */
  path(x: number, fn: (t: number, w: WindLike) => string, id = this.id()): string {
    this.anim([id], x, ([el], t, w) => el.setAttribute('d', fn(t, w)), true);
    return id;
  }

  /** Fully custom animation driving several elements at once. */
  anim(ids: readonly string[], x: number, tick: (els: Element[], t: number, w: WindLike) => void, half = false): void {
    this.binders.push(() => {
      const els = ids.map((i) => document.getElementById(i));
      if (els.some((e) => !e)) return null;
      const list = els as Element[];
      return { x, half, tick: (t, w) => tick(list, t, w) };
    });
  }

  bind(): Animator[] {
    const out: Animator[] = [];
    for (const b of this.binders) {
      const a = b();
      if (a) out.push(a);
    }
    this.binders = [];
    return out;
  }
}

/** Keyframed pose cycles (for the garden figures). Values are eased between frames. */
export function keyframes(
  frames: ReadonlyArray<readonly [number, readonly number[]]>,
  period: number,
): (t: number) => number[] {
  const out = frames[0][1].map(() => 0);
  return (t: number) => {
    const u = ((t % period) + period) % period;
    let i = 0;
    while (i < frames.length - 1 && frames[i + 1][0] <= u) i++;
    const [t0, v0] = frames[i];
    const [t1, v1] = i + 1 < frames.length ? frames[i + 1] : [period, frames[0][1]];
    const e = easeInOutSine((u - t0) / Math.max(1e-6, t1 - t0));
    for (let k = 0; k < out.length; k++) out[k] = v0[k] + (v1[k] - v0[k]) * e;
    return out;
  };
}
