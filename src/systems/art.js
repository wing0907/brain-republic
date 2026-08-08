// 프로시저럴 픽셀아트 — 외부 이미지 에셋 없이 6px 셀 스냅으로 도트를 찍는다.
// 텍스처 키/크기는 이전과 동일 (레이아웃 무변경). pixelArt:true와 함께 쨍한 도트 룩.

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { BUREAUS } from '../data/bureaus.js';

const PIX = 6; // 도트 셀 크기

// ---- 셀 단위 드로잉 유틸 ----

function cell(g, color, alpha, cx, cy, cw = 1, ch = 1) {
  g.fillStyle(color, alpha);
  g.fillRect(cx * PIX, cy * PIX, cw * PIX, ch * PIX);
}

// 모서리를 계단식으로 깎은 사각형 (레트로 라운드)
function pxPanel(g, color, alpha, cw, chh, notch = 2) {
  g.fillStyle(color, alpha);
  for (let y = 0; y < chh; y++) {
    let inset = 0;
    if (y < notch) inset = notch - y;
    else if (y >= chh - notch) inset = y - (chh - 1 - notch);
    g.fillRect(inset * PIX, y * PIX, (cw - inset * 2) * PIX, PIX);
  }
}

// 계단식 테두리 (pxPanel과 같은 실루엣의 1셀 프레임)
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
  makeBackground(scene);
  makePanels(scene);
  makeCard(scene);
  makeButton(scene);
  makeParticle(scene);
}

// 밤하늘 + 노을 디더링 + 뇌 주름 능선 (도트)
function makeBackground(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const CW = GAME_W / PIX; // 120
  const CH = Math.ceil(GAME_H / PIX); // 214
  g.fillStyle(0x12081f, 1);
  g.fillRect(0, 0, GAME_W, GAME_H);

  const rnd = new Phaser.Math.RandomDataGenerator(['brain-pixel']);

  // 노을 디더 원 (중앙 상단)
  const sunX = CW / 2;
  const sunY = 46;
  for (let y = 0; y < CH; y++) {
    for (let x = 0; x < CW; x++) {
      const d = Math.hypot(x - sunX, (y - sunY) * 1.15);
      if (d < 34 && (x + y) % 2 === 0) cell(g, 0xff9a5e, 0.10, x, y);
      else if (d < 46 && (x + y) % 3 === 0) cell(g, 0xffc98a, 0.06, x, y);
    }
  }

  // 뇌 주름 능선 (수평 지그재그 도트 라인)
  for (let i = 0; i < 12; i++) {
    let y = rnd.between(10, CH - 10);
    const color = 0xff9a5e;
    const alpha = 0.08 + rnd.frac() * 0.07;
    let x = 0;
    while (x < CW) {
      const len = rnd.between(4, 10);
      cell(g, color, alpha, x, y, Math.min(len, CW - x), 2);
      x += len;
      y = Phaser.Math.Clamp(y + rnd.between(-2, 2), 4, CH - 4);
    }
  }

  // 별
  for (let i = 0; i < 70; i++) {
    cell(g, 0xffe9a0, 0.1 + rnd.frac() * 0.3, rnd.between(0, CW - 1), rnd.between(0, CH - 1));
  }

  g.generateTexture('bg', GAME_W, GAME_H);
  g.destroy();
}

// 국 패널 (330×240 = 55×40 셀)
function makePanels(scene) {
  const CW = 55;
  const CH = 40;
  for (const b of BUREAUS) {
    for (const lit of [false, true]) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      cellPanel(g, b, lit, CW, CH);
      g.generateTexture(`panel-${b.id}${lit ? '-lit' : ''}`, CW * PIX, CH * PIX);
      g.destroy();
    }
  }
}

function cellPanel(g, b, lit, CW, CH) {
  const dark = shade(b.color, 0.22);
  pxPanel(g, dark, lit ? 0.98 : 0.85, CW, CH, 3);
  pxFrame(g, b.color, lit ? 1 : 0.55, CW, CH, 3);
  if (lit) pxFrame(g, shade(b.color, 1.35), 0.6, CW - 2, CH - 2, 2); // 내측 발광 프레임
  // 명패 바 (상단)
  g.fillStyle(b.color, lit ? 0.95 : 0.62);
  g.fillRect(3 * PIX, 2 * PIX, (CW - 6) * PIX, 7 * PIX);
  // 명패 하이라이트 도트
  g.fillStyle(shade(b.color, 1.4), lit ? 0.9 : 0.5);
  g.fillRect(3 * PIX, 2 * PIX, (CW - 6) * PIX, PIX);
}

// 위기 카드 (300×170 = 50×28 셀) — 도트 공문서
function makeCard(scene) {
  const CW = 50;
  const CH = 28;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // 그림자
  g.fillStyle(0x000000, 0.35);
  g.fillRect(1 * PIX, 2 * PIX, (CW - 1) * PIX, (CH - 2) * PIX);
  // 종이 (계단 모서리)
  const paper = scene.make.graphics({ x: 0, y: 0, add: false });
  pxPanel(g, 0xf7edd8, 1, CW - 1, CH - 1, 2);
  paper.destroy();
  // 가장자리 음영 (아래·오른쪽 1셀)
  g.fillStyle(0xd8c9a8, 1);
  g.fillRect(2 * PIX, (CH - 2) * PIX, (CW - 4) * PIX, PIX);
  g.fillRect((CW - 2) * PIX, 2 * PIX, PIX, (CH - 4) * PIX);
  // 결재선 (도트 대시)
  for (let x = 2; x < CW - 4; x += 2) cell(g, 0xb5443c, 0.9, x, 6, 1, 1);
  // 클립
  cell(g, 0x8a8f9c, 1, CW - 10, 0, 5, 3);
  cell(g, 0xb8bdc9, 1, CW - 9, 0, 3, 1);
  g.generateTexture('card', CW * PIX, CH * PIX);
  g.destroy();
}

// 버튼 (420×96 = 70×16 셀) — 베벨 도트 버튼
function makeButton(scene) {
  const mk = (key, base, frame) => {
    const CW = 70;
    const CH = 16;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    pxPanel(g, base, 1, CW, CH, 2);
    // 상단 하이라이트 / 하단 베벨
    g.fillStyle(shade(base, 1.35), 1);
    g.fillRect(2 * PIX, 1 * PIX, (CW - 4) * PIX, PIX);
    g.fillStyle(shade(base, 0.6), 1);
    g.fillRect(2 * PIX, (CH - 3) * PIX, (CW - 4) * PIX, 2 * PIX);
    pxFrame(g, frame, 1, CW, CH, 2);
    g.generateTexture(key, CW * PIX, CH * PIX);
    g.destroy();
  };
  mk('button', 0xff8c42, 0xffd9a0);
  mk('button-dark', 0x3a2a55, 0x8a6fc0);

  // 2지선다 버튼 (264×54 = 44×9 셀)
  const g3 = scene.make.graphics({ x: 0, y: 0, add: false });
  pxPanel(g3, 0xfff6e3, 1, 44, 9, 1);
  pxFrame(g3, 0xc9a35f, 1, 44, 9, 1);
  g3.fillStyle(0xd8c9a8, 1);
  g3.fillRect(1 * PIX, 7 * PIX, 42 * PIX, PIX);
  g3.generateTexture('choice-btn', 44 * PIX, 9 * PIX);
  g3.destroy();
}

// 파티클: 도트 스파클 (십자 + 중심)
function makeParticle(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillRect(4, 0, 8, 16);
  g.fillRect(0, 4, 16, 8);
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(4, 4, 8, 8);
  g.generateTexture('dot', 16, 16);
  g.destroy();
}
