/* Shared gradients and filters. They live in one hidden <svg> and are
 * referenced (url(#id)) by every scene layer in the document. */

type Stop = readonly [number, string, number?];

const stops = (s: readonly Stop[]): string =>
  s.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');

/** Vertical gradient in object bounding box: top → bottom. */
const vgrad = (id: string, s: readonly Stop[], x2 = 0, y2 = 1): string =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`;

/** Gradient running from a shape's base (bottom) to its tip (top). */
const tipGrad = (id: string, s: readonly Stop[]): string =>
  `<linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0">${stops(s)}</linearGradient>`;

const radial = (id: string, s: readonly Stop[], cx = 0.5, cy = 0.5, r = 0.5, fx?: number, fy?: number): string =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx === undefined ? '' : ` fx="${fx}" fy="${fy}"`}>${stops(s)}</radialGradient>`;

const userV = (id: string, y1: number, y2: number, s: readonly Stop[]): string =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y1}" x2="0" y2="${y2}">${stops(s)}</linearGradient>`;

export function defsMarkup(): string {
  return [
    /* ---------- sky & light ---------- */
    userV('gSky', 0, 1000, [
      [0, '#bccbcb'], [0.22, '#d6dcd2'], [0.42, '#ece2cc'], [0.55, '#f6dcc2'], [0.62, '#f4d2bf'], [1, '#f3e6cf'],
    ]),
    radial('gSun', [[0, '#fff8e6', 0.95], [0.3, '#fcebc9', 0.62], [0.65, '#f8dfc0', 0.22], [1, '#f6dcc1', 0]]),
    radial('gCloud', [[0, '#fffaf1', 0.9], [0.55, '#fbf1e4', 0.5], [1, '#f8eadb', 0]]),
    radial('gCloudPink', [[0, '#fbe6dc', 0.85], [0.6, '#f5d9cf', 0.4], [1, '#f2d3c9', 0]]),
    userV('gHaze', 420, 640, [[0, '#f6e7d2', 0], [0.6, '#f7e6d0', 0.62], [1, '#f3e6cf', 0]]),

    /* ---------- landscape ---------- */
    vgrad('gHillA', [[0, '#c6cec0'], [1, '#d6d8c8']]),
    vgrad('gHillB', [[0, '#b0bea3'], [1, '#c4cab1']]),
    vgrad('gHillC', [[0, '#9db08b'], [1, '#b2bd9b']]),
    userV('gMeadow', 560, 1000, [[0, '#bcc6a2'], [0.25, '#a6b48b'], [0.6, '#8c9e74'], [1, '#71865e']]),
    userV('gBank', 840, 1000, [[0, '#788e5f'], [0.45, '#5f744b'], [1, '#475a39']]),
    radial('gPatchLight', [[0, '#d5dcb4', 0.55], [1, '#d5dcb4', 0]]),
    radial('gPatchDark', [[0, '#5d7049', 0.35], [1, '#5d7049', 0]]),
    radial('gShadow', [[0, '#2e2a1b', 0.34], [0.6, '#2e2a1b', 0.14], [1, '#2e2a1b', 0]]),
    vgrad('gPath', [[0, '#e9dcbe', 0.75], [1, '#d9c9a5', 0.55]]),

    /* ---------- trees & leaves ---------- */
    `<linearGradient id="gTrunk" x1="0" y1="0" x2="1" y2="0">${stops([[0, '#3a2d26'], [0.42, '#6a5545'], [0.7, '#56463a'], [1, '#33281f']])}</linearGradient>`,
    radial('gLeafA', [[0, '#9aae84'], [0.5, '#6b8055'], [1, '#4b5e3d']], 0.38, 0.3, 0.8),
    radial('gLeafB', [[0, '#82976c'], [0.55, '#5a6e47'], [1, '#3f5134']], 0.38, 0.3, 0.8),
    radial('gLeafC', [[0, '#6c825c'], [0.55, '#4b5e3d'], [1, '#33432a']], 0.4, 0.3, 0.8),
    radial('gMyrtle', [[0, '#76896a'], [0.55, '#526449'], [1, '#374632']], 0.38, 0.3, 0.8),
    tipGrad('gLeaf', [[0, '#4d613f'], [0.6, '#738a5c'], [1, '#93a87a']]),
    tipGrad('gLeafPale', [[0, '#62774f'], [1, '#a9bb8f']]),
    tipGrad('gBlade1', [[0, '#4a5e3b'], [0.55, '#7a9461'], [1, '#a9bc8b']]),
    tipGrad('gBlade2', [[0, '#3b4d30'], [0.55, '#62794c'], [1, '#8aa271']]),
    tipGrad('gBlade3', [[0, '#55693f'], [1, '#b8c69a']]),
    radial('gOrange', [[0, '#f8cd78'], [0.55, '#e0973c'], [1, '#b56a26']], 0.36, 0.32, 0.7),

    /* ---------- petals ---------- */
    tipGrad('gPetalCream', [[0, '#e6d2ad'], [0.45, '#f8f0e1'], [1, '#fffdf7']]),
    tipGrad('gPetalRose', [[0, '#b8716f'], [0.5, '#d9a5a0'], [1, '#f1d2cb']]),
    tipGrad('gPetalBurg', [[0, '#4e1a25'], [0.55, '#86323f'], [1, '#b0566a']]),
    tipGrad('gPetalGold', [[0, '#b98327'], [0.6, '#e2b64d'], [1, '#f4da8c']]),
    tipGrad('gPetalBlue', [[0, '#7884ad'], [0.6, '#a5b0cf'], [1, '#cdd3e6']]),
    tipGrad('gPetalLav', [[0, '#8a75a3'], [0.6, '#b6a4ca'], [1, '#d8cde4']]),
    tipGrad('gPetalCoral', [[0, '#a9514c'], [0.6, '#d48877'], [1, '#ecb8a6']]),
    // whole flower heads (petals merged into one path): base → tip runs centre → rim
    radial('gHeadCream', [[0, '#e3cda4'], [0.4, '#f6ecdb'], [1, '#fffdf7']]),
    radial('gHeadGold', [[0, '#b98327'], [0.45, '#e2b64d'], [1, '#f6dd92']]),
    radial('gHeadBlue', [[0, '#8a96bd'], [0.6, '#a9b3d1'], [1, '#d0d6e8']]),
    radial('gHeadCoral', [[0, '#a24c47'], [0.5, '#d48877'], [1, '#efbcaa']]),
    radial('gHeadLav', [[0, '#8a75a3'], [0.6, '#b6a4ca'], [1, '#d8cde4']]),
    radial('gRose', [[0, '#f4d6cf'], [0.45, '#dba7a1'], [1, '#a8666a']], 0.45, 0.4, 0.62),
    radial('gRoseDeep', [[0, '#c7727e'], [0.5, '#8a3443'], [1, '#521a26']], 0.45, 0.4, 0.62),
    radial('gRoseCream', [[0, '#fffaf0'], [0.5, '#f1e2c9'], [1, '#cdb48f']], 0.45, 0.4, 0.62),
    radial('gCenterGold', [[0, '#f4d986'], [0.6, '#d7a43d'], [1, '#9c6f22']], 0.4, 0.35, 0.65),

    /* ---------- princess ---------- */
    // user-space so the painted-once upper gown and the waving hem match exactly
    userV('gGown', 582, 960, [[0, '#e9c1b9'], [0.4, '#dcaaa4'], [0.8, '#c99490'], [1, '#bb8582']]),
    `<linearGradient id="gGoldV" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="26" y2="34" spreadMethod="reflect">${stops([[0, '#9c7a2e'], [0.45, '#e9cf7a'], [1, '#b8923f']])}</linearGradient>`,
    radial('gIris', [[0, '#a07650'], [0.6, '#6b4530'], [1, '#3e2618']]),
    radial('gNeckShade', [[0, '#b9806c', 0.42], [1, '#b9806c', 0]]),
    `<linearGradient id="gGownFold" x1="0" y1="0" x2="1" y2="0">${stops([[0, '#9c6466', 0], [0.5, '#9c6466', 0.42], [1, '#9c6466', 0]])}</linearGradient>`,
    `<linearGradient id="gGownSheen" x1="0" y1="0" x2="1" y2="0">${stops([[0, '#fbe3da', 0], [0.5, '#fbe3da', 0.55], [1, '#fbe3da', 0]])}</linearGradient>`,
    vgrad('gUnderskirt', [[0, '#f6ead6'], [1, '#e2cba7']]),
    vgrad('gBodice', [[0, '#e6b8b0'], [1, '#c98f8c']]),
    `<linearGradient id="gSleeve" x1="0" y1="0" x2="1" y2="0">${stops([[0, '#efe2d2'], [0.45, '#fdf8f1'], [1, '#e6d4bf']])}</linearGradient>`,
    radial('gSkin', [[0, '#fbebe0'], [0.55, '#f2d4c2'], [1, '#e2b29d']], 0.46, 0.4, 0.68),
    vgrad('gSkinBody', [[0, '#f5ddcf'], [1, '#e8c0ad']]),
    radial('gBlush', [[0, '#e48f86', 0.42], [1, '#e48f86', 0]]),
    userV('gHair', 400, 760, [[0, '#8f532f'], [0.2, '#b06d3c'], [0.45, '#c98c4f'], [0.7, '#b9773f'], [1, '#93582f']]),
    userV('gHairLight', 400, 760, [[0, '#e3ae6c', 0.5], [1, '#ecc184', 0.32]]),
    `<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1">${stops([[0, '#8a6a24'], [0.3, '#e9cf7a'], [0.5, '#c9a24b'], [0.68, '#f6e3a1'], [1, '#9c7a2e']])}</linearGradient>`,
    `<linearGradient id="gVeil" x1="0" y1="0" x2="1" y2="1">${stops([[0, '#fffaf2', 0.55], [1, '#fff6ea', 0.12]])}</linearGradient>`,
    `<linearGradient id="gSash" x1="0" y1="0" x2="0" y2="1">${stops([[0, '#d7b25c'], [1, '#b98d3a']])}</linearGradient>`,
    `<linearGradient id="gDrape" x1="0" y1="0" x2="1" y2="1">${stops([[0, '#e7bdb5', 0.85], [1, '#d9a5a0', 0.45]])}</linearGradient>`,

    /* ---------- garden figures' dresses ---------- */
    vgrad('gDressSage', [[0, '#bdcaa8'], [0.5, '#98ab84'], [1, '#77895f']]),
    vgrad('gDressCream', [[0, '#fdf7ec'], [0.5, '#ece0ca'], [1, '#d3c1a1']]),
    vgrad('gDressRose', [[0, '#f1d3cc'], [0.5, '#dba9a3'], [1, '#b98582']]),
    vgrad('gDressGold', [[0, '#f0dcaa'], [0.5, '#d8b672'], [1, '#b28c49']]),
    vgrad('gDressBlue', [[0, '#d9dfe2'], [0.5, '#b6c2c9'], [1, '#93a2ad']]),
    vgrad('gBasket', [[0, '#b48a55'], [1, '#7d5a32']]),

    /* ---------- filters ---------- */
    // Distant layer: a soft painterly blur (static, so it is rendered once).
    `<filter id="fFar" x="-2%" y="-10%" width="104%" height="120%"><feGaussianBlur stdDeviation="1.5"/></filter>`,
    // Global wind: animated noise displaces hair and silk very slightly.
    `<filter id="fWind" x="-6%" y="-4%" width="112%" height="108%">` +
      `<feTurbulence id="windNoise" type="fractalNoise" baseFrequency="0.011 0.026" numOctaves="2" seed="7" result="noise"/>` +
      `<feDisplacementMap id="windDisp" in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter>`,
  ].join('');
}
