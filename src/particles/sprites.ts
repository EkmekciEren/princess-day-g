/* Pre-rendered particle sprites (drawn once, then blitted every frame). */

const make = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement => {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  if (ctx) draw(ctx);
  return cv;
};

const PETAL_COLORS: ReadonlyArray<readonly [string, string]> = [
  ['#f8e2dc', '#d9a5a0'],
  ['#fdf4ee', '#efcfc6'],
  ['#f6ead6', '#e2c2ae'],
  ['#ecb4ae', '#b9706e'],
  ['#fffaf2', '#f0d6c8'],
];

/** Rose petals: a soft heart-ish shape with a light centre. 48×48 px. */
export function petalSprites(): HTMLCanvasElement[] {
  return PETAL_COLORS.map(([light, deep]) =>
    make(48, 48, (c) => {
      c.translate(24, 24);
      c.scale(1.7, 1.7);
      const grad = c.createRadialGradient(0, 4, 1, 0, 0, 13);
      grad.addColorStop(0, light);
      grad.addColorStop(1, deep);
      c.fillStyle = grad;
      c.beginPath();
      c.moveTo(0, -8);
      c.bezierCurveTo(4, -13, 12, -8, 9, 0);
      c.bezierCurveTo(7, 7, 2, 11, 0, 12);
      c.bezierCurveTo(-2, 11, -7, 7, -9, 0);
      c.bezierCurveTo(-12, -8, -4, -13, 0, -8);
      c.fill();
      c.strokeStyle = 'rgba(150, 80, 80, 0.18)';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(0, 10);
      c.quadraticCurveTo(1, 0, 0, -6);
      c.stroke();
    }),
  );
}

/** Warm golden glow for dust motes and sparkles. 32×32 px. */
export function glowSprite(): HTMLCanvasElement {
  return make(32, 32, (c) => {
    const grad = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 246, 214, 1)');
    grad.addColorStop(0.25, 'rgba(241, 214, 140, 0.85)');
    grad.addColorStop(0.6, 'rgba(201, 162, 75, 0.28)');
    grad.addColorStop(1, 'rgba(201, 162, 75, 0)');
    c.fillStyle = grad;
    c.fillRect(0, 0, 32, 32);
  });
}

/** Four-pointed sparkle star. 32×32 px. */
export function starSprite(): HTMLCanvasElement {
  return make(32, 32, (c) => {
    c.translate(16, 16);
    const grad = c.createRadialGradient(0, 0, 0, 0, 0, 15);
    grad.addColorStop(0, '#fffdf0');
    grad.addColorStop(0.35, '#f6e3a1');
    grad.addColorStop(1, 'rgba(201, 162, 75, 0)');
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(0, -15);
    c.quadraticCurveTo(2, -2, 15, 0);
    c.quadraticCurveTo(2, 2, 0, 15);
    c.quadraticCurveTo(-2, 2, -15, 0);
    c.quadraticCurveTo(-2, -2, 0, -15);
    c.fill();
  });
}

const WING_COLORS: ReadonlyArray<readonly [string, string, string]> = [
  ['#fdf6e8', '#e8d3a6', '#b58a37'], // cream with gold edges
  ['#f7ddd6', '#e2aaa4', '#8a3443'], // pale rose
  ['#f7ecb4', '#e6c869', '#9c7424'], // sulphur yellow
];

/** One side (right) of a butterfly: fore- and hind-wing. Body sits at x=0. 64×64 px. */
export function wingSprites(): HTMLCanvasElement[] {
  return WING_COLORS.map(([a, b, edge]) =>
    make(64, 64, (c) => {
      c.translate(2, 32);
      const fore = c.createRadialGradient(4, -4, 2, 14, -14, 30);
      fore.addColorStop(0, b);
      fore.addColorStop(0.55, a);
      fore.addColorStop(0.9, a);
      fore.addColorStop(1, edge);
      c.fillStyle = fore;
      c.beginPath();
      c.moveTo(0, -2);
      c.bezierCurveTo(8, -26, 34, -32, 40, -22);
      c.bezierCurveTo(44, -14, 30, -4, 2, 2);
      c.closePath();
      c.fill();
      const hind = c.createRadialGradient(4, 4, 2, 14, 14, 24);
      hind.addColorStop(0, b);
      hind.addColorStop(0.6, a);
      hind.addColorStop(1, edge);
      c.fillStyle = hind;
      c.beginPath();
      c.moveTo(1, 1);
      c.bezierCurveTo(22, 2, 32, 14, 24, 24);
      c.bezierCurveTo(16, 32, 4, 20, 0, 4);
      c.closePath();
      c.fill();
      // little eye-spots near the wing tips
      c.fillStyle = edge;
      c.globalAlpha = 0.6;
      c.beginPath();
      c.arc(32, -20, 2.4, 0, Math.PI * 2);
      c.arc(20, 18, 2, 0, Math.PI * 2);
      c.fill();
    }),
  );
}
