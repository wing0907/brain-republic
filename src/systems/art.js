// 스무스 벡터 스타일 프로시저럴 아트 — 외부 이미지 에셋 0.
// 노을빛 팔레트 유지, 픽셀이 아닌 부드러운 곡선·글로우.

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { PLAYER_TEAM, MATCHUPS } from '../data/matchups.js';

export function generateTextures(scene) {
  makeSky(scene);
  makeBlob(scene, 'blob-player', PLAYER_TEAM.color, PLAYER_TEAM.accent);
  MATCHUPS.forEach((m, i) => makeBlob(scene, `blob-e${i}`, m.color, m.accent));
  makeBarrel(scene);
  makeShell(scene);
  makeButton(scene);
  makeDot(scene);
}

function shade(color, f) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  return Phaser.Display.Color.GetColor(
    Phaser.Math.Clamp(Math.floor(c.red * f), 0, 255),
    Phaser.Math.Clamp(Math.floor(c.green * f), 0, 255),
    Phaser.Math.Clamp(Math.floor(c.blue * f), 0, 255)
  );
}

// 노을 하늘 (부드러운 그라데이션 + 태양 글로우 + 구름)
function makeSky(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const bands = [
    [0x2a1440, 0x4a2245],
    [0x4a2245, 0x8a3a55],
    [0x8a3a55, 0xd4645e],
    [0xd4645e, 0xff9a6e],
    [0xff9a6e, 0xffc98a]
  ];
  const bh = GAME_H / bands.length;
  bands.forEach(([top, bot], i) => {
    g.fillGradientStyle(top, top, bot, bot, 1);
    g.fillRect(0, i * bh, GAME_W, bh + 2);
  });
  // 태양 글로우 (크고 따뜻하게)
  for (let r = 220; r > 0; r -= 12) {
    g.fillStyle(0xfff0c8, 0.05);
    g.fillCircle(GAME_W * 0.72, GAME_H * 0.5, r);
  }
  g.fillStyle(0xfff6dc, 0.98);
  g.fillCircle(GAME_W * 0.72, GAME_H * 0.5, 58);
  // 구름 (부드러운 타원 뭉치)
  const rnd = new Phaser.Math.RandomDataGenerator(['clouds']);
  for (let i = 0; i < 7; i++) {
    const cx = rnd.between(40, GAME_W - 40);
    const cy = rnd.between(120, 520);
    const a = 0.06 + rnd.frac() * 0.08;
    g.fillStyle(0xffe0c0, a);
    g.fillEllipse(cx, cy, rnd.between(140, 260), rnd.between(26, 44));
    g.fillEllipse(cx + 50, cy - 12, rnd.between(80, 140), rnd.between(20, 32));
  }
  // 별 (상단)
  for (let i = 0; i < 40; i++) {
    g.fillStyle(0xffe9c0, 0.25 + rnd.frac() * 0.5);
    g.fillCircle(rnd.between(10, GAME_W - 10), rnd.between(10, 360), rnd.frac() * 1.8 + 0.6);
  }
  g.generateTexture('sky', GAME_W, GAME_H);
  g.destroy();
}

// 부서 마스코트 (동글동글 블롭 + 큰 눈)
function makeBlob(scene, key, color, accent) {
  const S = 120;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const cx = S / 2;
  const cy = S / 2 + 8;
  const r = 40;
  // 그림자
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + r * 0.92, r * 1.8, r * 0.5);
  // 몸
  g.fillStyle(shade(color, 0.75), 1);
  g.fillCircle(cx, cy, r);
  g.fillStyle(color, 1);
  g.fillCircle(cx - 3, cy - 4, r * 0.92);
  // 하이라이트
  g.fillStyle(accent, 0.65);
  g.fillEllipse(cx - r * 0.32, cy - r * 0.42, r * 0.62, r * 0.4);
  // 배
  g.fillStyle(accent, 0.5);
  g.fillEllipse(cx, cy + r * 0.42, r * 1.05, r * 0.62);
  // 눈
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - r * 0.34, cy - r * 0.1, r * 0.24);
  g.fillCircle(cx + r * 0.34, cy - r * 0.1, r * 0.24);
  g.fillStyle(0x241329, 1);
  g.fillCircle(cx - r * 0.28, cy - r * 0.08, r * 0.12);
  g.fillCircle(cx + r * 0.4, cy - r * 0.08, r * 0.12);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(cx - r * 0.24, cy - r * 0.14, r * 0.045);
  g.fillCircle(cx + r * 0.44, cy - r * 0.14, r * 0.045);
  // 볼
  g.fillStyle(0xff8a8a, 0.45);
  g.fillCircle(cx - r * 0.6, cy + r * 0.16, r * 0.13);
  g.fillCircle(cx + r * 0.6, cy + r * 0.16, r * 0.13);
  // 입
  g.lineStyle(3.5, 0x241329, 0.9);
  g.beginPath();
  g.arc(cx + r * 0.03, cy + r * 0.22, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
  g.strokePath();
  g.generateTexture(key, S, S);
  g.destroy();
}

// 포신
function makeBarrel(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x3a2a55, 1);
  g.fillRoundedRect(0, 6, 64, 20, 10);
  g.fillStyle(0x5a4a80, 1);
  g.fillRoundedRect(0, 6, 64, 9, { tl: 10, tr: 10, bl: 0, br: 0 });
  g.fillStyle(0x241638, 1);
  g.fillCircle(58, 16, 9);
  g.generateTexture('barrel', 70, 32);
  g.destroy();
}

// 포탄 = 결재 도장
function makeShell(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x8a3a3a, 1);
  g.fillRoundedRect(4, 2, 24, 14, 5); // 손잡이(몸통)
  g.fillStyle(0xb5443c, 1);
  g.fillRoundedRect(0, 14, 32, 12, 4); // 도장면
  g.fillStyle(0xe8756a, 1);
  g.fillRoundedRect(0, 14, 32, 5, { tl: 4, tr: 4, bl: 0, br: 0 });
  g.generateTexture('shell', 32, 28);
  g.destroy();
}

// 버튼 (스무스)
function makeButton(scene) {
  const mk = (key, base, frame) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(shade(base, 0.7), 1);
    g.fillRoundedRect(0, 4, 420, 92, 26);
    g.fillStyle(base, 1);
    g.fillRoundedRect(0, 0, 420, 88, 26);
    g.fillStyle(shade(base, 1.25), 0.55);
    g.fillRoundedRect(8, 6, 404, 30, 18);
    g.lineStyle(3, frame, 0.9);
    g.strokeRoundedRect(1.5, 1.5, 417, 85, 25);
    g.generateTexture(key, 420, 96);
    g.destroy();
  };
  mk('button', 0xff8c42, 0xffd9a0);
  mk('button-dark', 0x3a2a55, 0x8a6fc0);
}

// 궤적 점/파티클
function makeDot(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillCircle(8, 8, 8);
  g.generateTexture('dot', 16, 16);
  g.destroy();
}
