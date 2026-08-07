import Phaser from 'phaser';
import { GAME_W, GAME_H, TOTAL_DEPTS } from '../config.js';
import { BUREAUS } from '../data/bureaus.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

export class EndingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Ending' });
  }

  create() {
    this.state = this.registry.get('state');
    this.add.image(GAME_W / 2, GAME_H / 2, 'kingdom-ground');

    sfx.fanfare();
    this.time.delayedCall(600, () => sfx.fanfare());

    this.add
      .text(GAME_W / 2, 260, '두뇌공화국 완성!', {
        fontFamily: FONT,
        fontSize: '76px',
        fontStyle: 'bold',
        color: '#ffd9a0',
        stroke: '#7a3b12',
        strokeThickness: 12
      })
      .setOrigin(0.5)
      .setScale(0)
      .setDepth(10)
      .setName('title');
    this.tweens.add({ targets: this.children.getByName('title'), scale: 1, duration: 500, ease: 'back.out' });

    this.add
      .text(
        GAME_W / 2,
        400,
        `6개 국, ${TOTAL_DEPTS.toLocaleString()}개 부서가 모두 깨어났습니다.\n주인의 뇌가 그 어느 때보다 건강하게 빛납니다.`,
        {
          fontFamily: FONT,
          fontSize: '30px',
          color: '#e8dff5',
          align: 'center',
          lineSpacing: 10
        }
      )
      .setOrigin(0.5)
      .setDepth(10);

    // 국장 단체 사진
    BUREAUS.forEach((b, i) => {
      const x = 120 + (i % 3) * 240;
      const y = 620 + Math.floor(i / 3) * 220;
      const pet = this.add.image(x, y, `pet-${b.id}-3`).setScale(1.2).setDepth(10);
      this.tweens.add({
        targets: pet,
        y: y - 12,
        duration: 900 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inout'
      });
      this.add
        .text(x, y + 105, b.keeper.name, { fontFamily: FONT, fontSize: '22px', color: '#c9b8e8' })
        .setOrigin(0.5)
        .setDepth(10);
    });

    // 폭죽
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        const p = this.add.particles(
          Phaser.Math.Between(100, GAME_W - 100),
          Phaser.Math.Between(200, 700),
          'dot',
          {
            speed: { min: 120, max: 320 },
            lifespan: 800,
            quantity: 30,
            scale: { start: 0.8, end: 0 },
            tint: [0xffe9a0, 0xff8aa0, 0x53c2d4, 0xb069e8],
            emitting: false
          }
        );
        p.explode(30);
        this.time.delayedCall(900, () => p.destroy());
      }
    });

    this.add
      .text(GAME_W / 2, 1030, '…그리고 공화국의 하루는 내일도 계속됩니다.', {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#a99cc7'
      })
      .setOrigin(0.5)
      .setDepth(10);

    const btn = this.add
      .image(GAME_W / 2, 1140, 'button')
      .setScale(0.9, 0.8)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_W / 2, 1140, '공화국으로 돌아가기', {
        fontFamily: FONT,
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#3a1c05'
      })
      .setOrigin(0.5)
      .setDepth(11);
    btn.on('pointerdown', () => this.scene.start('Map'));
  }
}
