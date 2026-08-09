// WebAudio 신스 — 외부 음원 0. 첫 사용자 제스처에서 unlock() 필요.
let ctx = null;
let master = null;
let muted = false;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}
export function isMuted() {
  return muted;
}

function now() {
  return ctx ? ctx.currentTime : 0;
}

function tone({ freq = 440, type = 'sine', dur = 0.15, at = 0, vol = 0.3, slide = 0 }) {
  if (!ctx) return;
  const t0 = now() + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.2, at = 0, vol = 0.25, lowpass = 4000 }) {
  if (!ctx) return;
  const t0 = now() + at;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t0);
}

export const sfx = {
  ui() {
    tone({ freq: 620, type: 'sine', dur: 0.04, vol: 0.09 });
    tone({ freq: 930, type: 'sine', dur: 0.05, at: 0.025, vol: 0.07 });
  },
  // 발사 (포슝)
  fire() {
    noise({ dur: 0.12, vol: 0.22, lowpass: 2600 });
    tone({ freq: 300, type: 'square', dur: 0.22, vol: 0.16, slide: 320 });
  },
  // 폭발 (쾅)
  boom() {
    noise({ dur: 0.45, vol: 0.42, lowpass: 1500 });
    tone({ freq: 90, type: 'sine', dur: 0.4, vol: 0.35, slide: -40 });
  },
  // 직격
  crit() {
    noise({ dur: 0.5, vol: 0.45, lowpass: 2000 });
    tone({ freq: 140, type: 'sawtooth', dur: 0.45, vol: 0.3, slide: -90 });
    tone({ freq: 1200, type: 'triangle', dur: 0.15, at: 0.05, vol: 0.15, slide: -400 });
  },
  // 조준 틱
  aim() {
    tone({ freq: 500, type: 'sine', dur: 0.03, vol: 0.05 });
  },
  whoosh() {
    noise({ dur: 0.2, vol: 0.1, lowpass: 2200 });
  },
  hit() {
    tone({ freq: 220, type: 'square', dur: 0.13, vol: 0.16 });
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.25, at: i * 0.13, vol: 0.2 }));
    noise({ dur: 0.5, at: 0.5, vol: 0.1, lowpass: 6000 });
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone({ freq: f, type: 'sawtooth', dur: 0.3, at: i * 0.18, vol: 0.16 }));
  },
  fanfare() {
    [392, 523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.22, at: i * 0.11, vol: 0.19 }));
  }
};

// ---- BGM: 긴장감 있는 대치 + 경쾌함 (92bpm, 마이너 펜타 플럭) ----
const BPM = 92;
const EIGHTH = 60 / BPM / 2;
const CHORDS = [
  [220.0, 261.6, 329.6], // Am
  [174.6, 220.0, 261.6], // F
  [261.6, 329.6, 392.0], // C
  [196.0, 246.9, 293.7]  // G
];
const PENTA = [440.0, 523.3, 587.3, 659.3, 784.0];
const MELODY = [
  0, 0, 2, 0, 3, 0, 1, 0,
  2, 0, 4, 2, 0, 3, 0, 0,
  1, 0, 3, 1, 4, 0, 2, 0,
  3, 2, 1, 0, 2, 0, 0, 0
];

let musicTimer = null;
let nextTime = 0;
let stepIdx = 0;
let musicRate = 1;

function scheduleStep(s, t) {
  const swing = s % 2 === 1 ? EIGHTH * 0.15 : 0;
  const at = Math.max(0, t - ctx.currentTime + swing);
  const chord = CHORDS[Math.floor(s / 8) % 4];
  const inBar = s % 8;
  if (inBar === 0) for (const f of chord) tone({ freq: f, type: 'sine', dur: EIGHTH * 8, at, vol: 0.028 });
  if (inBar === 0 || inBar === 4) tone({ freq: chord[0] / 2, type: 'sine', dur: 0.24, at, vol: 0.14, slide: -10 });
  const m = MELODY[s % MELODY.length];
  if (m !== 0 || s % 16 === 0) {
    tone({ freq: PENTA[m], type: 'triangle', dur: 0.1, at, vol: 0.07 });
  }
  if (inBar % 2 === 1) noise({ dur: 0.02, at, vol: 0.02, lowpass: 6500 });
}

export const music = {
  start() {
    if (!ctx || musicTimer) return;
    nextTime = ctx.currentTime + 0.15;
    stepIdx = 0;
    musicTimer = setInterval(() => {
      while (nextTime < ctx.currentTime + 0.4) {
        scheduleStep(stepIdx, nextTime);
        nextTime += EIGHTH / musicRate;
        stepIdx = (stepIdx + 1) % 64;
      }
    }, 120);
  },
  stop() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  },
  setRate(r) {
    musicRate = r;
  }
};
