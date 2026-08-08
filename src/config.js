// 밸런스/상수 — 근거는 docs/GDD.md, 세계관 매핑은 docs/WORLDBUILDING.md (W#)
export const GAME_W = 720;
export const GAME_H = 1280;

// 하루(러시) — W12. 초반은 짧고 경쾌하게, 갈수록 길고 치열하게
export const DAY_SECONDS_BY_DAY = [60, 75, 90];
export const MAX_DAYS = 3; // 데모 3일차, 이후 무한 반복(난이도 유지)

// 멘탈 (주인의 상태)
export const MENTAL_MAX = 100;
export const MENTAL_TIMEOUT_DMG = [14, 20]; // 민원 폭주
export const MENTAL_RESOLVE_HEAL = 3;
export const MENTAL_WRONG_TAP = 2;          // 엉뚱한 부서 호출

// 협력 콤보 — W1·W10
export const CARD_TIME_MS = [13000, 11000, 9500]; // 일차별 민원 제한시간
export const STEP_MASH = 4;      // 연타 수 (소속국이면 -1)
export const STEP_HOLD_MS = 800;
export const STEP_SWIPE = 100;
export const PLAYER_BUREAU = 'memory'; // P0: 신입은 기억인지국 발령

// 점수/보상 — W4
export const SCORE_STEP = 60;        // 협력 단계 하나 성공
export const SCORE_CARD = 150;       // 민원 완결 기본
export const PERFECT_LIFE = 0.5;     // 남은 시간 50% 이상이면 PERFECT
export const PERFECT_MULT = 1.5;
export const COMBO_STEP = 3;         // 연속 해결 3마다 배율 +1
export const MULT_MAX = 4;
export const COIN_PER_SCORE = 0.5;   // 급여 = 점수 × 0.5

// 명예 시스템 — W5
export const FAME_TOP_GAIN = 14;     // 방송 출연(최다 활약 국)
export const FAME_USED_GAIN = 5;     // 협력 참여 국
export const FAME_MAX = 100;

// 성장 — W6
export const MAX_LEVEL = 3;
export const upgradeCost = (lvl) => 350 * lvl * lvl; // 350, 1400
export const TOTAL_DEPTS = 1428;
export const BASE_DEPTS = 6;
export const DEPTS_PER_LEVEL = 79;   // 국 레벨업당 개설 부서 (6국×2회×79 ≈ 954 진행)

export const STORAGE_KEY = 'brain-republic-rookie-v1';
