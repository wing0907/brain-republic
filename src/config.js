// v2 왕국 키우기 — 밸런스/레이아웃 상수
export const GAME_W = 720;
export const GAME_H = 1280;

export const TOTAL_DEPTS = 1428;      // 원작 설정: 1,428개 부서
export const MAX_LEVEL = 5;
export const DEPTS_PER_BUREAU = TOTAL_DEPTS / 6; // 238

// 경제
export const START_COINS = 300;
export const START_DIAMONDS = 3;
// 국별 초당 수익 = level * INCOME_PER_LEVEL * (0.4 + 0.6 * fame/100)
export const INCOME_PER_LEVEL = 1.2;
export const OFFLINE_CAP_HOURS = 8;

export const FEED_COST = 60;          // 먹이기
export const SLEEP_COST = 60;         // 재우기
export const FEED_GAIN = 34;          // 배부름 +
export const SLEEP_GAIN = 34;         // 컨디션 +
export const upgradeCost = (level) => Math.round(400 * level * level); // lv→lv+1

// 게이지 (0~100). 초당 변화량
export const HUNGER_DECAY = 0.10;     // 배부름 감소
export const ENERGY_DECAY = 0.08;     // 컨디션 감소
// 인지도(등장률): 배부름·컨디션이 모두 60 이상이면 상승, 아니면 하락
export const FAME_RISE = 0.25;
export const FAME_FALL = 0.15;
export const FAME_MINIGAME_BONUS = 22; // 미니게임 성공 시

// 오프라인(방치) — "주인의 뇌에 인식되지 않으면 시민은 살 수 없다"
// 시간당 감소량. 배부름·컨디션이 바닥나면 인지도가 깎이기 시작한다.
export const OFFLINE_HUNGER_PER_H = 7;
export const OFFLINE_ENERGY_PER_H = 6;
export const OFFLINE_FAME_PER_H = 9;      // 배부름·컨디션이 바닥난 뒤부터
export const OFFLINE_DECAY_CAP_H = 48;    // 감소 시뮬레이션 상한
export const DEATH_OFFLINE_HOURS = 12;    // 인지도 0 상태로 이 시간 이상 방치 → 소멸

// 위독/소멸 규칙
// fame 0 → '위독': 해당 국 수익 정지. 돌봄(먹이기/재우기/미니게임)으로 회생 가능.
// 소멸 시: 새 국장 부임, 국 레벨 1로 초기화 (공화국의 세대교체)

// 돌발상황
export const EVENT_MIN_MS = 40000;
export const EVENT_MAX_MS = 70000;
export const EVENT_EXPIRE_MS = 35000;
export const EVENT_IGNORE_FAME_LOSS = 10;
export const EVENT_REWARD_COINS = 220;
export const EVENT_REWARD_MULT = 2;   // 돌발상황 미니게임 보상 배율

// 보상
export const EPISODE_REWARD_COINS = 300;
export const EPISODE_REWARD_DIAMONDS = 1;
export const BUREAU_COMPLETE_DIAMONDS = 5;
export const DIAMOND_BOOST_COST = 3;  // 다이아 부스트: 전 국 게이지 +30

export const STORAGE_KEY = 'brain-republic-save-v2';
