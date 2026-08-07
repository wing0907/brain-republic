// localStorage 세이브 — 왕국 키우기 상태 영속화 + 방치(오프라인) 수익 계산
import {
  STORAGE_KEY,
  START_COINS,
  START_DIAMONDS,
  INCOME_PER_LEVEL,
  OFFLINE_CAP_HOURS,
  OFFLINE_HUNGER_PER_H,
  OFFLINE_ENERGY_PER_H,
  OFFLINE_FAME_PER_H,
  OFFLINE_DECAY_CAP_H,
  DEATH_OFFLINE_HOURS
} from '../config.js';
import { BUREAUS } from '../data/bureaus.js';

function freshBureau() {
  return {
    level: 1,
    hunger: 70,   // 배부름
    energy: 70,   // 컨디션
    fame: 30,     // 인지도(등장률) — 원작 명예 시스템
    episode: 0,   // 진행한 에피소드 수 (0~3)
    complete: false
  };
}

export function freshState() {
  return {
    coins: START_COINS,
    diamonds: START_DIAMONDS,
    bureaus: Object.fromEntries(BUREAUS.map((b) => [b.id, freshBureau()])),
    lastTick: Date.now(),
    tutorialSeen: false,
    kingdomComplete: false
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: freshState(), offline: null };
    const state = { ...freshState(), ...JSON.parse(raw) };
    // 구조 보정 (버전업 대비)
    for (const b of BUREAUS) {
      state.bureaus[b.id] = { ...freshBureau(), ...(state.bureaus[b.id] || {}) };
    }
    const offline = applyOffline(state);
    return { state, offline };
  } catch {
    return { state: freshState(), offline: null };
  }
}

export function saveState(state) {
  state.lastTick = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 저장 불가 환경(시크릿 모드 등)은 무시 */
  }
}

export function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

// 초당 총 수익 (fame이 높을수록 배율 ↑ — "자주 등장할수록 공화국이 윤택해진다")
// 위독(fame 0) 국은 수익을 내지 못한다.
export function incomePerSec(state) {
  let sum = 0;
  for (const b of BUREAUS) {
    const s = state.bureaus[b.id];
    if (s.fame <= 0) continue;
    sum += s.level * INCOME_PER_LEVEL * (0.4 + 0.6 * (s.fame / 100));
  }
  return sum;
}

// 실시간 틱: 접속 중 게이지 자연 감소 + 수익 누적.
// 배부름·컨디션이 넉넉하면 인지도(=수명)가 차오르고, 바닥나면 깎인다.
export function tickRealtime(state, dtSec, cfg) {
  const { HUNGER_DECAY, ENERGY_DECAY, FAME_RISE, FAME_FALL } = cfg;
  for (const b of BUREAUS) {
    const s = state.bureaus[b.id];
    s.hunger = Math.max(0, s.hunger - HUNGER_DECAY * dtSec);
    s.energy = Math.max(0, s.energy - ENERGY_DECAY * dtSec);
    if (s.hunger >= 60 && s.energy >= 60) {
      s.fame = Math.min(100, s.fame + FAME_RISE * dtSec);
    } else if (s.hunger <= 20 || s.energy <= 20) {
      s.fame = Math.max(0, s.fame - FAME_FALL * dtSec);
    }
  }
  state.coins += incomePerSec(state) * dtSec;
}

// 방치 정산: "주인의 뇌에 인식되지 않는 시간"만큼 시민들이 지쳐간다.
// - 수익: 이탈 시점의 인지도 기준 50% 효율 (최대 OFFLINE_CAP_HOURS)
// - 게이지: 배부름/컨디션 감소 → 둘 다 바닥나면 인지도 감소
// - 인지도 0으로 DEATH_OFFLINE_HOURS 이상 방치된 국은 국장이 소멸하고
//   새 국장이 부임하며 레벨 1로 초기화된다.
function applyOffline(state) {
  const now = Date.now();
  const rawSec = Math.max(0, (now - (state.lastTick || now)) / 1000);
  if (rawSec < 30) {
    state.lastTick = now;
    return null;
  }

  const earnSec = Math.min(rawSec, OFFLINE_CAP_HOURS * 3600);
  const earned = Math.floor(incomePerSec(state) * earnSec * 0.5);
  state.coins += earned;

  const decayH = Math.min(rawSec / 3600, OFFLINE_DECAY_CAP_H);
  const deaths = [];
  for (const b of BUREAUS) {
    const s = state.bureaus[b.id];
    s.hunger = Math.max(0, s.hunger - OFFLINE_HUNGER_PER_H * decayH);
    s.energy = Math.max(0, s.energy - OFFLINE_ENERGY_PER_H * decayH);
    // 굶고 지친 시간만큼 인지도가 깎인다 (근사: 남는 감쇠 시간 비례)
    const starvedH = Math.max(
      0,
      decayH - Math.min(s.hunger / OFFLINE_HUNGER_PER_H, s.energy / OFFLINE_ENERGY_PER_H)
    );
    if (starvedH > 0) s.fame = Math.max(0, s.fame - OFFLINE_FAME_PER_H * starvedH);

    // 소멸 판정: 인지도가 0까지 떨어지고도 한참 방치된 경우
    const famelessH = s.fame <= 0 ? starvedH - s.fame / OFFLINE_FAME_PER_H : 0;
    if (s.fame <= 0 && famelessH >= DEATH_OFFLINE_HOURS) {
      deaths.push(b.id);
      s.level = 1;
      s.hunger = 60;
      s.energy = 60;
      s.fame = 25;
      s.complete = false;
    }
  }

  state.lastTick = now;
  return { seconds: Math.floor(rawSec), earned, deaths };
}
