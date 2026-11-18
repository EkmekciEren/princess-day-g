/* Ambient canvas life: falling rose petals, floating golden dust and a few
 * butterflies. Counts are small and sprites are pre-rendered to stay light. */
import { MOTION } from '../config';
import { between, type Rng } from '../lib/random';
import type { WindLike } from '../motion/wind';
import { glowSprite, petalSprites, wingSprites } from './sprites';

interface Petal {
  x: number; y: number; vy: number; drift: number;
  sway: number; sw: number; sp: number;
  rot: number; vr: number; flip: number; vf: number;
  size: number; sprite: number;
}
interface Mote { x: number; y: number; vx: number; vy: number; r: number; tw: number; tp: number; a: number }
interface Fly {
  x: number; y: number; heading: number; speed: number; tx: number; ty: number;
  flap: number; rate: number; glideUntil: number; size: number; wing: number; wobble: number;
}

const TAU = Math.PI * 2;

export class Ambient {
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private dpr = 1;
  private petals: Petal[] = [];
  private motes: Mote[] = [];
  private flies: Fly[] = [];
  private readonly petalImgs = petalSprites();
  private readonly glow = glowSprite();
  private readonly wings = wingSprites();
  private density = 1;
  private maxDpr = 2;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly r: Rng,
    private readonly wind: WindLike,
    /** Maps a horizontal screen fraction (0…1) to scene x, for gust timing. */
    private readonly sceneX: (fx: number) => number,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  /** Lower quality → fewer particles and a cheaper backing store. */
  setQuality(q: number): void {
    this.density = q >= 2 ? 0.6 : 1;
    this.maxDpr = q >= 2 ? 1 : 2;
    this.resize();
  }

  resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr, w < 700 ? 1.5 : 2);
    const changed = w !== this.W || h !== this.H || dpr !== this.dpr;
    this.dpr = dpr;
    this.W = w;
    this.H = h;
    if (changed) {
      // soft petals and motes don't need the full retina resolution
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
    }
    this.populate();
  }

  private count([phone, desk]: readonly [number, number]): number {
    const k = Math.min(1, Math.max(0, (this.W - 420) / 900));
    return Math.round((phone + (desk - phone) * k) * this.density);
  }

  private populate(): void {
    const r = this.r;
    const nP = this.count(MOTION.petals), nM = this.count(MOTION.dust), nF = this.count(MOTION.butterflies);
    while (this.petals.length < nP) this.petals.push(this.newPetal(true));
    this.petals.length = nP;
    while (this.motes.length < nM) {
      // denser around the sunlit centre
      const fx = 0.5 + (r() + r() - 1) * 0.55;
      this.motes.push({
        x: fx * this.W, y: between(r, 0.08, 0.9) * this.H, vx: between(r, -3, 3), vy: between(r, -9, -3),
        r: between(r, 1.1, 2.6), tw: between(r, 0.6, 1.6), tp: r() * TAU, a: between(r, 0.45, 0.95),
      });
    }
    this.motes.length = nM;
    while (this.flies.length < nF) {
      const i = this.flies.length;
      this.flies.push({
        x: between(r, 0.1, 0.9) * this.W, y: between(r, 0.35, 0.8) * this.H, heading: r() * TAU, speed: between(r, 34, 52),
        tx: between(r, 0.1, 0.9) * this.W, ty: between(r, 0.3, 0.85) * this.H, flap: r() * TAU, rate: between(r, 9, 12),
        glideUntil: 0, size: between(r, 11, 15), wing: i % this.wings.length, wobble: r() * TAU,
      });
    }
    this.flies.length = nF;
  }

  private newPetal(anywhere: boolean): Petal {
    const r = this.r;
    return {
      x: between(r, -0.15, 1) * this.W,
      y: anywhere ? between(r, -0.1, 1) * this.H : between(r, -60, -20),
      vy: between(r, 16, 34), drift: between(r, 0.6, 1.2),
      sway: between(r, 12, 34), sw: between(r, 0.5, 1.3), sp: r() * TAU,
      rot: r() * TAU, vr: between(r, -1.3, 1.3), flip: r() * TAU, vf: between(r, 1.2, 2.6),
      size: between(r, 9, 15), sprite: Math.floor(r() * this.petalImgs.length),
    };
  }

  private gustAt(x: number): number {
    return this.wind.gust(this.sceneX(x / Math.max(1, this.W)));
  }

  update(t: number, dt: number): void {
    const { r } = this;
    for (const p of this.petals) {
      const g = this.gustAt(p.x);
      p.y += p.vy * dt * (1 + 0.3 * Math.max(0, g));
      p.x += (6 + 85 * Math.max(0, g)) * p.drift * dt + Math.cos(t * p.sw + p.sp) * p.sway * p.sw * dt;
      p.rot += p.vr * dt * (1 + 2 * Math.abs(g));
      p.flip += p.vf * dt;
      if (p.y > this.H + 30 || p.x > this.W + 40) Object.assign(p, this.newPetal(false));
    }
    for (const m of this.motes) {
      const g = this.gustAt(m.x);
      m.x += (m.vx + 26 * Math.max(0, g) + 4 * Math.sin(t * 0.4 + m.tp)) * dt;
      m.y += m.vy * dt;
      if (m.y < -10) { m.y = this.H + 10; m.x = between(r, 0.1, 0.9) * this.W; }
      if (m.x > this.W + 10) m.x = -10;
    }
    for (const f of this.flies) {
      const dx = f.tx - f.x, dy = f.ty - f.y;
      if (dx * dx + dy * dy < 900) {
        f.tx = between(r, 0.08, 0.92) * this.W;
        f.ty = between(r, 0.28, 0.86) * this.H;
      }
      let diff = Math.atan2(dy, dx) - f.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      f.heading += diff * Math.min(1, dt * 1.4) + Math.sin(t * 2.3 + f.wobble) * 1.4 * dt;
      const g = this.gustAt(f.x);
      f.x += Math.cos(f.heading) * f.speed * dt + 30 * Math.max(0, g) * dt;
      f.y += Math.sin(f.heading) * f.speed * dt + Math.sin(f.flap) * 6 * dt;
      if (t > f.glideUntil && r() < dt * 0.25) f.glideUntil = t + between(r, 0.6, 1.3);
      f.flap += (t < f.glideUntil ? 2 : f.rate) * TAU * dt * 0.5;
    }
    this.draw(t);
  }

  draw(t: number): void {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const d = this.dpr;

    // golden dust
    for (const m of this.motes) {
      const a = m.a * (0.55 + 0.45 * Math.sin(t * m.tw * TAU * 0.3 + m.tp));
      const s = m.r * 6;
      c.globalAlpha = a;
      c.setTransform(d, 0, 0, d, 0, 0);
      c.drawImage(this.glow, m.x - s / 2, m.y - s / 2, s, s);
    }
    // petals (flip = a coin-like turn in 3D, faked with a vertical squash)
    for (const p of this.petals) {
      const img = this.petalImgs[p.sprite];
      const cos = Math.cos(p.rot), sin = Math.sin(p.rot);
      const squash = 0.25 + 0.75 * Math.abs(Math.cos(p.flip));
      c.globalAlpha = 0.92;
      c.setTransform(d * cos, d * sin, -d * sin * squash, d * cos * squash, d * p.x, d * p.y);
      c.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);
    }
    // butterflies
    c.globalAlpha = 0.95;
    for (const f of this.flies) {
      const k = 0.18 + 0.82 * Math.abs(Math.cos(f.flap));
      const a = f.heading + Math.PI / 2;
      const cos = Math.cos(a), sin = Math.sin(a);
      const img = this.wings[f.wing];
      const s = f.size;
      c.setTransform(d * cos * k, d * sin * k, -d * sin, d * cos, d * f.x, d * f.y);
      c.drawImage(img, -s * 0.04, -s, s * 2, s * 2);
      c.setTransform(-d * cos * k, -d * sin * k, -d * sin, d * cos, d * f.x, d * f.y);
      c.drawImage(img, -s * 0.04, -s, s * 2, s * 2);
      c.setTransform(d * cos, d * sin, -d * sin, d * cos, d * f.x, d * f.y);
      c.fillStyle = '#4a3328';
      c.beginPath();
      c.ellipse(0, 0, s * 0.07, s * 0.42, 0, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  }
}
