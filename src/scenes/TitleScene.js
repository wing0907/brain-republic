import Phaser from 'phaser';
import { GAME_W, GAME_H, STORAGE_KEY } from '../config.js';
import { BUREAUS } from '../data/bureaus.js';
import { unlock, sfx } from '../systems/audio.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Title' });
  }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'bg');

    this.add
      .text(GAME_W / 2, 210, '두뇌공화국', {
        fontFamily: FONT,
        fontSize: '96px',
        fontStyle: 'bold',
        color: '#ffd9a0',
        stroke: '#7a3b12',
        strokeThickness: 10
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 300, '면 접 대 작 전', {
        fontFamily: FONT,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 372, '당신의 뇌 속 1,428개 부서가 오늘도 야근합니다', {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#c9b8e8'
      })
      .setOrigin(0.5);

    // 6개 국 소개 미니 패널
    const startY = 470;
    BUREAUS.forEach((b, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = GAME_W / 2 + (col === 0 ? -172 : 172);
      const y = startY + row * 96;
      const panel = this.add.rectangle(x, y, 320, 80, b.color, 0.16);
      panel.setStrokeStyle(2, b.color, 0.8);
      this.add
        .text(x, y - 16, b.name, {
          fontFamily: FONT,
          fontSize: '28px',
          fontStyle: 'bold',
          color: '#' + b.color.toString(16).padStart(6, '0')
        })
        .setOrigin(0.5);
      this.add
        .text(x, y + 18, b.verb, {
          fontFamily: FONT,
          fontSize: '20px',
          color: '#d8cfec'
        })
        .setOrigin(0.5);
    });

    // 최고 기록
    const best = Number(localStorage.getItem(STORAGE_KEY) || 0);
    if (best > 0) {
      this.add
        .text(GAME_W / 2, 812, `최고 기록  ${best.toLocaleString()}점`, {
          fontFamily: FONT,
          fontSize: '28px',
          color: '#ffe9a0'
        })
        .setOrigin(0.5);
    }

    // 시작 버튼
    const btn = this.add.image(GAME_W / 2, 920, 'button').setInteractive({ useHandCursor: true });
    const btnLabel = this.add
      .text(GAME_W / 2, 920, '면접 시작', {
        fontFamily: FONT,
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#3a1c05'
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: [btn, btnLabel],
      scale: { from: 1, to: 1.05 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inout'
    });
    btn.on('pointerdown', () => {
      unlock();
      sfx.start();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start('Game'));
    });

    this.add
      .text(GAME_W / 2, 1030, '위기 카드를 탭 · 홀드 · 스와이프로 해결하고\n3분 동안 멘탈 게이지를 사수하세요!', {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#a99cc7',
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_W / 2, 1200, 'NAN 2026 — NHN Game × AI Hackathon 출품작', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#6e6390'
      })
      .setOrigin(0.5);
  }
}
