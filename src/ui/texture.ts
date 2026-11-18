/* Aged-canvas overlay (static, painted once):
 *  - a fine grain + canvas weave as a tiny tiling background, and
 *  - a faint craquelure: a network of hairline cracks like old varnish. */
import { mulberry32 } from '../lib/random';
import { n } from '../lib/svg';

export function grainCss(): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">` +
    `<filter id="g" x="0" y="0" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" stitchTiles="stitch"/>` +
    `<feColorMatrix values="0 0 0 0 .3 0 0 0 0 .19 0 0 0 0 .1 0 0 0 .45 -.17"/></filter>` +
    `<rect width="100%" height="100%" filter="url(#g)"/></svg>`;
  const weave = 'rgba(90, 60, 30, 0.02)';
  return (
    `url("data:image/svg+xml,${encodeURIComponent(svg)}"),` +
    `repeating-linear-gradient(0deg, ${weave} 0 1px, transparent 1px 3px),` +
    `repeating-linear-gradient(90deg, ${weave} 0 1px, transparent 1px 3px)`
  );
}

/** A jittered grid joined by wobbly hairlines reads as paint craquelure. */
export function craquelureSvg(seed = 7): string {
  const r = mulberry32(seed);
  const cell = 64, cols = Math.ceil(1600 / cell) + 1, rows = Math.ceil(1000 / cell) + 1;
  const pts: Array<[number, number]> = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) pts.push([i * cell + (r() - 0.5) * cell * 0.8, j * cell + (r() - 0.5) * cell * 0.8]);
  const at = (i: number, j: number) => pts[j * cols + i];
  let d = '';
  const crack = (a: [number, number], b: [number, number]) => {
    const mx = (a[0] + b[0]) / 2 + (r() - 0.5) * 14, my = (a[1] + b[1]) / 2 + (r() - 0.5) * 14;
    d += `M${n(a[0])} ${n(a[1])}Q${n(mx)} ${n(my)} ${n(b[0])} ${n(b[1])}`;
  };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (i + 1 < cols && r() < 0.8) crack(at(i, j), at(i + 1, j));
      if (j + 1 < rows && r() < 0.8) crack(at(i, j), at(i, j + 1));
      if (i + 1 < cols && j + 1 < rows && r() < 0.12) crack(at(i, j), at(i + 1, j + 1));
    }
  }
  return (
    `<svg class="craquelure" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">` +
    `<path d="${d}" fill="none" stroke="#fff8e6" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".05" transform="translate(.8 .8)"/>` +
    `<path d="${d}" fill="none" stroke="#4a2e1a" stroke-width=".7" vector-effect="non-scaling-stroke" opacity=".065"/>` +
    `</svg>`
  );
}
