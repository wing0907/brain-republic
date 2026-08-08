// localStorage 세이브 — 공화국 성장 상태 (W4·W5·W6)
import { STORAGE_KEY, BASE_DEPTS, DEPTS_PER_LEVEL } from '../config.js';
import { BUREAUS } from '../data/bureaus.js';

export function freshState() {
  return {
    day: 1,
    coins: 0,
    best: 0,
    levels: Object.fromEntries(BUREAUS.map((b) => [b.id, 1])),
    fame: Object.fromEntries(BUREAUS.map((b) => [b.id, 10])),
    tutorialSeen: false
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const st = { ...freshState(), ...JSON.parse(raw) };
    st.levels = { ...freshState().levels, ...st.levels };
    st.fame = { ...freshState().fame, ...st.fame };
    return st;
  } catch {
    return freshState();
  }
}

export function saveState(st) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  } catch {
    /* 시크릿 모드 등 저장 불가는 무시 */
  }
}

export function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

// 개설 부서 수 (1,428 진행도) — W6
export function deptCount(st) {
  let extra = 0;
  for (const b of BUREAUS) extra += (st.levels[b.id] - 1) * DEPTS_PER_LEVEL;
  return BASE_DEPTS + extra;
}
