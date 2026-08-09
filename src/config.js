// 부서대전 — 밸런스/물리 상수
export const GAME_W = 720;
export const GAME_H = 1280;

// 전장
export const TERRAIN_TOP = 640;     // 지형 상한
export const TERRAIN_BASE = 1120;   // 평균 지면
export const GRAVITY = 620;         // px/s²
export const WIND_MAX = 90;         // 가속 px/s² (주인님의 변덕)
export const POWER_MAX = 980;       // 발사 속도 상한
export const DRAG_TO_POWER = 2.6;   // 드래그 길이 → 속도 배율

// 전투
export const HP_MAX = 100;
export const DIRECT_DMG = 34;       // 직격
export const SPLASH_RADIUS = 95;    // 폭발 반경
export const SPLASH_DMG = 26;       // 근접 최대 스플래시
export const CRATER_RADIUS = 62;    // 지형 크레이터 반경
export const CRATER_DEPTH = 46;

// 라운드 (AI 정확도: 오차 각도±deg, 파워 오차 비율)
export const ROUNDS = [
  { aimErr: 16, powErr: 0.22 },
  { aimErr: 12, powErr: 0.17 },
  { aimErr: 9, powErr: 0.13 },
  { aimErr: 7, powErr: 0.10 },
  { aimErr: 5, powErr: 0.07 },
  { aimErr: 3.5, powErr: 0.05 }
];

export const BEST_KEY = 'bureau-wars-best';
