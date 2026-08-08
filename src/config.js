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

// 야근 러시 (뇌정부청사 엔드리스 아케이드)
export const COMBO_STEP = 5;   // 콤보 5마다 배율 +1
export const MULT_MAX = 4;
export const RUSH_MENTAL = 100;
export const RUSH_BURST_DMG = [14, 20];
export const RUSH_RESOLVE_HEAL = 1;
export const RUSH_WRONG_DMG = 8;
export const RUSH_KINGDOM_MULT = 0.05;    // 배율 = 1 + 0.05 × Σ국레벨
export const RUSH_COIN_DIV = 8;           // 코인 = 점수/8
export const RUSH_DIAMOND_PER = 5000;     // 점수 5000당 💎1 (최대 3)
export const RUSH_DIAMOND_CAP = 3;
export const RUSH_FAME_BONUS = 8;         // 점수 1500 이상이면 전 국 인지도 +8
export const RUSH_FAME_SCORE = 1500;

// 스파이 색출 (감사실 추리 이벤트)
export const SPY_EVENT_CHANCE = 0.35;     // 돌발상황이 스파이 이벤트일 확률
export const SPY_TIME_MS = 25000;         // 제한 시간
export const SPY_REWARD_COINS = 300;
export const SPY_REWARD_DIAMONDS = 1;
export const SPY_FAIL_FAME_LOSS = 5;      // 실패/도주 시 전 국 인지도 감소

// 퍼즐 제한시간
export const PUZZLE_TIME_MS = 60000;

export const STORAGE_KEY = 'brain-republic-save-v2';

// ---- EP01 「면접 대작전」 — 파일럿 에피소드 아케이드 (v1 복원) ----
export const RUN_SECONDS = 180;
export const MENTAL_MAX = 100;
export const MENTAL_BURST_DAMAGE = [12, 18];
export const MENTAL_RESOLVE_HEAL = 2;
export const MENTAL_WRONG_CHOICE = 6;
export const SCORE_BASE = 100;
export const SCORE_CHOICE = 150;
export const EP01_BEST_KEY = 'brain-republic-ep01-best';

// 웨이브 = 면접 질문 (파일럿 스크립트의 위기 리듬)
export const WAVES = [
  { t: 0, question: '자기소개 부탁드립니다.', spawnEvery: 3400, maxActive: 1, cardLife: 7000,
    weights: { memory: 2, body: 2, emotion: 1, impulse: 1, speech: 0, dream: 1 } },
  { t: 30, question: '지원 동기가 무엇인가요?', spawnEvery: 2600, maxActive: 2, cardLife: 6000,
    weights: { memory: 4, body: 1, emotion: 1, impulse: 2, speech: 1, dream: 1 } },
  { t: 70, question: '갈등 경험을 말해보세요.', spawnEvery: 2100, maxActive: 3, cardLife: 5500,
    weights: { memory: 1, body: 3, emotion: 4, impulse: 1, speech: 2, dream: 1 } },
  { t: 110, question: '본인의 단점은 무엇인가요?', spawnEvery: 1800, maxActive: 3, cardLife: 5000,
    weights: { memory: 1, body: 1, emotion: 2, impulse: 2, speech: 5, dream: 1 } },
  { t: 150, question: '마지막으로 하고 싶은 말 있나요?', spawnEvery: 1400, maxActive: 4, cardLife: 4500,
    weights: { memory: 2, body: 2, emotion: 2, impulse: 2, speech: 2, dream: 2 } }
];

export const GRADES = [
  { min: 14000, grade: 'S', label: '전원 기립 박수! 합격 통보가 도착했습니다.' },
  { min: 10000, grade: 'A', label: '면접관이 미소를 지었습니다. 유력 후보!' },
  { min: 7000, grade: 'B', label: '무난했다… 뇌정부는 안도의 한숨.' },
  { min: 4000, grade: 'C', label: '진땀의 3분. 다음엔 더 잘할 수 있어요.' },
  { min: 0, grade: 'F', label: '"다음 기회에…" 뇌정부 비상 감사 착수.' }
];
