/* Ornate gilded frame: four bevelled sides (CSS gradients) and an SVG
 * corner ornament — a rosette with acanthus scrolls — mirrored to each corner. */

const CORNER = `
<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6e3a1"/><stop offset=".35" stop-color="#c9a24b"/>
      <stop offset=".6" stop-color="#f1dc97"/><stop offset="1" stop-color="#8a6a24"/>
    </linearGradient>
    <g id="scroll">
      <path d="M20 9C34 2 50 3 61 9C70 14 70 25 61 26C54 27 52 18 58 17" fill="none" stroke="url(#cg)" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M20 9C34 2 50 3 61 9C70 14 70 25 61 26C54 27 52 18 58 17" fill="none" stroke="#6b4f1d" stroke-width=".7" stroke-linecap="round" opacity=".55"/>
      <path d="M33 6C35 0 42 -1 44 3C40 4 37 6 33 6Z" fill="url(#cg)"/>
      <path d="M46 6C49 1 55 1 57 5C53 6 50 7 46 6Z" fill="url(#cg)"/>
      <path d="M38 8C38 14 44 17 48 14C45 12 42 10 38 8Z" fill="url(#cg)" opacity=".9"/>
      <circle cx="75" cy="9" r="1.6" fill="#f1dc97"/><circle cx="82" cy="9" r="1.2" fill="#f1dc97"/><circle cx="88" cy="9" r=".9" fill="#f1dc97"/>
    </g>
  </defs>
  <use href="#scroll"/>
  <use href="#scroll" transform="matrix(0 1 1 0 0 0)"/>
  <path d="M22 22C30 26 36 34 38 42C31 40 25 33 22 22Z" fill="url(#cg)" opacity=".9"/>
  <path d="M22 22C28 21 36 23 41 28C35 30 27 28 22 22Z" fill="url(#cg)" opacity=".7"/>
  <path d="M22 22C21 28 23 36 28 41C30 35 28 27 22 22Z" fill="url(#cg)" opacity=".7"/>
  <g transform="translate(13 13)">
    <circle r="12" fill="url(#cg)"/>
    <circle r="12" fill="none" stroke="#6b4f1d" stroke-width=".8" opacity=".6"/>
    <g fill="#f6e3a1" opacity=".9">
      <ellipse cy="-7" rx="2.6" ry="4.2"/><ellipse cy="-7" rx="2.6" ry="4.2" transform="rotate(45)"/>
      <ellipse cy="-7" rx="2.6" ry="4.2" transform="rotate(90)"/><ellipse cy="-7" rx="2.6" ry="4.2" transform="rotate(135)"/>
      <ellipse cy="-7" rx="2.6" ry="4.2" transform="rotate(180)"/><ellipse cy="-7" rx="2.6" ry="4.2" transform="rotate(225)"/>
      <ellipse cy="-7" rx="2.6" ry="4.2" transform="rotate(270)"/><ellipse cy="-7" rx="2.6" ry="4.2" transform="rotate(315)"/>
    </g>
    <circle r="4.2" fill="#7a2232"/><circle r="4.2" fill="none" stroke="#c9a24b" stroke-width="1.2"/>
    <circle cx="-1.3" cy="-1.4" r="1.2" fill="#e9a0a8"/>
  </g>
</svg>`;

export function buildFrame(host: HTMLElement): void {
  const corners = ['tl', 'tr', 'bl', 'br']
    .map((c, i) => `<div class="frame__corner frame__corner--${c}">${i === 0 ? CORNER : CORNER.replace(/id="(cg|scroll)"/g, `id="$1${i}"`).replace(/#(cg|scroll)\b/g, `#$1${i}`)}</div>`)
    .join('');
  host.innerHTML =
    '<div class="frame__side frame__side--top"></div><div class="frame__side frame__side--bottom"></div>' +
    '<div class="frame__side frame__side--left"></div><div class="frame__side frame__side--right"></div>' +
    '<div class="frame__inner"></div>' + corners;
}
