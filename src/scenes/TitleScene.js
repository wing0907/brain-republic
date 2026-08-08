import Phaser from 'phaser';
import { GAME_W, GAME_H, STORAGE_KEY } from '../config.js';
import { BUREAUS } from '../data/bureaus.js';
import { unlock, sfx, music } from '../systems/audio.js';
import { resetState, freshState } from '../systems/save.js';

const FONT = 'Galmuri11, Pretendard, sans-serif';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Title' });
  }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'sky');
    this.add.image(GAME_W / 2, GAME_H - 180, 'ground').setOrigin(0.5, 0.5);

    // 스카이라인 실루엣 (장식)
    BUREAUS.forEach((b, i) => {
      const x = 90 + i * 110;
      this.add.image(x, 1105, `bld-${b.id}-1`).setOrigin(0.5, 1).setAlpha(0.9);
    });
    this.add.image(GAME_W / 2, 1120, 'bld-hall').setOrigin(0.5, 1).setDepth(2);

    // 걸어다니는 시민들 (세계관이 살아있는 타이틀)
    for (let i = 0; i < 4; i++) {
      const b = Phaser.Utils.Array.GetRandom(BUREAUS);
      const y = 1120 + i * 26;
      const spr = this.add.sprite(Phaser.Math.Between(60, 660), y, `cz-${b.id}-idle`).setDepth(3);
      spr.play(`cz-${b.id}-run`);
      const dir = i % 2 === 0 ? 1 : -1;
      spr.setFlipX(dir < 0);
      this.tweens.add({
        targets: spr,
        x: dir > 0 ? 780 : -60,
        duration: Phaser.Math.Between(9000, 14000),
        repeat: -1,
        onRepeat: () => {
          spr.x = dir > 0 ? -60 : 780;
        }
      });
    }

    this.add
      .text(GAME_W / 2, 200, '두뇌공화국', {
        fontFamily: FONT,
        fontSize: '88px',
        fontStyle: 'bold',
        color: '#ffd9a0',
        stroke: '#7a3b12',
        strokeThickness: 10
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 286, '신입 공무원 분투기', {
        fontFamily: FONT,
        fontSize: '46px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 360, '당신은 오늘 입사했다.\n혼자서는 아무것도 해결할 수 없다 — 부서와 협력하라!', {
        fontFamily: FONT,
        fontSize: '25px',
        color: '#ffe9c9',
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5);

    const st = this.registry.get('state');
    const hasSave = st.day > 1 || st.coins > 0 || st.best > 0;

    const btn = this.add.image(GAME_W / 2, 560, 'button').setInteractive({ useHandCursor: true });
    const label = this.add
      .text(GAME_W / 2, 560, hasSave ? `${st.day}일차 출근하기` : '입사하기', {
        fontFamily: FONT,
        fontSize: '42px',
        fontStyle: 'bold',
        color: '#3a1c05'
      })
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
      this.time.delayedCall(320, () => this.scene.start('Home'));
    });

    // 발령 안내 (세계관: 취업 경쟁 W2)
    this.add
      .text(GAME_W / 2, 660, '발령: 기억인지국 (연타 업무가 전문 분야가 됩니다)', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#c9b8e8'
      })
      .setOrigin(0.5);

    // 처음부터 (2탭 확인)
    if (hasSave) {
      let armed = false;
      const reset = this.add
        .text(GAME_W / 2, 730, '사직서 제출 (처음부터)', { fontFamily: FONT, fontSize: '22px', color: '#6e6390' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      reset.on('pointerdown', () => {
        unlock();
        sfx.ui();
        if (!armed) {
          armed = true;
          reset.setText('⚠ 정말 사직하시겠습니까? 한 번 더 탭').setColor('#ff8a8a');
          this.time.delayedCall(2500, () => {
            armed = false;
            reset.setText('사직서 제출 (처음부터)').setColor('#6e6390');
          });
        } else {
          resetState();
          this.registry.set('state', freshState());
          this.scene.restart();
        }
      });
    }

    this.add
      .text(GAME_W / 2, 980, '원작·기획  성지은', { fontFamily: FONT, fontSize: '22px', color: '#ffe9c9' })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(GAME_W / 2, 1015, 'NAN 2026 — NHN Game × AI Hackathon · 팀 뇌지컬연구소', {
        fontFamily: FONT,
        fontSize: '19px',
        color: '#d8b8a0'
      })
      .setOrigin(0.5)
      .setDepth(5);
  }
}
