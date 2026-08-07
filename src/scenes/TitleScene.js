import Phaser from 'phaser';
import { GAME_W, GAME_H, STORAGE_KEY } from '../config.js';
import { BUREAUS } from '../data/bureaus.js';
import { unlock, sfx } from '../systems/audio.js';
import { resetState } from '../systems/save.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Title' });
  }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'kingdom-ground');

    this.add
      .text(GAME_W / 2, 190, '두뇌공화국', {
        fontFamily: FONT,
        fontSize: '96px',
        fontStyle: 'bold',
        color: '#ffd9a0',
        stroke: '#7a3b12',
        strokeThickness: 10
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 278, '뇌 속 왕국 키우기', {
        fontFamily: FONT,
        fontSize: '46px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 344, '당신의 뇌 속 1,428개 부서가 당신의 관심을 기다립니다', {
        fontFamily: FONT,
        fontSize: '25px',
        color: '#c9b8e8'
      })
      .setOrigin(0.5);

    // 국장 크리처 6종 미리보기
    BUREAUS.forEach((b, i) => {
      const x = 120 + (i % 3) * 240;
      const y = 480 + Math.floor(i / 3) * 190;
      const pet = this.add.image(x, y, `pet-${b.id}-1`).setScale(0.95);
      this.tweens.add({
        targets: pet,
        y: y - 8,
        duration: 1000 + i * 130,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inout'
      });
      this.add
        .text(x, y + 82, b.name, {
          fontFamily: FONT,
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#' + b.color.toString(16).padStart(6, '0')
        })
        .setOrigin(0.5);
    });

    const hasSave = !!localStorage.getItem(STORAGE_KEY);

    const btn = this.add.image(GAME_W / 2, 920, 'button').setInteractive({ useHandCursor: true });
    const btnLabel = this.add
      .text(GAME_W / 2, 920, hasSave ? '공화국 입장' : '건국 시작', {
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
      this.time.delayedCall(320, () => this.scene.start('Map'));
    });

    this.add
      .text(GAME_W / 2, 1020, '국장들을 먹이고 재우면 주인의 의식에 자주 등장합니다.\n등장하지 못하는 시민은… 조용히 잊혀집니다.', {
        fontFamily: FONT,
        fontSize: '25px',
        color: '#a99cc7',
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5);

    // 초기화 (2회 탭 확인)
    if (hasSave) {
      this.resetArmed = false;
      const reset = this.add
        .text(GAME_W / 2, 1110, '처음부터 시작', {
          fontFamily: FONT,
          fontSize: '22px',
          color: '#6e6390'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      reset.on('pointerdown', () => {
        unlock();
        sfx.ui();
        if (!this.resetArmed) {
          this.resetArmed = true;
          reset.setText('⚠ 공화국이 사라집니다 — 한 번 더 탭하면 초기화').setColor('#ff8a8a');
          this.time.delayedCall(2500, () => {
            this.resetArmed = false;
            reset.setText('처음부터 시작').setColor('#6e6390');
          });
        } else {
          resetState();
          this.registry.remove('state');
          sfx.burst();
          this.scene.restart();
        }
      });
    }

    this.add
      .text(GAME_W / 2, 1176, '원작·기획  성지은', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#8a7fa8'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 1212, 'NAN 2026 — NHN Game × AI Hackathon 출품작 · 팀 뇌지컬연구소', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#6e6390'
      })
      .setOrigin(0.5);
  }
}
