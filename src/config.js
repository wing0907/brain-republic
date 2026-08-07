// 게임 밸런스/레이아웃 상수
export const GAME_W = 720;
export const GAME_H = 1280;

export const RUN_SECONDS = 180;

export const MENTAL_MAX = 100;
export const MENTAL_BURST_DAMAGE = [12, 18]; // min, max
export const MENTAL_RESOLVE_HEAL = 2;
export const MENTAL_WRONG_CHOICE = 6;

export const COMBO_STEP = 5;   // 콤보 5마다 배율 +1
export const MULT_MAX = 4;

export const SCORE_BASE = 100;
export const SCORE_CHOICE = 150;

// 웨이브 = 면접 질문. t: 시작 초, spawnEvery: 스폰 간격(ms),
// maxActive: 동시 활성 카드 상한, cardLife: 카드 타이머(ms), weights: 국별 가중치
export const WAVES = [
  {
    t: 0,
    question: '자기소개 부탁드립니다.',
    spawnEvery: 3400,
    maxActive: 1,
    cardLife: 7000,
    weights: { memory: 2, body: 2, emotion: 1, impulse: 1, speech: 0, dream: 1 }
  },
  {
    t: 30,
    question: '지원 동기가 무엇인가요?',
    spawnEvery: 2600,
    maxActive: 2,
    cardLife: 6000,
    weights: { memory: 4, body: 1, emotion: 1, impulse: 2, speech: 1, dream: 1 }
  },
  {
    t: 70,
    question: '갈등 경험을 말해보세요.',
    spawnEvery: 2100,
    maxActive: 3,
    cardLife: 5500,
    weights: { memory: 1, body: 3, emotion: 4, impulse: 1, speech: 2, dream: 1 }
  },
  {
    t: 110,
    question: '본인의 단점은 무엇인가요?',
    spawnEvery: 1800,
    maxActive: 3,
    cardLife: 5000,
    weights: { memory: 1, body: 1, emotion: 2, impulse: 2, speech: 5, dream: 1 }
  },
  {
    t: 150,
    question: '마지막으로 하고 싶은 말 있나요?',
    spawnEvery: 1400,
    maxActive: 4,
    cardLife: 4500,
    weights: { memory: 2, body: 2, emotion: 2, impulse: 2, speech: 2, dream: 2 }
  }
];

// 등급 컷 (점수 기준, 멘탈 잔량 보너스 포함 최종점)
export const GRADES = [
  { min: 14000, grade: 'S', label: '전원 기립 박수! 합격 통보가 도착했습니다.' },
  { min: 10000, grade: 'A', label: '면접관이 미소를 지었습니다. 유력 후보!' },
  { min: 7000, grade: 'B', label: '무난했다… 뇌정부는 안도의 한숨.' },
  { min: 4000, grade: 'C', label: '진땀의 3분. 다음엔 더 잘할 수 있어요.' },
  { min: 0, grade: 'F', label: '"다음 기회에…" 뇌정부 비상 감사 착수.' }
];

export const STORAGE_KEY = 'brain-republic-best';
