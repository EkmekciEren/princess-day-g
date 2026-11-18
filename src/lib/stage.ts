/* Stage builder — how the painting stays smooth on phones.
 *
 * Every moving part (flower, leaf cluster, arm, lock of hair…) is written as
 * its own small inline <svg> inside a positioned <div> "sprite". Sprites are
 * GPU layers: the browser paints each one ONCE and then only rotates/scales
 * it, instead of repainting thousands of vector paths every frame. Pivots
 * (stem base, hip, shoulder…) become the sprite's CSS transform-origin.
 *
 * All art is drawn in scene units (viewBox 0 0 1600 1000); a sprite's svg
 * simply uses its own box as the viewBox, so gradients and coordinates match.
 */
import { n, type Pt } from './svg';

export interface Box { x: number; y: number; w: number; h: number }

/** Box from two corners. */
export const box = (x0: number, y0: number, x1: number, y1: number): Box => ({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
/** Box around a point. */
export const around = (cx: number, cy: number, rx: number, ry = rx): Box => box(cx - rx, cy - ry, cx + rx, cy + ry);

interface OpenOpts {
  id?: string;
  cls?: string;
  /** Pivot in the current coordinates → CSS transform-origin. */
  origin?: Pt;
  /** false → plain container (no GPU layer of its own). */
  layer?: boolean;
  /** Scene x of a top-level item, used to hide parts that are off-screen. */
  cullX?: number;
}

export class Stage {
  private out: string[] = [];
  private stack: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];

  private get cur() {
    return this.stack[this.stack.length - 1];
  }

  /** Open a sprite whose box is given in the current coordinates. */
  open(b: Box, o: OpenOpts = {}): this {
    const c = this.cur;
    let style = `left:${n(b.x - c.x)}px;top:${n(b.y - c.y)}px;width:${n(b.w)}px;height:${n(b.h)}px`;
    if (o.origin) style += `;transform-origin:${n(o.origin[0] - b.x)}px ${n(o.origin[1] - b.y)}px`;
    this.push(o.layer === false ? 'grp' : 'sp', o, style);
    this.stack.push({ x: b.x, y: b.y });
    return this;
  }

  /** Open a coordinate frame: local (0,0) sits at (x,y), scaled by sx/sy. */
  frame(x: number, y: number, sx: number, sy: number, o: OpenOpts = {}): this {
    const c = this.cur;
    const style = `left:${n(x - c.x)}px;top:${n(y - c.y)}px;transform:scale(${n2(sx)},${n2(sy)})`;
    this.push(o.layer ? 'fr sp' : 'fr', o, style);
    this.stack.push({ x: 0, y: 0 });
    return this;
  }

  close(): this {
    this.out.push('</div>');
    this.stack.pop();
    return this;
  }

  /** Static vector art drawn inside box b (current coordinates). */
  art(markup: string, b: Box, cls = ''): this {
    const c = this.cur;
    this.out.push(
      `<svg class="art${cls ? ` ${cls}` : ''}" viewBox="${n(b.x)} ${n(b.y)} ${n(b.w)} ${n(b.h)}" ` +
      `style="left:${n(b.x - c.x)}px;top:${n(b.y - c.y)}px;width:${n(b.w)}px;height:${n(b.h)}px" aria-hidden="true" focusable="false">${markup}</svg>`,
    );
    return this;
  }

  /** One sprite that contains only art. */
  sprite(b: Box, markup: string, o: OpenOpts = {}): this {
    return this.open(b, o).art(markup, b).close();
  }

  raw(html: string): this {
    this.out.push(html);
    return this;
  }

  html(): string {
    return this.out.join('');
  }

  private push(base: string, o: OpenOpts, style: string): void {
    const cls = o.cls ? `${base} ${o.cls}` : base;
    this.out.push(
      `<div class="${cls}"${o.id ? ` id="${o.id}"` : ''}${o.cullX !== undefined ? ` data-x="${n(o.cullX)}"` : ''} style="${style}">`,
    );
  }
}

const n2 = (v: number): string => (Math.round(v * 1000) / 1000).toString();
