/* "Bir dilek tut" effect: a burst of rose petals and golden sparkles.
 * Uses its own canvas above the content and only runs while particles live. */
import { between, mulberry32 } from '../lib/random';
import { glowSprite, petalSprites, starSprite } from './sprites';

interface P {
  kind: 0 | 1 | 2; // petal, star, glow
  x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; flip: number; vf: number;
  size: number; life: number; age: number; sprite: number; grav: number; drag: number;
}

const TAU = Math.PI * 2;

export class Burst {
  private ctx: CanvasRenderingContext2D;
  private parts: P[] = [];
  private raf = 0;
  private last = 0;
  private dpr = 1;
  private readonly petals = petalSprites();
  private readonly star = starSprite();
  private readonly glow = glowSprite();
  private readonly r = mulberry32(Date.now() & 0xffff);

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  private resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
  }

  fire(x: number, y: number): void {
    const r = this.r;
    if (!this.parts.length) this.resize();
    const add = (kind: 0 | 1 | 2, count: number, speed: [number, number], life: [number, number], size: [number, number], grav: number, drag: number) => {
      for (let i = 0; i < count; i++) {
        // mostly upwards, fanning out like a fountain
        const a = -Math.PI / 2 + (r() + r() - 1) * 1.5;
        const v = between(r, speed[0], speed[1]);
        this.parts.push({
          kind, x: x + between(r, -10, 10), y: y + between(r, -6, 6), vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          rot: r() * TAU, vr: between(r, -4, 4), flip: r() * TAU, vf: between(r, 2, 5),
          size: between(r, size[0], size[1]), life: between(r, life[0], life[1]), age: 0,
          sprite: Math.floor(r() * this.petals.length), grav, drag,
        });
      }
    };
    add(0, 34, [160, 460], [2.2, 3.4], [10, 17], 150, 1.3);
    add(1, 46, [90, 420], [1.1, 2.1], [8, 18], 50, 1.9);
    add(2, 26, [40, 220], [1.6, 2.8], [10, 26], -10, 1.4);
    if (!this.raf) {
      this.canvas.classList.add('is-active'); // only composited while it has something to show
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.loop);
    }
  }

  private loop = (now: number): void => {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const c = this.ctx, d = this.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const alive: P[] = [];
    for (const p of this.parts) {
      p.age += dt;
      if (p.age >= p.life) continue;
      alive.push(p);
      const k = Math.exp(-p.drag * dt);
      p.vx *= k;
      p.vy = p.vy * k + p.grav * dt;
      p.x += p.vx * dt + (p.kind === 0 ? Math.sin(p.age * 3 + p.rot) * 18 * dt : 0);
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;
      const fade = Math.min(1, (p.life - p.age) / 0.6) * Math.min(1, p.age / 0.08);
      const cos = Math.cos(p.rot), sin = Math.sin(p.rot);
      if (p.kind === 0) {
        const sq = 0.25 + 0.75 * Math.abs(Math.cos(p.flip));
        c.globalAlpha = fade;
        c.setTransform(d * cos, d * sin, -d * sin * sq, d * cos * sq, d * p.x, d * p.y);
        c.drawImage(this.petals[p.sprite], -p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.kind === 1) {
        const tw = 0.6 + 0.4 * Math.sin(p.age * 14 + p.rot);
        const s = p.size * tw;
        c.globalAlpha = fade;
        c.setTransform(d * cos, d * sin, -d * sin, d * cos, d * p.x, d * p.y);
        c.drawImage(this.star, -s / 2, -s / 2, s, s);
      } else {
        c.globalAlpha = fade * 0.8;
        c.setTransform(d, 0, 0, d, d * p.x, d * p.y);
        c.drawImage(this.glow, -p.size / 2, -p.size / 2, p.size, p.size);
      }
    }
    c.globalAlpha = 1;
    this.parts = alive;
    if (alive.length) {
      this.raf = requestAnimationFrame(this.loop);
    } else {
      this.raf = 0;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.classList.remove('is-active');
    }
  };
}
