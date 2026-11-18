/* Global wind: a slowly breathing breeze plus periodic gusts that travel
 * across the scene from left to right (so the meadow leans in a wave). */
import { between, type Rng } from '../lib/random';
import { MOTION } from '../config';

export interface WindLike {
  /** Scene clock in seconds. */
  t: number;
  /** Slowly varying breeze strength (~0.75–1.15). */
  breeze: number;
  /** Gust strength felt at scene x (SVG units) right now (≈ -0.3 … 1). */
  gust(x: number): number;
}

interface Gust { start: number; strength: number }

/** Gust envelope: smooth rise, then a damped settle (slight rebound). */
function profile(tau: number): number {
  if (tau <= 0 || tau > 10) return 0;
  const rise = 1.3;
  if (tau < rise) return 0.5 - 0.5 * Math.cos((Math.PI * tau) / rise);
  const s = tau - rise;
  return Math.exp(-s / 1.6) * Math.cos(1.25 * s);
}

export class Wind implements WindLike {
  t = 0;
  breeze = 1;
  /** SVG units per second that a gust front travels. */
  readonly speed = 720;
  private gusts: Gust[] = [];
  private next: number;

  /** @param calm  no gusts and a steady breeze (used for reduced motion). */
  constructor(private readonly rng: Rng, private readonly calm = false) {
    this.next = calm ? Infinity : MOTION.firstGust;
  }

  update(t: number): void {
    this.t = t;
    this.breeze = this.calm ? 1 : 0.9 + 0.14 * Math.sin(t * 0.27 + 1.1) + 0.08 * Math.sin(t * 0.61 + 0.3);
    while (t >= this.next) {
      this.gusts.push({ start: this.next, strength: between(this.rng, 0.6, 1) });
      this.next += between(this.rng, MOTION.gustEvery[0], MOTION.gustEvery[1]);
    }
    if (this.gusts.length && t - this.gusts[0].start > 14) this.gusts.shift();
  }

  gust(x: number): number {
    let g = 0;
    for (const G of this.gusts) g += G.strength * profile(this.t - G.start - (x + 200) / this.speed);
    return g;
  }
}
