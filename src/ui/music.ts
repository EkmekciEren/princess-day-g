/* Ambient music toggle (muted by default).
 * If public/music.mp3 exists it is played; otherwise a gentle harp-like
 * arpeggio is generated in the browser with the Web Audio API, so the button
 * always works and nothing 404s. */
import { MUSIC, TEXT } from '../config';

interface Player { play(): void; pause(): void }

const NOTE_ON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="note" d="M9 17.5a2.5 2.5 0 1 1-2.5-2.5c.5 0 1 .15 1.5.4V5.5l10-2v11.7a2.5 2.5 0 1 1-2.5-2.5c.5 0 1 .15 1.5.4V7.3l-8 1.6v8.6Z" fill="currentColor"/><path class="slash" d="M4 4l16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

/* --------------------------------------------------- generated harp */
const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
// A minor, a Renaissance-flavoured cadence: Am F C G | Am Dm E Am
const CHORDS: number[][] = [
  [45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62],
  [45, 52, 57, 60, 64], [50, 57, 62, 65, 69], [40, 47, 52, 56, 59], [45, 52, 57, 60, 64],
];

class Harp implements Player {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private bus!: GainNode;
  private timer = 0;
  private next = 0;
  private step = 0;
  private playing = false;
  private readonly stepDur = 0.44;

  private init(): void {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 3400;
    this.master.connect(tone).connect(ctx.destination);
    // soft hall reverb from a generated impulse
    const len = Math.floor(ctx.sampleRate * 3.2);
    const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const verb = ctx.createConvolver();
    verb.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = 0.42;
    this.bus = ctx.createGain();
    this.bus.connect(this.master);
    this.bus.connect(verb).connect(wet).connect(this.master);
  }

  private pluck(freq: number, t: number, vel: number, dur = 2.6): void {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vel, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(7000, freq * 7), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(320, freq * 1.6), t + dur * 0.7);
    const o1 = ctx.createOscillator();
    o1.type = 'triangle';
    o1.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = freq * 2.003;
    const g2 = ctx.createGain();
    g2.gain.value = 0.22;
    o1.connect(env);
    o2.connect(g2).connect(env);
    env.connect(lp).connect(this.bus);
    o1.start(t); o2.start(t);
    o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  private pad(notes: number[], t: number, dur: number): void {
    const ctx = this.ctx!;
    for (const m of notes) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = midi(m);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.018, t + dur * 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.05);
      o.connect(g).connect(this.bus);
      o.start(t);
      o.stop(t + dur * 1.1);
    }
  }

  private schedule = (): void => {
    const ctx = this.ctx!;
    while (this.next < ctx.currentTime + 0.5) {
      const bar = Math.floor(this.step / 6) % CHORDS.length;
      const s = this.step % 6;
      const chord = CHORDS[bar];
      const t = this.next + (Math.random() - 0.5) * 0.012; // human touch
      if (s === 0) {
        this.pluck(midi(chord[0]), t, 0.22, 3.2);
        this.pad([chord[1] + 12, chord[3], chord[4]], t, this.stepDur * 6);
      } else {
        const up = [1, 2, 3, 4, 3][s - 1];
        this.pluck(midi(chord[up]), t, 0.11 + Math.random() * 0.05);
      }
      // a sparse, singing upper voice
      if ((s === 0 || s === 3) && Math.random() < 0.4) this.pluck(midi(chord[2 + Math.floor(Math.random() * 3)] + 12), t + 0.02, 0.08, 3);
      this.next += this.stepDur;
      this.step++;
    }
  };

  play(): void {
    if (!this.ctx) this.init();
    const ctx = this.ctx!;
    this.playing = true;
    void ctx.resume();
    this.next = ctx.currentTime + 0.15;
    this.schedule();
    window.clearInterval(this.timer);
    this.timer = window.setInterval(this.schedule, 120);
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setValueAtTime(this.master.gain.value, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(MUSIC.volume * 0.6, ctx.currentTime + 2.5);
  }

  pause(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    window.clearInterval(this.timer);
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setValueAtTime(this.master.gain.value, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    this.playing = false;
    // suspend the audio thread once faded out (unless playback resumed meanwhile)
    window.setTimeout(() => { if (!this.playing) void ctx.suspend(); }, 700);
  }
}

/* ------------------------------------------------------ mp3 player */
class FilePlayer implements Player {
  private audio = new Audio(`${import.meta.env.BASE_URL}${MUSIC.file}`);
  private fade = 0;
  constructor() {
    this.audio.loop = true;
    this.audio.preload = 'none';
    this.audio.volume = 0;
  }
  private ramp(to: number, then?: () => void): void {
    window.clearInterval(this.fade);
    this.fade = window.setInterval(() => {
      const v = this.audio.volume + (to > this.audio.volume ? 0.04 : -0.06);
      this.audio.volume = Math.min(1, Math.max(0, v));
      if ((to > 0 && this.audio.volume >= to) || (to === 0 && this.audio.volume <= 0)) {
        window.clearInterval(this.fade);
        then?.();
      }
    }, 60);
  }
  play(): void {
    void this.audio.play().catch(() => { /* blocked or missing – stay silent */ });
    this.ramp(MUSIC.volume);
  }
  pause(): void {
    this.ramp(0, () => this.audio.pause());
  }
}

export function setupMusic(button: HTMLButtonElement): { suspend(): void; restore(): void } {
  const player: Player = __HAS_MUSIC__ ? new FilePlayer() : new Harp();
  let on = false;
  let wasOn = false;
  const render = () => {
    button.classList.toggle('is-on', on);
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? TEXT.musicOn : TEXT.musicOff);
    button.title = on ? TEXT.musicOn : TEXT.musicOff;
  };
  button.innerHTML = NOTE_ON;
  button.hidden = false;
  render();
  button.addEventListener('click', () => {
    on = !on;
    if (on) player.play(); else player.pause();
    render();
  });
  return {
    suspend() { wasOn = on; if (on) player.pause(); },
    restore() { if (wasOn && on) player.play(); },
  };
}
