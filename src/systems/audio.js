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
  siren() {
    tone({ freq: 660, type: 'square', dur: 0.09, vol: 0.11 });
    tone({ freq: 520, type: 'square', dur: 0.09, at: 0.1, vol: 0.11 });
  },
  tap() {
    tone({ freq: 880, type: 'triangle', dur: 0.04, vol: 0.1 });
  },
  holdTick(p = 0) {
    tone({ freq: 300 + 400 * p, type: 'sine', dur: 0.05, vol: 0.07 });
  },
  stamp() {
    noise({ dur: 0.08, vol: 0.3, lowpass: 1200 });
    tone({ freq: 130, type: 'sine', dur: 0.16, vol: 0.4, slide: -60 });
  },
  step() {
    // 협력 단계 하나 성공 (경쾌한 팝)
    tone({ freq: 700, type: 'triangle', dur: 0.07, vol: 0.13, slide: 160 });
  },
  burst() {
    noise({ dur: 0.3, vol: 0.3, lowpass: 2500 });
    tone({ freq: 320, type: 'sawtooth', dur: 0.35, vol: 0.2, slide: -220 });
  },
  wrong() {
    tone({ freq: 220, type: 'square', dur: 0.13, vol: 0.16 });
  },
  chime(step = 0) {
    const base = 520 * Math.pow(1.12, Math.min(step, 8));
    tone({ freq: base, type: 'triangle', dur: 0.1, vol: 0.15 });
    tone({ freq: base * 1.5, type: 'triangle', dur: 0.12, at: 0.06, vol: 0.12 });
  },
  coin() {
    tone({ freq: 990, type: 'triangle', dur: 0.06, vol: 0.12 });
    tone({ freq: 1320, type: 'triangle', dur: 0.1, at: 0.06, vol: 0.12 });
  },
  levelup() {
    [392, 494, 587, 784].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.16, at: i * 0.09, vol: 0.18 }));
  },
  fanfare() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.25, at: i * 0.13, vol: 0.2 }));
    noise({ dur: 0.5, at: 0.5, vol: 0.1, lowpass: 6000 });
  },
  fail() {
    [392, 330, 262].forEach((f, i) => tone({ freq: f, type: 'sawtooth', dur: 0.25, at: i * 0.16, vol: 0.16 }));
  },
  run() {
    // 캐릭터 달려오는 소리 (또각또각)
    tone({ freq: 240, type: 'triangle', dur: 0.04, vol: 0.08 });
    tone({ freq: 260, type: 'triangle', dur: 0.04, at: 0.09, vol: 0.08 });
    tone({ freq: 240, type: 'triangle', dur: 0.04, at: 0.18, vol: 0.08 });
  }
};

// ---- BGM: 통통 튀고 잔잔한 밝은 루프 (96bpm 스윙, 펜타토닉 플럭) ----
const BPM = 96;
const EIGHTH = 60 / BPM / 2;
const CHORDS = [
  [261.6, 329.6, 392.0],
  [220.0, 261.6, 329.6],
  [174.6, 220.0, 261.6],
  [196.0, 246.9, 293.7]
];
const PENTA = [523.3, 587.3, 659.3, 784.0, 880.0];
const MELODY = [
  0, 2, 4, 2, 3, 0, 1, 0,
  2, 4, 3, 2, 0, 2, 1, 0,
  4, 3, 2, 3, 4, 0, 3, 2,
  1, 2, 3, 1, 0, 1, 0, 0
];

let musicTimer = null;
let nextTime = 0;
let stepIdx = 0;
let musicRate = 1;

function scheduleStep(s, t) {
  const swing = s % 2 === 1 ? EIGHTH * 0.18 : 0;
  const at = Math.max(0, t - ctx.currentTime + swing);
  const chord = CHORDS[Math.floor(s / 8) % 4];
  const inBar = s % 8;
  if (inBar === 0) for (const f of chord) tone({ freq: f, type: 'sine', dur: EIGHTH * 8, at, vol: 0.03 });
  if (inBar === 0 || inBar === 4) tone({ freq: chord[0] / 2, type: 'sine', dur: 0.22, at, vol: 0.15, slide: -12 });
  const m = MELODY[s % MELODY.length];
  if (m !== 0 || s % 8 === 0) {
    tone({ freq: PENTA[m], type: 'triangle', dur: 0.11, at, vol: 0.085 });
    tone({ freq: PENTA[m] * 2, type: 'sine', dur: 0.07, at, vol: 0.03 });
  }
  if (s % 16 === 0) tone({ freq: chord[2] * 4, type: 'sine', dur: 0.5, at, vol: 0.035 });
  if (inBar % 2 === 1) noise({ dur: 0.025, at, vol: 0.022, lowpass: 7000 });
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
