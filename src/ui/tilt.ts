/* Device-orientation parallax. On iOS the permission must be requested from
 * a user gesture, so a small invitation button is shown there; elsewhere the
 * sensor is used directly (when present). */

type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

export function setupTilt(invite: HTMLButtonElement, onTilt: (nx: number, ny: number) => void): void {
  const Ctor = (window as unknown as { DeviceOrientationEvent?: OrientationCtor }).DeviceOrientationEvent;
  if (!Ctor || !matchMedia('(pointer: coarse)').matches) return;

  let baseB: number | null = null;
  let baseG = 0;
  const handler = (e: DeviceOrientationEvent) => {
    if (e.beta === null || e.gamma === null) return;
    let b = e.beta, gm = e.gamma;
    const angle = (screen.orientation?.angle ?? 0) % 360;
    if (angle === 90) [b, gm] = [-gm, b];
    else if (angle === 270 || angle === -90) [b, gm] = [gm, -b];
    if (baseB === null) { baseB = b; baseG = gm; }
    // slowly re-centre so any comfortable holding angle becomes "neutral"
    baseB += (b - baseB) * 0.01;
    baseG += (gm - baseG) * 0.01;
    onTilt((gm - baseG) / 16, (b - baseB) / 16);
  };
  const listen = () => window.addEventListener('deviceorientation', handler, { passive: true });

  // iPhone / iPad (including iPadOS that reports itself as a Mac)
  const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
  if (iOS && typeof Ctor.requestPermission === 'function') {
    invite.hidden = false;
    invite.addEventListener('click', async () => {
      try {
        if ((await Ctor.requestPermission!()) === 'granted') listen();
      } catch {
        /* permission dialog dismissed – the painting still moves on its own */
      }
      invite.classList.add('is-gone');
      window.setTimeout(() => (invite.hidden = true), 600);
    }, { once: true });
  } else {
    listen();
  }
}
