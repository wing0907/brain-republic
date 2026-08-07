// WebAudio 신스 SFX — 외부 사운드 에셋 없이 전량 코드 생성.
// 모바일 브라우저 정책상 첫 사용자 제스처에서 unlock() 필요.

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

// ---- 게임 SFX ----

export const sfx = {
  // 위기 카드 등장: 짧은 2음 사이렌
  siren() {
    tone({ freq: 660, type: 'square', dur: 0.09, vol: 0.12 });
    tone({ freq: 520, type: 'square', dur: 0.09, at: 0.1, vol: 0.12 });
  },
  // 해결: 결재 도장 쾅
  stamp() {
    noise({ dur: 0.08, vol: 0.3, lowpass: 1200 });
    tone({ freq: 130, type: 'sine', dur: 0.16, vol: 0.4, slide: -60 });
  },
  // 폭주: 서류 찢김 + 하강음
  burst() {
    noise({ dur: 0.3, vol: 0.3, lowpass: 2500 });
    tone({ freq: 320, type: 'sawtooth', dur: 0.35, vol: 0.2, slide: -220 });
  },
  // 콤보 차임 (단계별 상승)
  chime(step = 0) {
    const base = 520 * Math.pow(1.12, Math.min(step, 8));
    tone({ freq: base, type: 'triangle', dur: 0.1, vol: 0.15 });
    tone({ freq: base * 1.5, type: 'triangle', dur: 0.12, at: 0.06, vol: 0.12 });
  },
  // 연타 탭
  tap() {
    tone({ freq: 880, type: 'triangle', dur: 0.04, vol: 0.1 });
  },
  // 홀드 진행 톤
  holdTick(p = 0) {
    tone({ freq: 300 + 400 * p, type: 'sine', dur: 0.05, vol: 0.07 });
  },
  // 오답
  wrong() {
    tone({ freq: 220, type: 'square', dur: 0.15, vol: 0.2 });
    tone({ freq: 185, type: 'square', dur: 0.2, at: 0.12, vol: 0.2 });
  },
  // 웨이브(질문) 전환
  wave() {
    tone({ freq: 440, type: 'sine', dur: 0.12, vol: 0.15 });
    tone({ freq: 587, type: 'sine', dur: 0.12, at: 0.12, vol: 0.15 });
    tone({ freq: 784, type: 'sine', dur: 0.2, at: 0.24, vol: 0.15 });
  },
  // 게임 시작
  start() {
    [392, 523, 659, 784].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.12, at: i * 0.08, vol: 0.15 }));
  },
  // 성공 팡파레
  fanfare() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.25, at: i * 0.13, vol: 0.2 }));
    noise({ dur: 0.5, at: 0.5, vol: 0.1, lowpass: 6000 });
  },
  // 멘탈 붕괴
  gameover() {
    [392, 330, 262, 196].forEach((f, i) => tone({ freq: f, type: 'sawtooth', dur: 0.3, at: i * 0.18, vol: 0.18 }));
  }
};
