// 프로시저럴 픽셀아트 — 6px 셀 스냅, 외부 이미지 에셋 0.
// 팔레트: 노을빛 오렌지-핑크 기조 (W14), 국별 고유색 (W9).

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { BUREAUS } from '../data/bureaus.js';

const PIX = 6;

function cell(g, color, alpha, cx, cy, cw = 1, ch = 1) {
  g.fillStyle(color, alpha);
  g.fillRect(cx * PIX, cy * PIX, cw * PIX, ch * PIX);
}

function pxPanel(g, color, alpha, cw, chh, notch = 2) {
  g.fillStyle(color, alpha);
  for (let y = 0; y < chh; y++) {
    let inset = 0;
    if (y < notch) inset = notch - y;
    else if (y >= chh - notch) inset = y - (chh - 1 - notch);
    g.fillRect(inset * PIX, y * PIX, (cw - inset * 2) * PIX, PIX);
  }
}

function pxFrame(g, color, alpha, cw, chh, notch = 2) {
  g.fillStyle(color, alpha);
  for (let y = 0; y < chh; y++) {
    let inset = 0;
    if (y < notch) inset = notch - y;
    else if (y >= chh - notch) inset = y - (chh - 1 - notch);
    if (y === 0 || y === chh - 1 || y === notch - 1 || y === chh - notch) {
      g.fillRect(inset * PIX, y * PIX, (cw - inset * 2) * PIX, PIX);
    } else {
      g.fillRect(inset * PIX, y * PIX, PIX, PIX);
      g.fillRect((cw - inset - 1) * PIX, y * PIX, PIX, PIX);
    }
  }
}

function shade(color, f) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  return Phaser.Display.Color.GetColor(
    Phaser.Math.Clamp(Math.floor(c.red * f), 0, 255),
    Phaser.Math.Clamp(Math.floor(c.green * f), 0, 255),
    Phaser.Math.Clamp(Math.floor(c.blue * f), 0, 255)
  );
}

export function generateTextures(scene) {
  makeSky(scene);
  makeGround(scene);
  for (const b of BUREAUS) {
    makeBuilding(scene, b);
    makeCitizen(scene, b);
    makeChip(scene, b);
  }
  makeHall(scene);
  makePlayer(scene);
  makeCard(scene);
  makeButtons(scene);
  makeParticle(scene);
}

// ---- 배경: 노을 하늘 (720×1280) ----
function makeSky(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const CW = GAME_W / PIX;
  const CH = Math.ceil(GAME_H / PIX);
  // 세로 그라데이션 밴드 (밤보라 → 노을 오렌지-핑크)
  const bands = [
    { until: 0.3, c: 0x12081f },
    { until: 0.52, c: 0x241333 },
    { until: 0.68, c: 0x4a2245 },
    { until: 0.8, c: 0x8a3a55 },
    { until: 0.9, c: 0xd4645e },
    { until: 0.97, c: 0xff9a5e },
    { until: 1.01, c: 0xffc98a }
  ];
  const pick = (t) => bands.find((bd) => t < bd.until).c;
  for (let y = 0; y < CH; y++) {
    g.fillStyle(pick(y / CH), 1);
    g.fillRect(0, y * PIX, GAME_W, PIX);
  }
  // 디더 경계 (다음 밴드 색을 격자로 섞기)
  const rnd = new Phaser.Math.RandomDataGenerator(['sky']);
  for (let y = 1; y < CH; y++) {
    const c = pick(Math.min(1, y / CH + 0.03));
    for (let x = 0; x < CW; x++) if ((x + y) % 2 === 0 && rnd.frac() < 0.5) cell(g, c, 1, x, y);
  }
  // 별 (상단)
  for (let i = 0; i < 40; i++) {
    cell(g, 0xffe9a0, 0.2 + rnd.frac() * 0.4, rnd.between(0, CW - 1), rnd.between(0, Math.floor(CH * 0.4)));
  }
  // 해
  for (let dy = -5; dy <= 5; dy++)
    for (let dx = -5; dx <= 5; dx++)
      if (dx * dx + dy * dy <= 25) cell(g, 0xfff3d0, 1, Math.floor(CW * 0.72) + dx, Math.floor(CH * 0.62) + dy);
  g.generateTexture('sky', GAME_W, GAME_H);
  g.destroy();
}

// ---- 지면 (도시 바닥 스트립, 720×360) ----
function makeGround(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const CW = GAME_W / PIX;
  const CH = 60;
  const rnd = new Phaser.Math.RandomDataGenerator(['ground']);
  g.fillStyle(0x241329, 1);
  g.fillRect(0, 0, GAME_W, CH * PIX);
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++)
      if ((x * 7 + y * 3) % 11 === 0) cell(g, 0x2f1b38, 1, x, y);
  // 뇌 주름 보도블럭 라인
  for (let i = 0; i < 6; i++) {
    let y = 6 + i * 9;
    for (let x = 0; x < CW; x += rnd.between(3, 7)) {
      cell(g, 0x3d2547, 1, x, y + (x % 2), rnd.between(2, 4), 1);
    }
  }
  g.generateTexture('ground', GAME_W, CH * PIX);
  g.destroy();
}

// ---- 국 청사 건물 ×3레벨 (도트 타워) ----
function makeBuilding(scene, b) {
  for (let lvl = 1; lvl <= 3; lvl++) {
    const CW = 16;
    const floors = 3 + lvl * 2; // 5/7/9층
    const CH = floors * 3 + 6;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const wall = shade(b.color, 0.5);
    const wallHi = shade(b.color, 0.72);
    // 본체
    g.fillStyle(wall, 1);
    g.fillRect(1 * PIX, 4 * PIX, (CW - 2) * PIX, (CH - 4) * PIX);
    g.fillStyle(wallHi, 1);
    g.fillRect(1 * PIX, 4 * PIX, 2 * PIX, (CH - 4) * PIX);
    // 지붕 + 간판
    cell(g, b.color, 1, 0, 3, CW, 1);
    cell(g, b.accent, 1, 2, 1, CW - 4, 2);
    cell(g, shade(b.accent, 0.7), 1, 2, 2, CW - 4, 1);
    // 창문 (노을빛 불)
    for (let f = 0; f < floors; f++) {
      for (let wx = 0; wx < 4; wx++) {
        const on = (f * 3 + wx * 7 + lvl) % 5 !== 0;
        cell(g, on ? 0xffe9a0 : 0x241329, 1, 3 + wx * 3, 6 + f * 3, 2, 2);
      }
    }
    // 문
    cell(g, 0x241329, 1, CW / 2 - 1, CH - 3, 2, 3);
    g.generateTexture(`bld-${b.id}-${lvl}`, CW * PIX, CH * PIX);
    g.destroy();
  }
}

// ---- 뇌정부청사 (중앙, 큰 건물) ----
function makeHall(scene) {
  const CW = 24;
  const CH = 34;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x4a3a68, 1);
  g.fillRect(2 * PIX, 8 * PIX, (CW - 4) * PIX, (CH - 8) * PIX);
  g.fillStyle(0x5d4a82, 1);
  g.fillRect(2 * PIX, 8 * PIX, 3 * PIX, (CH - 8) * PIX);
  // 돔
  for (let dy = 0; dy < 5; dy++) {
    const w = 4 + dy * 3;
    cell(g, 0xf0c541, 1, Math.floor(CW / 2 - w / 2), 3 + dy, w, 1);
  }
  cell(g, 0xfff3d0, 1, CW / 2 - 1, 1, 2, 2); // 첨탑 불빛
  // 기둥
  for (let i = 0; i < 5; i++) cell(g, 0x8a6fc0, 1, 4 + i * 4, 12, 2, CH - 16);
  // 현판
  cell(g, 0xffd9a0, 1, 6, 9, CW - 12, 2);
  g.generateTexture('bld-hall', CW * PIX, CH * PIX);
  g.destroy();
}

// ---- 시민 캐릭터 (국별 종족, idle/run1/run2) ----
// 12×14셀. species에 따라 특징 추가 (W3·W10)
function citizenFrames(scene, keyPrefix, b, badge) {
  const CW = 12;
  const CH = 14;
  const HEAD = shade(b.color, 1.25);
  const HEAD_HI = shade(b.color, 1.6);
  const SUIT = shade(b.color, 0.45);
  const SUIT_HI = shade(b.color, 0.65);

  const frame = (key, legL, legR, run) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const translucent = b.species === 'trans' || b.species === 'firefly';
    const a = translucent ? 0.88 : 1;

    // 종족 특징(머리 뒤)
    if (b.species === 'rings') { // 큰 귀
      cell(g, HEAD, a, 2, 2, 2, 3);
      cell(g, HEAD, a, 8, 2, 2, 3);
      cell(g, shade(b.color, 0.8), a, 2, 3, 1, 1);
      cell(g, shade(b.color, 0.8), a, 9, 3, 1, 1);
    } else if (b.species === 'antenna') {
      cell(g, SUIT, 1, 3, 0, 1, 2);
      cell(g, SUIT, 1, 8, 0, 1, 2);
      cell(g, b.accent, 1, 3, 0);
      cell(g, b.accent, 1, 8, 0);
    }
    // 머리
    cell(g, HEAD, a, 4, 2, 4, 1);
    cell(g, HEAD, a, 3, 3, 6, 2);
    cell(g, HEAD, a, 4, 5, 4, 1);
    cell(g, HEAD_HI, a, 4, 3);
    // 눈
    cell(g, 0x241329, 1, 5, 4);
    cell(g, 0x241329, 1, 7, 4);
    // 종족 무늬(머리 위)
    if (b.species === 'rings') cell(g, shade(b.color, 0.85), 1, 6, 2);
    if (b.species === 'glow') { cell(g, b.accent, 1, 4, 2); cell(g, b.accent, 1, 8, 4); }
    if (b.species === 'firefly') { cell(g, 0xfff3b0, 1, 8, 3); cell(g, 0xfff3b0, 1, 4, 5); }
    if (b.species === 'vines') { cell(g, shade(b.color, 0.7), 1, 3, 4); cell(g, shade(b.color, 0.7), 1, 8, 5); }
    // 몸통(정장)
    cell(g, SUIT, 1, 4, 6, 4, 4);
    cell(g, SUIT_HI, 1, 4, 6, 1, 4);
    cell(g, b.accent, 1, 6, 6, 1, 2); // 넥타이
    if (badge) cell(g, 0xe8565e, 1, 8, 7); // 신입 명찰
    // 팔
    if (run) {
      cell(g, SUIT, 1, 3, 7, 1, 2);
      cell(g, SUIT, 1, 8, 6, 1, 2);
      cell(g, 0x8a5a2a, 1, 8, 8, 3, 2); // 서류가방
    } else {
      cell(g, SUIT, 1, 3, 6, 1, 3);
      cell(g, SUIT, 1, 8, 6, 1, 3);
    }
    // 다리/신발
    cell(g, SUIT, 1, 4, 10, 1, legL);
    cell(g, SUIT, 1, 7, 10, 1, legR);
    cell(g, 0x241329, 1, 4, 10 + legL, 2, 1);
    cell(g, 0x241329, 1, 7, 10 + legR, 2, 1);
    g.generateTexture(key, CW * PIX, CH * PIX);
    g.destroy();
  };

  frame(`${keyPrefix}-idle`, 3, 3, false);
  frame(`${keyPrefix}-run1`, 2, 3, true);
  frame(`${keyPrefix}-run2`, 3, 2, true);
}

function makeCitizen(scene, b) {
  citizenFrames(scene, `cz-${b.id}`, b, false);
}

function makePlayer(scene) {
  const me = BUREAUS.find((b) => b.id === 'memory');
  citizenFrames(scene, 'player', me, true); // 신입 명찰
}

// ---- 부서 칩 (필요 부서 표시용, 90×90) ----
function makeChip(scene, b) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  pxPanel(g, shade(b.color, 0.35), 1, 15, 15, 2);
  pxFrame(g, b.color, 1, 15, 15, 2);
  cell(g, b.color, 1, 3, 3, 9, 9);
  cell(g, b.accent, 1, 3, 3, 9, 2);
  g.generateTexture(`chip-${b.id}`, 15 * PIX, 15 * PIX);
  g.destroy();
}

// ---- 민원 카드 (540×300 = 90×50셀) ----
function makeCard(scene) {
  const CW = 90;
  const CH = 50;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0.35);
  g.fillRect(2 * PIX, 3 * PIX, (CW - 2) * PIX, (CH - 3) * PIX);
  pxPanel(g, 0xf7edd8, 1, CW - 2, CH - 2, 3);
  g.fillStyle(0xd8c9a8, 1);
  g.fillRect(3 * PIX, (CH - 4) * PIX, (CW - 6) * PIX, PIX);
  // 헤더 띠
  cell(g, 0xb5443c, 1, 3, 3, CW - 8, 4);
  cell(g, 0xd4645e, 1, 3, 3, CW - 8, 1);
  // 결재선
  for (let x = 4; x < CW - 6; x += 2) cell(g, 0xb5443c, 0.7, x, 22);
  // 클립
  cell(g, 0x8a8f9c, 1, CW - 14, 0, 6, 4);
  g.generateTexture('card', CW * PIX, CH * PIX);
  g.destroy();
}

// ---- 버튼 ----
function makeButtons(scene) {
  const mk = (key, base, frame, cw = 70, chh = 16) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    pxPanel(g, base, 1, cw, chh, 2);
    g.fillStyle(shade(base, 1.35), 1);
    g.fillRect(2 * PIX, 1 * PIX, (cw - 4) * PIX, PIX);
    g.fillStyle(shade(base, 0.6), 1);
    g.fillRect(2 * PIX, (chh - 3) * PIX, (cw - 4) * PIX, 2 * PIX);
    pxFrame(g, frame, 1, cw, chh, 2);
    g.generateTexture(key, cw * PIX, chh * PIX);
    g.destroy();
  };
  mk('button', 0xff8c42, 0xffd9a0);
  mk('button-dark', 0x3a2a55, 0x8a6fc0);
  mk('choice-btn', 0xfff6e3, 0xc9a35f, 44, 9);
  // 부서 호출 버튼 (108×108)
  for (const b of BUREAUS) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    pxPanel(g, shade(b.color, 0.4), 1, 18, 18, 2);
    g.fillStyle(shade(b.color, 1.2), 1);
    g.fillRect(2 * PIX, 1 * PIX, 14 * PIX, PIX);
    pxFrame(g, b.color, 1, 18, 18, 2);
    g.generateTexture(`call-${b.id}`, 18 * PIX, 18 * PIX);
    g.destroy();
  }
}

function makeParticle(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillRect(4, 0, 8, 16);
  g.fillRect(0, 4, 16, 8);
  g.generateTexture('dot', 16, 16);
  g.destroy();
}
