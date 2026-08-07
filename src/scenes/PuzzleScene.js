import Phaser from 'phaser';
import { GAME_W, GAME_H, PUZZLE_TIME_MS } from '../config.js';
import { BUREAU_BY_ID } from '../data/bureaus.js';
import { saveState } from '../systems/save.js';
import { applyReward } from '../systems/rewards.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

const GRID = 3;
const SRC = 240; // 원본 문장 텍스처 크기
const PIECE_SRC = SRC / GRID; // 80
const CELL = 156; // 보드 셀 표시 크기
const BOARD_X = (GAME_W - CELL * GRID) / 2; // 126
const BOARD_Y = 250;
const SNAP_DIST = 62;

export class PuzzleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Puzzle' });
  }

  init(data) {
    this.bureauId = data.bureauId;
    this.from = data.from;
    this.ep = data.ep;
  }

  create() {
    this.state = this.registry.get('state');
    this.bureau = BUREAU_BY_ID[this.bureauId];
    this.locked = 0;
    this.done = false;

    this.add.image(GAME_W / 2, GAME_H / 2, 'kingdom-ground').setAlpha(0.4);

    this.add
      .text(GAME_W / 2, 110, '조각을 맞춰 문장(紋章)을 복원하라!', {
        fontFamily: FONT,
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffd9a0'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 158, `${this.bureau.name}의 상징이 흩어졌습니다`, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#a99cc7'
      })
      .setOrigin(0.5);

    // 제한시간 — 긴장감의 원천
    this.timeLeft = PUZZLE_TIME_MS;
    this.timerText = this.add
      .text(GAME_W / 2, 205, '', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffe9a0' })
      .setOrigin(0.5);

    this.ensureFrames();
    this.buildBoard();
    this.buildPieces();

    // 포기 버튼
    const giveUp = this.add
      .text(GAME_W - 40, 110, '포기', {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#8a7fa8',
        backgroundColor: '#12081fcc',
        padding: { x: 10, y: 6 }
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    giveUp.on('pointerdown', () => {
      sfx.ui();
      this.finish(false);
    });

    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  ensureFrames() {
    const tex = this.textures.get(`emblem-${this.bureauId}`);
    for (let i = 0; i < GRID * GRID; i++) {
      const name = `p${i}`;
      if (!tex.has(name)) {
        const col = i % GRID;
        const row = Math.floor(i / GRID);
        tex.add(name, 0, col * PIECE_SRC, row * PIECE_SRC, PIECE_SRC, PIECE_SRC);
      }
    }
  }

  cellCenter(i) {
    const col = i % GRID;
    const row = Math.floor(i / GRID);
    return {
      x: BOARD_X + col * CELL + CELL / 2,
      y: BOARD_Y + row * CELL + CELL / 2
    };
  }

  buildBoard() {
    const g = this.add.graphics();
    g.fillStyle(0x12081f, 0.8);
    g.fillRoundedRect(BOARD_X - 12, BOARD_Y - 12, CELL * GRID + 24, CELL * GRID + 24, 16);
    // 힌트: 흐릿한 완성본
    this.add
      .image(BOARD_X + (CELL * GRID) / 2, BOARD_Y + (CELL * GRID) / 2, `emblem-${this.bureauId}`)
      .setScale((CELL * GRID) / SRC)
      .setAlpha(0.14);
    g.lineStyle(2, 0x8a6fc0, 0.5);
    for (let i = 0; i <= GRID; i++) {
      g.lineBetween(BOARD_X + i * CELL, BOARD_Y, BOARD_X + i * CELL, BOARD_Y + CELL * GRID);
      g.lineBetween(BOARD_X, BOARD_Y + i * CELL, BOARD_X + CELL * GRID, BOARD_Y + i * CELL);
    }
  }

  buildPieces() {
    const order = Phaser.Utils.Array.Shuffle([...Array(GRID * GRID).keys()]);
    this.pieces = [];
    const trayY1 = 850;
    const trayY2 = 990;
    order.forEach((pieceIdx, slot) => {
      const inRow1 = slot < 5;
      const tx = inRow1 ? 90 + slot * 135 : 155 + (slot - 5) * 135;
      const ty = inRow1 ? trayY1 : trayY2;
      const img = this.add
        .image(tx, ty, `emblem-${this.bureauId}`, `p${pieceIdx}`)
        .setScale(1.35)
        .setInteractive({ useHandCursor: true, draggable: true });
      img.pieceIdx = pieceIdx;
      img.homeX = tx;
      img.homeY = ty;
      img.lockedIn = false;

      img.on('dragstart', () => {
        if (img.lockedIn) return;
        sfx.pick();
        img.setScale(CELL / PIECE_SRC);
        img.setDepth(100);
      });
      img.on('drag', (_p, dragX, dragY) => {
        if (img.lockedIn) return;
        img.x = dragX;
        img.y = dragY;
      });
      img.on('dragend', () => {
        if (img.lockedIn) return;
        const target = this.cellCenter(img.pieceIdx);
        const d = Phaser.Math.Distance.Between(img.x, img.y, target.x, target.y);
        if (d <= SNAP_DIST) {
          img.x = target.x;
          img.y = target.y;
          img.lockedIn = true;
          img.setDepth(10);
          img.disableInteractive();
          sfx.snap();
          this.flash(target.x, target.y);
          this.locked += 1;
          if (this.locked >= GRID * GRID) this.complete();
        } else {
          sfx.thud();
          this.tweens.add({
            targets: img,
            x: img.homeX,
            y: img.homeY,
            scale: 1.35,
            duration: 220,
            ease: 'back.out',
            onComplete: () => img.setDepth(1)
          });
        }
      });
      this.pieces.push(img);
    });
  }

  flash(x, y) {
    const p = this.add.particles(x, y, 'dot', {
      speed: { min: 60, max: 160 },
      lifespan: 350,
      quantity: 8,
      scale: { start: 0.5, end: 0 },
      tint: this.bureau.accent,
      emitting: false
    });
    p.explode(8);
    this.time.delayedCall(500, () => p.destroy());
  }

  complete() {
    if (this.done) return;
    this.done = true;
    sfx.fanfare();
    const cx = BOARD_X + (CELL * GRID) / 2;
    const cy = BOARD_Y + (CELL * GRID) / 2;
    const p = this.add.particles(cx, cy, 'dot', {
      speed: { min: 150, max: 350 },
      lifespan: 700,
      quantity: 40,
      scale: { start: 0.8, end: 0 },
      tint: [this.bureau.color, this.bureau.accent, 0xffe9a0],
      emitting: false
    });
    p.explode(40);
    this.add
      .text(GAME_W / 2, 1130, '복원 완료!', {
        fontFamily: FONT,
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#ffe9a0'
      })
      .setOrigin(0.5);
    this.time.delayedCall(1200, () => this.finish(true));
  }

  update(_, deltaMs) {
    if (this.done) return;
    this.timeLeft -= deltaMs;
    const s = Math.max(0, Math.ceil(this.timeLeft / 1000));
    this.timerText.setText(`⏱ ${s}초`);
    this.timerText.setColor(s <= 10 ? '#e8565e' : '#ffe9a0');
    if (this.timeLeft <= 0) {
      this.done = true;
      sfx.danger();
      const t = this.add
        .text(GAME_W / 2, 1130, '시간 초과!', {
          fontFamily: FONT,
          fontSize: '44px',
          fontStyle: 'bold',
          color: '#e8565e'
        })
        .setOrigin(0.5);
      this.time.delayedCall(1000, () => this.finish(false));
    }
  }

  finish(success) {
    if (this.from === 'episode') {
      this.scene.start('Episode', { bureauId: this.bureauId, ep: this.ep, phase: 'result', success });
      return;
    }
    applyReward(this.state, this.bureauId, this.from, success);
    saveState(this.state);
    if (this.from === 'event') {
      this.scene.start('Map', { eventResult: { success, bureauId: this.bureauId } });
    } else {
      this.scene.start('Bureau', { bureauId: this.bureauId });
    }
  }
}
