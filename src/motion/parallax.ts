/* Parallax: layers drift slightly with the mouse, the phone's tilt and the
 * scroll position — nearer layers move more. Amounts are clamped. */
import { MOTION } from '../config';
import { clamp } from '../lib/random';
import type { SceneLayer } from '../scene';

export class Parallax {
  private tx = 0;
  private ty = 0;
  private x = 0;
  private y = 0;
  private scroll = 0;
  private sx = 0;
  private applied = '';
  private tiltActive = false;

  constructor(private readonly layers: SceneLayer[]) {}

  /** Pointer position, -1…1 on both axes. */
  pointer(nx: number, ny: number): void {
    if (this.tiltActive) return;
    this.tx = clamp(nx, -1, 1);
    this.ty = clamp(ny, -1, 1);
  }

  /** Device tilt, already normalised to -1…1. */
  tilt(nx: number, ny: number): void {
    this.tiltActive = true;
    this.tx = clamp(nx, -1, 1);
    this.ty = clamp(ny, -1, 1);
  }

  /** Scroll progress 0…1 (one viewport). */
  setScroll(p: number): void {
    this.scroll = clamp(p, 0, 1);
  }

  update(dt: number): void {
    const k = 1 - Math.exp(-dt * 2.6); // soft follow
    this.x += (this.tx - this.x) * k;
    this.y += (this.ty - this.y) * k;
    this.sx += (this.scroll - this.sx) * (1 - Math.exp(-dt * 6));
    const key = `${this.x.toFixed(3)}|${this.y.toFixed(3)}|${this.sx.toFixed(3)}`;
    if (key === this.applied) return;
    this.applied = key;
    const { x: PX, y: PY } = MOTION.parallax;
    for (const l of this.layers) {
      const dx = -this.x * PX * l.depth;
      const dy = -this.y * PY * l.depth - this.sx * MOTION.scrollShift * l.depth;
      l.el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
    }
  }
}
