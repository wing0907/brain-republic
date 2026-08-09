import Phaser from 'phaser';
import { GAME_W, GAME_H, BEST_KEY } from '../config.js';
import { MATCHUPS } from '../data/matchups.js';
import { unlock, sfx, music } from '../systems/audio.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", sans-serif';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Title' });
  }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'sky');

    this.add
      .text(GAME_W / 2, 210, '두뇌공화국', {
        fontFamily: FONT,
        fontSize: '82px',
        fontStyle: 'bold',
        color: '#ffd9a0',
        stroke: '#7a3b12',
        strokeThickness: 12
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 296, '부 서 대 전', {
        fontFamily: FONT,
        fontSize: '58px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3a1c40',
        strokeThickness: 8
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 372, '뇌 속 1,428개 부서, 오늘도 알력 다툼 중 —\n결재 도장을 장전하라!', {
        fontFamily: FONT,
        fontSize: '25px',
        color: '#ffe9c9',
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5);

    // 대치 연출: 좌우 블롭 + 포물선 점선
    const L = this.add.image(150, 640, 'blob-player').setScale(1.35);
    const R = this.add.image(GAME_W - 150, 640, 'blob-e0').setScale(1.35).setFlipX(true);
    this.tweens.add({ targets: L, y: 632, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
    this.tweens.add({ targets: R, y: 648, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
    const arc = this.add.graphics();
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = 190 + t * (GAME_W - 380);
      const y = 610 - Math.sin(t * Math.PI) * 190;
      arc.fillStyle(0xffe9a0, 0.75 - t * 0.25);
      arc.fillCircle(x, y, 5.5);
    }
    const shell = this.add.image(190, 610, 'shell').setScale(1.2);
    this.tweens.add({
      targets: shell,
      duration: 1600,
      repeat: -1,
      ease: 'linear',
      onUpdate: (tw) => {
        const t = tw.progress;
        shell.x = 190 + t * (GAME_W - 380);
        shell.y = 610 - Math.sin(t * Math.PI) * 190;
        shell.angle += 6;
      }
    });

    const best = Number(localStorage.getItem(BEST_KEY) || 0);
    if (best > 0) {
      this.add
        .text(GAME_W / 2, 780, `최고 기록: ROUND ${best}${best >= MATCHUPS.length ? ' — 🏆 전 부서 평정!' : ''}`, {
          fontFamily: FONT,
          fontSize: '25px',
          color: '#ffe9a0'
        })
        .setOrigin(0.5);
    }

    const btn = this.add.image(GAME_W / 2, 880, 'button').setInteractive({ useHandCursor: true });
    const label = this.add
      .text(GAME_W / 2, 876, '대전 시작', { fontFamily: FONT, fontSize: '42px', fontStyle: 'bold', color: '#3a1c05' })
      .setOrigin(0.5);
    this.tweens.add({
      targets: [btn, label],
      scale: { from: 1, to: 1.05 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inout'
    });
    btn.on('pointerdown', () => {
      unlock();
      sfx.fanfare();
      music.start();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start('Battle', { round: 0 }));
    });

    this.add
      .text(GAME_W / 2, 984, '드래그로 조준하고, 놓으면 발사!\n바람(주인님의 변덕)을 읽는 자가 승리한다', {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#c9b8e8',
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_W / 2, 1150, '원작·기획  성지은', { fontFamily: FONT, fontSize: '22px', color: '#e8c9b0' })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 1188, 'NAN 2026 — NHN Game × AI Hackathon · 팀 뇌지컬연구소', {
        fontFamily: FONT,
        fontSize: '19px',
        color: '#c9a890'
      })
      .setOrigin(0.5);
  }
}
