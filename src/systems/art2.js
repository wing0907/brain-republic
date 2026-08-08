// v2 프로시저럴 아트 — 아이소메트릭 왕국(공화국) 텍스처.
// 외부 에셋 없이 전량 코드 드로잉. 원작 아트 가이드(뇌 주름 지형, 노을빛 톤) 반영.

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { BUREAUS } from '../data/bureaus.js';

export function generateKingdomTextures(scene) {
  makeIsoGround(scene);
  for (const b of BUREAUS) {
    makeBuildings(scene, b);
    makeCreatures(scene, b);
    makeEmblem(scene, b);
  }
  makeGovBuilding(scene);
  makeIcons(scene);
}

// ---------- 뇌정부청사: 지도 중앙의 관청 (야근 러시 입구) ----------
function makeGovBuilding(scene) {
  const W = 200;
  const H = 200;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const cx = W / 2;
  const baseY = H - 28;
  const half = 86;
  const fh = 30;
  const floors = 3;

  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(cx, baseY + 10, 165, 34);

  for (let f = 0; f < floors; f++) {
    const y = baseY - f * fh;
    const topY = y - fh;
    const wf = 1 - f * 0.1;
    const hw = half * wf;
    const hh = hw * 0.5;
    g.fillStyle(0x4a3a68, 1);
    g.fillPoints(
      [
        { x: cx - hw, y: topY },
        { x: cx, y: topY + hh },
        { x: cx, y: y + hh },
        { x: cx - hw, y: y }
      ],
      true
    );
    g.fillStyle(0x5d4a82, 1);
    g.fillPoints(
      [
        { x: cx + hw, y: topY },
        { x: cx, y: topY + hh },
        { x: cx, y: y + hh },
        { x: cx + hw, y: y }
      ],
      true
    );
    // 야근 중인 창문 불빛 (금색)
    for (let wIdx = 0; wIdx < 3; wIdx++) {
      g.fillStyle(0xffd9a0, 0.95);
      g.fillRect(cx - hw * 0.7 + wIdx * hw * 0.28, topY + hh * 0.62, 8, 11);
      g.fillRect(cx + hw * 0.2 + wIdx * hw * 0.24, topY + hh * 0.62, 8, 11);
    }
  }

  // 지붕 + 금색 돔
  const roofY = baseY - floors * fh;
  const hwTop = half * (1 - (floors - 1) * 0.1);
  const hhTop = hwTop * 0.5;
  g.fillStyle(0x6f5a9c, 1);
  g.fillPoints(
    [
      { x: cx, y: roofY - hhTop },
      { x: cx + hwTop, y: roofY },
      { x: cx, y: roofY + hhTop },
      { x: cx - hwTop, y: roofY }
    ],
    true
  );
  g.lineStyle(2, 0xffd9a0, 0.9);
  g.strokePoints(
    [
      { x: cx, y: roofY - hhTop },
      { x: cx + hwTop, y: roofY },
      { x: cx, y: roofY + hhTop },
      { x: cx - hwTop, y: roofY }
    ],
    true,
    true
  );
  g.fillStyle(0xf0c541, 1);
  g.fillCircle(cx, roofY - hhTop - 12, 14);
  g.fillStyle(0xffe9a0, 1);
  g.fillCircle(cx - 4, roofY - hhTop - 16, 5);
  g.lineStyle(3, 0xd8cfec, 1);
  g.lineBetween(cx, roofY - hhTop - 26, cx, roofY - hhTop - 44);
  g.fillStyle(0xe8565e, 1);
  g.fillTriangle(cx, roofY - hhTop - 44, cx + 20, roofY - hhTop - 38, cx, roofY - hhTop - 32);

  g.generateTexture('bld-gov', W, H);
  g.destroy();
}

function shade(color, f) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  return Phaser.Display.Color.GetColor(
    Phaser.Math.Clamp(Math.floor(c.red * f), 0, 255),
    Phaser.Math.Clamp(Math.floor(c.green * f), 0, 255),
    Phaser.Math.Clamp(Math.floor(c.blue * f), 0, 255)
  );
}

// ---------- 지형: 아이소 뇌 대륙 (도트 버전) ----------
function makeIsoGround(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const PIX = 6;
  const CW = GAME_W / PIX; // 120
  const CH = Math.ceil(GAME_H / PIX);
  g.fillStyle(0x12081f, 1);
  g.fillRect(0, 0, GAME_W, GAME_H);

  const rnd = new Phaser.Math.RandomDataGenerator(['brain-kingdom-pixel']);
  const cell = (color, alpha, x, y, w = 1, h = 1) => {
    g.fillStyle(color, alpha);
    g.fillRect(x * PIX, y * PIX, w * PIX, h * PIX);
  };

  // 노을 디더 (상단)
  for (let y = 0; y < 70; y++) {
    for (let x = 0; x < CW; x++) {
      const d = Math.hypot(x - CW / 2, (y - 44) * 1.2);
      if (d < 30 && (x + y) % 2 === 0) cell(0xff9a5e, 0.12, x, y);
      else if (d < 42 && (x + y) % 3 === 0) cell(0xffc98a, 0.07, x, y);
    }
  }

  // 아이소 다이아몬드 대륙 (셀 판정) + 측면 두께
  const cx = CW / 2;
  const cy = 110; // 660/6
  const rw = 57;  // 340/6
  const rh = 72;  // 430/6
  for (let y = 0; y < CH; y++) {
    for (let x = 0; x < CW; x++) {
      const d = Math.abs(x - cx) / rw + Math.abs(y - cy) / rh;
      if (d <= 1) {
        cell(0x4a2c50, 1, x, y);
        if (d > 0.94) cell(0x5d3a63, 1, x, y); // 가장자리 밝은 림
      } else if (d <= 1.07 && y > cy) {
        cell(x < cx ? 0x2b1836 : 0x241329, 1, x, y); // 측면 두께
      }
    }
  }

  // 뇌 주름 능선 (대륙 위 도트 지그재그)
  for (let i = 0; i < 9; i++) {
    let y = cy - rh + 14 + Math.floor((i + rnd.frac()) * ((rh * 2 - 28) / 9));
    const alpha = 0.12 + rnd.frac() * 0.1;
    const halfW = Math.max(8, rw * (1 - Math.abs(y - cy) / rh) - 4);
    let x = Math.floor(cx - halfW);
    while (x < cx + halfW) {
      const len = rnd.between(3, 7);
      cell(0xff9a5e, alpha, x, y, Math.min(len, Math.floor(cx + halfW - x)), 2);
      x += len + 1;
      y = Phaser.Math.Clamp(y + rnd.between(-1, 1), cy - rh + 6, cy + rh - 6);
    }
  }

  // 반딧불이
  for (let i = 0; i < 50; i++) {
    cell(0xffe9a0, 0.12 + rnd.frac() * 0.3, rnd.between(2, CW - 3), rnd.between(20, CH - 8));
  }

  g.generateTexture('kingdom-ground', GAME_W, GAME_H);
  g.destroy();
}

// ---------- 건물: 국별 × 레벨(1~5)층 아이소 청사 ----------
function makeBuildings(scene, b) {
  const W = 170; // 텍스처 폭
  const half = 70; // 지붕 다이아 반폭
  const fh = 26; // 층 높이
  for (let lvl = 1; lvl <= 5; lvl++) {
    const H = 84 + fh * lvl;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const cx = W / 2;
    const baseY = H - 26;

    // 바닥 그림자
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, baseY + 10, 130, 30);

    // 층 쌓기 (아래→위)
    for (let f = 0; f < lvl; f++) {
      const y = baseY - f * fh;
      const topY = y - fh;
      const wf = 1 - f * 0.06; // 위로 갈수록 살짝 좁게
      const hw = half * wf;
      const hh = hw * 0.5;
      // 왼쪽 면
      g.fillStyle(shade(b.color, 0.45), 1);
      g.fillPoints(
        [
          { x: cx - hw, y: topY },
          { x: cx, y: topY + hh },
          { x: cx, y: y + hh },
          { x: cx - hw, y: y }
        ],
        true
      );
      // 오른쪽 면
      g.fillStyle(shade(b.color, 0.62), 1);
      g.fillPoints(
        [
          { x: cx + hw, y: topY },
          { x: cx, y: topY + hh },
          { x: cx, y: y + hh },
          { x: cx + hw, y: y }
        ],
        true
      );
      // 창문 불빛
      g.fillStyle(0xffe9a0, 0.85);
      g.fillRect(cx - hw * 0.55, topY + hh * 0.7, 7, 9);
      g.fillRect(cx + hw * 0.35, topY + hh * 0.7, 7, 9);
    }

    // 지붕 (다이아)
    const roofY = baseY - lvl * fh;
    const hwTop = half * (1 - (lvl - 1) * 0.06);
    const hhTop = hwTop * 0.5;
    g.fillStyle(shade(b.color, 1.0), 1);
    g.fillPoints(
      [
        { x: cx, y: roofY - hhTop },
        { x: cx + hwTop, y: roofY },
        { x: cx, y: roofY + hhTop },
        { x: cx - hwTop, y: roofY }
      ],
      true
    );
    g.lineStyle(2, b.accent, 0.9);
    g.strokePoints(
      [
        { x: cx, y: roofY - hhTop },
        { x: cx + hwTop, y: roofY },
        { x: cx, y: roofY + hhTop },
        { x: cx - hwTop, y: roofY }
      ],
      true,
      true
    );
    // 깃발
    g.lineStyle(3, 0xd8cfec, 1);
    g.lineBetween(cx, roofY - hhTop, cx, roofY - hhTop - 22);
    g.fillStyle(b.accent, 1);
    g.fillTriangle(cx, roofY - hhTop - 22, cx + 18, roofY - hhTop - 16, cx, roofY - hhTop - 10);

    g.generateTexture(`bld-${b.id}-${lvl}`, W, H);
    g.destroy();
  }
}

// ---------- 크리처(국장): 성장 3단계 ----------
function makeCreatures(scene, b) {
  for (let stage = 1; stage <= 3; stage++) {
    const S = 120 + stage * 18; // 텍스처 크기
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const cx = S / 2;
    const cy = S / 2 + 8;
    const r = 34 + stage * 7; // 몸통 반지름

    const translucent = b.id === 'emotion' || b.id === 'dream';
    const bodyAlpha = translucent ? 0.82 : 1;

    // 그림자
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(cx, cy + r * 0.95, r * 1.7, r * 0.5);

    // 종족 특징 (몸통 뒤에 그릴 것): 기억=큰 귀, 언어=안테나 귀
    if (b.id === 'memory') {
      g.fillStyle(shade(b.color, 0.85), bodyAlpha);
      g.fillEllipse(cx - r * 0.85, cy - r * 0.9, r * 0.7, r * 1.0);
      g.fillEllipse(cx + r * 0.85, cy - r * 0.9, r * 0.7, r * 1.0);
    } else if (b.id === 'speech') {
      g.lineStyle(5, shade(b.color, 0.8), 1);
      g.lineBetween(cx - r * 0.5, cy - r * 0.8, cx - r * 0.75, cy - r * 1.6);
      g.lineBetween(cx + r * 0.5, cy - r * 0.8, cx + r * 0.75, cy - r * 1.6);
      g.fillStyle(b.accent, 1);
      g.fillCircle(cx - r * 0.75, cy - r * 1.6, 6 + stage);
      g.fillCircle(cx + r * 0.75, cy - r * 1.6, 6 + stage);
    }

    // 몸통 (동글동글)
    g.fillStyle(b.color, bodyAlpha);
    g.fillCircle(cx, cy, r);
    g.fillEllipse(cx, cy + r * 0.45, r * 1.6, r * 0.9);
    // 배 하이라이트
    g.fillStyle(b.accent, translucent ? 0.5 : 0.65);
    g.fillEllipse(cx, cy + r * 0.4, r * 0.9, r * 0.6);

    // 종족 무늬
    if (b.id === 'memory') {
      // 나이테 호
      g.lineStyle(3, shade(b.color, 0.6), 0.9);
      g.beginPath();
      g.arc(cx - r * 0.35, cy - r * 0.1, r * 0.28, 0, Math.PI * 1.5);
      g.strokePath();
      g.beginPath();
      g.arc(cx - r * 0.35, cy - r * 0.1, r * 0.16, 0, Math.PI * 1.2);
      g.strokePath();
    } else if (b.id === 'body') {
      // 덩굴 힘줄
      g.lineStyle(3, shade(b.color, 0.55), 0.9);
      g.beginPath();
      g.moveTo(cx - r * 0.7, cy + r * 0.5);
      g.lineTo(cx - r * 0.3, cy);
      g.lineTo(cx - r * 0.5, cy - r * 0.5);
      g.strokePath();
      g.beginPath();
      g.moveTo(cx + r * 0.7, cy + r * 0.4);
      g.lineTo(cx + r * 0.35, cy - r * 0.1);
      g.strokePath();
    } else if (b.id === 'impulse') {
      // 발광 돌기
      for (const [dx, dy] of [[-0.6, -0.5], [0.65, -0.35], [0.15, -0.85], [-0.3, 0.6], [0.55, 0.55]]) {
        g.fillStyle(b.accent, 1);
        g.fillCircle(cx + r * dx, cy + r * dy, 4 + stage);
      }
    } else if (b.id === 'dream') {
      // 반딧불이 점
      for (const [dx, dy] of [[-0.5, -0.4], [0.5, -0.55], [0.1, 0.5], [-0.55, 0.45], [0.6, 0.2]]) {
        g.fillStyle(0xfff3b0, 0.95);
        g.fillCircle(cx + r * dx, cy + r * dy, 2.5 + stage * 0.8);
      }
    }

    // 눈 (크고 순함)
    const eyeY = cy - r * 0.15;
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - r * 0.38, eyeY, r * 0.2);
    g.fillCircle(cx + r * 0.38, eyeY, r * 0.2);
    g.fillStyle(0x241329, 1);
    g.fillCircle(cx - r * 0.34, eyeY + 1, r * 0.1);
    g.fillCircle(cx + r * 0.42, eyeY + 1, r * 0.1);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx - r * 0.31, eyeY - 2, r * 0.035);
    g.fillCircle(cx + r * 0.45, eyeY - 2, r * 0.035);
    // 볼터치 + 입
    g.fillStyle(0xff8a8a, translucent ? 0.4 : 0.5);
    g.fillCircle(cx - r * 0.62, cy + r * 0.12, r * 0.1);
    g.fillCircle(cx + r * 0.62, cy + r * 0.12, r * 0.1);
    g.lineStyle(3, 0x241329, 0.9);
    g.beginPath();
    g.arc(cx, cy + r * 0.18, r * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
    g.strokePath();

    // 성장 단계 장식: 2단계=명찰, 3단계=왕관
    if (stage >= 2) {
      g.fillStyle(0xfff6e3, 1);
      g.fillRoundedRect(cx + r * 0.25, cy + r * 0.45, 26, 14, 3);
      g.lineStyle(2, shade(b.color, 0.6), 1);
      g.strokeRoundedRect(cx + r * 0.25, cy + r * 0.45, 26, 14, 3);
    }
    if (stage >= 3) {
      const crownY = b.id === 'speech' ? cy - r * 1.15 : cy - r * 1.05;
      g.fillStyle(0xf0c541, 1);
      g.fillPoints(
        [
          { x: cx - 20, y: crownY },
          { x: cx - 20, y: crownY - 16 },
          { x: cx - 10, y: crownY - 7 },
          { x: cx, y: crownY - 18 },
          { x: cx + 10, y: crownY - 7 },
          { x: cx + 20, y: crownY - 16 },
          { x: cx + 20, y: crownY }
        ],
        true
      );
    }

    g.generateTexture(`pet-${b.id}-${stage}`, S, S);
    g.destroy();
  }
}

// ---------- 문장(紋章): 퍼즐 원판 (240×240, 3×3 조각용) ----------
function makeEmblem(scene, b) {
  const S = 240;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const cx = S / 2;
  const cy = S / 2;

  // 바탕: 국 색 라운드 + 방사 장식
  g.fillStyle(shade(b.color, 0.35), 1);
  g.fillRoundedRect(0, 0, S, S, 26);
  g.lineStyle(6, b.color, 1);
  g.strokeRoundedRect(3, 3, S - 6, S - 6, 24);
  g.lineStyle(2, b.accent, 0.5);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.lineBetween(cx + Math.cos(a) * 70, cy + Math.sin(a) * 70, cx + Math.cos(a) * 108, cy + Math.sin(a) * 108);
  }
  g.fillStyle(shade(b.color, 0.55), 1);
  g.fillCircle(cx, cy, 74);
  g.lineStyle(4, b.accent, 0.9);
  g.strokeCircle(cx, cy, 74);

  // 국별 심볼
  g.fillStyle(b.accent, 1);
  g.lineStyle(7, b.accent, 1);
  if (b.id === 'memory') {
    // 펼친 고서
    g.fillRoundedRect(cx - 46, cy - 26, 44, 56, 6);
    g.fillRoundedRect(cx + 2, cy - 26, 44, 56, 6);
    g.lineStyle(3, shade(b.color, 0.4), 1);
    for (let i = 0; i < 3; i++) {
      g.lineBetween(cx - 36, cy - 12 + i * 14, cx - 12, cy - 12 + i * 14);
      g.lineBetween(cx + 12, cy - 12 + i * 14, cx + 36, cy - 12 + i * 14);
    }
  } else if (b.id === 'body') {
    // 심전도 파형
    g.beginPath();
    g.moveTo(cx - 52, cy);
    g.lineTo(cx - 22, cy);
    g.lineTo(cx - 10, cy - 34);
    g.lineTo(cx + 6, cy + 30);
    g.lineTo(cx + 16, cy);
    g.lineTo(cx + 52, cy);
    g.strokePath();
  } else if (b.id === 'emotion') {
    // 물방울
    g.fillTriangle(cx, cy - 44, cx - 30, cy + 8, cx + 30, cy + 8);
    g.fillCircle(cx, cy + 10, 30);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(cx - 10, cy + 4, 9);
  } else if (b.id === 'impulse') {
    // 번개
    g.fillPoints(
      [
        { x: cx + 6, y: cy - 46 },
        { x: cx - 26, y: cy + 6 },
        { x: cx - 4, y: cy + 6 },
        { x: cx - 12, y: cy + 46 },
        { x: cx + 26, y: cy - 8 },
        { x: cx + 2, y: cy - 8 }
      ],
      true
    );
  } else if (b.id === 'speech') {
    // 말풍선
    g.fillRoundedRect(cx - 42, cy - 34, 84, 54, 16);
    g.fillTriangle(cx - 12, cy + 18, cx + 6, cy + 18, cx - 16, cy + 40);
    g.fillStyle(shade(b.color, 0.55), 1);
    g.fillCircle(cx - 20, cy - 7, 5);
    g.fillCircle(cx, cy - 7, 5);
    g.fillCircle(cx + 20, cy - 7, 5);
  } else if (b.id === 'dream') {
    // 초승달 + 별
    g.fillCircle(cx - 4, cy, 36);
    g.fillStyle(shade(b.color, 0.55), 1);
    g.fillCircle(cx + 12, cy - 8, 30);
    g.fillStyle(b.accent, 1);
    star(g, cx + 30, cy + 26, 5, 10, 5);
    star(g, cx + 40, cy - 30, 5, 7, 3.5);
  }

  g.generateTexture(`emblem-${b.id}`, S, S);
  g.destroy();
}

function star(g, cx, cy, points, outer, inner) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  g.fillPoints(pts, true);
}

// ---------- 아이콘: 코인/다이아/밥/잠/경보 ----------
function makeIcons(scene) {
  // 코인 (뇌화 ₿ 느낌의 B)
  let g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xb8860b, 1);
  g.fillCircle(24, 26, 20);
  g.fillStyle(0xf0c541, 1);
  g.fillCircle(24, 22, 20);
  g.lineStyle(3, 0xb8860b, 1);
  g.strokeCircle(24, 22, 14);
  g.generateTexture('ic-coin', 48, 48);
  g.destroy();

  // 다이아
  g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x53c2d4, 1);
  g.fillPoints(
    [
      { x: 12, y: 14 },
      { x: 36, y: 14 },
      { x: 46, y: 24 },
      { x: 24, y: 46 },
      { x: 2, y: 24 }
    ],
    true
  );
  g.fillStyle(0xa8f0f8, 0.9);
  g.fillTriangle(12, 14, 36, 14, 24, 26);
  g.generateTexture('ic-diamond', 48, 48);
  g.destroy();

  // 밥그릇
  g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xfff6e3, 1);
  g.fillEllipse(24, 30, 38, 22);
  g.fillStyle(0xe86a5e, 1);
  g.fillEllipse(24, 24, 34, 14);
  g.fillStyle(0xfff6e3, 1);
  g.fillCircle(16, 22, 5);
  g.fillCircle(26, 20, 5);
  g.fillCircle(33, 24, 4);
  g.generateTexture('ic-food', 48, 48);
  g.destroy();

  // 잠 (달+Z)
  g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xb9c2ff, 1);
  g.fillCircle(22, 26, 16);
  g.fillStyle(0x12081f, 1);
  g.fillCircle(29, 22, 13);
  g.fillStyle(0xb9c2ff, 1);
  g.fillRect(30, 8, 12, 3);
  g.fillRect(30, 15, 12, 3);
  g.fillTriangle(42, 8, 30, 15, 36, 15);
  g.generateTexture('ic-sleep', 48, 48);
  g.destroy();

  // 경보(!)
  g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xe8565e, 1);
  g.fillTriangle(24, 2, 46, 42, 2, 42);
  g.fillStyle(0xfff6e3, 1);
  g.fillRoundedRect(21, 14, 6, 16, 3);
  g.fillCircle(24, 36, 3.5);
  g.generateTexture('ic-alert', 48, 48);
  g.destroy();

  // 하트 (인지도)
  g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xff8aa0, 1);
  g.fillCircle(15, 18, 12);
  g.fillCircle(33, 18, 12);
  g.fillTriangle(4, 24, 44, 24, 24, 44);
  g.generateTexture('ic-heart', 48, 48);
  g.destroy();
}
