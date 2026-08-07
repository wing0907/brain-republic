// 프로시저럴 아트 — 외부 이미지 에셋 없이 Phaser Graphics로 텍스처 생성.
// 원작 아트 가이드: 뇌 주름 지형, 따뜻한 노을빛(오렌지-핑크) 톤.

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { BUREAUS } from '../data/bureaus.js';

export function generateTextures(scene) {
  makeBackground(scene);
  makePanels(scene);
  makeCard(scene);
  makeButton(scene);
  makeParticle(scene);
}

// 짙은 보라 배경 + 뇌 주름 곡선 실루엣
function makeBackground(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillGradientStyle(0x1a0b2e, 0x1a0b2e, 0x12081f, 0x12081f, 1);
  g.fillRect(0, 0, GAME_W, GAME_H);

  // 뇌 주름: 랜덤 곡선 능선
  const rnd = new Phaser.Math.RandomDataGenerator(['brain-republic']);
  for (let i = 0; i < 14; i++) {
    const y0 = rnd.between(40, GAME_H - 40);
    const alpha = 0.05 + rnd.frac() * 0.06;
    g.lineStyle(rnd.between(10, 26), 0xff9a5e, alpha);
    g.beginPath();
    g.moveTo(-50, y0);
    let x = -50;
    let y = y0;
    while (x < GAME_W + 50) {
      const nx = x + rnd.between(60, 140);
      const ny = Phaser.Math.Clamp(y + rnd.between(-70, 70), 20, GAME_H - 20);
      const cx = (x + nx) / 2;
      g.lineTo(cx, y);
      g.lineTo(nx, ny);
      x = nx;
      y = ny;
    }
    g.strokePath();
  }
  g.generateTexture('bg', GAME_W, GAME_H);
  g.destroy();
}

// 국 패널: 국별 고유색 라운드 패널 (기본/점등 2종)
function makePanels(scene) {
  const w = 330;
  const h = 240;
  for (const b of BUREAUS) {
    for (const lit of [false, true]) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      const base = Phaser.Display.Color.IntegerToColor(b.color);
      const dark = Phaser.Display.Color.GetColor(
        Math.floor(base.red * 0.22),
        Math.floor(base.green * 0.22),
        Math.floor(base.blue * 0.22)
      );
      g.fillStyle(dark, lit ? 0.98 : 0.85);
      g.fillRoundedRect(0, 0, w, h, 22);
      g.lineStyle(lit ? 6 : 3, b.color, lit ? 1 : 0.55);
      g.strokeRoundedRect(lit ? 3 : 1.5, lit ? 3 : 1.5, w - (lit ? 6 : 3), h - (lit ? 6 : 3), 20);
      // 상단 명패 바
      g.fillStyle(b.color, lit ? 0.95 : 0.6);
      g.fillRoundedRect(14, 12, w - 28, 44, 10);
      g.generateTexture(`panel-${b.id}${lit ? '-lit' : ''}`, w, h);
      g.destroy();
    }
  }
}

// 위기 카드: 공문서/결재판 모티프 (아이보리 종이 + 클립)
function makeCard(scene) {
  const w = 300;
  const h = 170;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // 그림자
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(6, 8, w - 8, h - 8, 14);
  // 종이
  g.fillStyle(0xf7edd8, 1);
  g.fillRoundedRect(0, 0, w - 8, h - 8, 14);
  // 상단 결재선
  g.lineStyle(3, 0xb5443c, 0.9);
  g.beginPath();
  g.moveTo(14, 40);
  g.lineTo(w - 22, 40);
  g.strokePath();
  // 클립
  g.fillStyle(0x8a8f9c, 1);
  g.fillRoundedRect(w - 60, -6, 34, 22, 6);
  g.generateTexture('card', w, h);
  g.destroy();
}

// 공용 버튼
function makeButton(scene) {
  const w = 420;
  const h = 96;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xff8c42, 1);
  g.fillRoundedRect(0, 0, w, h, 26);
  g.lineStyle(4, 0xffd9a0, 0.9);
  g.strokeRoundedRect(2, 2, w - 4, h - 4, 24);
  g.generateTexture('button', w, h);
  g.destroy();

  const g2 = scene.make.graphics({ x: 0, y: 0, add: false });
  g2.fillStyle(0x3a2a55, 1);
  g2.fillRoundedRect(0, 0, w, h, 26);
  g2.lineStyle(3, 0x8a6fc0, 0.9);
  g2.strokeRoundedRect(1.5, 1.5, w - 3, h - 3, 24);
  g2.generateTexture('button-dark', w, h);
  g2.destroy();

  // 2지선다용 작은 버튼
  const g3 = scene.make.graphics({ x: 0, y: 0, add: false });
  g3.fillStyle(0xfff6e3, 1);
  g3.fillRoundedRect(0, 0, 264, 54, 12);
  g3.lineStyle(3, 0xc9a35f, 1);
  g3.strokeRoundedRect(1.5, 1.5, 261, 51, 11);
  g3.generateTexture('choice-btn', 264, 54);
  g3.destroy();
}

// 파티클(원형 점)
function makeParticle(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillCircle(8, 8, 8);
  g.generateTexture('dot', 16, 16);
  g.destroy();
}
