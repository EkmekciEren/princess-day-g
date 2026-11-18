/* One requestAnimationFrame loop drives everything: SVG animators, wind,
 * particles and parallax. It pauses when the tab is hidden and lowers the
 * visual quality if the device cannot keep a smooth frame rate. */
import type { Animator } from './rig';
import type { Wind } from './wind';

type Hook = (t: number, dt: number) => void;

export class Engine {
  t = 0;
  running = false;
  /** 0 = full quality … 3 = lightest. */
  quality = 0;
  /** Step quality down automatically when frames are slow. */
  adaptive = true;
  private raf = 0;
  private last = -1;
  private animators: Animator[] = [];
  private hooks: Hook[] = [];
  private qualityListeners: Array<(q: number) => void> = [];
  private x0 = -Infinity;
  private x1 = Infinity;
  // frame-time sampling for the adaptive quality
  private sampleSum = 0;
  private sampleCount = 0;
  private sampleFrom = 2.5;
  private odd = false;

  constructor(readonly wind: Wind) {}

  add(list: Animator[]): void {
    this.animators.push(...list);
  }

  onFrame(h: Hook): void {
    this.hooks.push(h);
  }

  onQuality(fn: (q: number) => void): void {
    this.qualityListeners.push(fn);
  }

  /** Only animate parts that are on screen (scene x range, SVG units). */
  setVisibleRange(x0: number, x1: number): void {
    this.x0 = x0;
    this.x1 = x1;
  }

  /** Pose every part for time t (also used for the static reduced-motion frame). */
  render(t: number, all = false): void {
    this.wind.update(t);
    const { x0, x1 } = this;
    // Repainting parts (hem, hair, ribbons) run at half rate; at the lowest
    // quality every part does.
    const halveAll = this.quality >= 3;
    this.odd = !this.odd;
    for (let i = 0; i < this.animators.length; i++) {
      const a = this.animators[i];
      if (a.x < x0 || a.x > x1) continue;
      if (!all && this.odd && (a.half || halveAll)) continue;
      a.tick(t, this.wind);
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = -1;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    const raw = this.last < 0 ? 1 / 60 : (now - this.last) / 1000;
    this.last = now;
    const dt = Math.min(raw, 0.05);
    this.t += dt;
    this.render(this.t);
    for (const h of this.hooks) h(this.t, dt);
    this.measure(raw);
    this.raf = requestAnimationFrame(this.loop);
  };

  /** Adaptive quality: if the average frame is slower than ~45 fps, step down. */
  private measure(raw: number): void {
    if (!this.adaptive || this.t < this.sampleFrom || this.quality >= 3 || raw > 0.25) return;
    this.sampleSum += raw;
    this.sampleCount++;
    if (this.sampleCount < 90) return;
    const avg = this.sampleSum / this.sampleCount;
    this.sampleSum = 0;
    this.sampleCount = 0;
    if (avg > 1 / 45) {
      this.quality++;
      this.sampleFrom = this.t + 2; // let the change settle before measuring again
      for (const fn of this.qualityListeners) fn(this.quality);
    }
  }
}
