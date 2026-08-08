import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Galmuri11, Pretendard, "Apple SD Gothic Neo", sans-serif';

// EP01 오프닝 — 파일럿 스크립트의 훅(S1~S3) 재현:
// 면접실의 지원자 → 눈동자 흔들림 → 뇌정부청사 사이렌, 기자 생중계로 전환.
const LINES = [
  ['자막', '오전 10시. 주인님 인생 최대의 면접이 시작된다.'],
  ['면접관', '"자, 그럼… 자기소개 부탁드립니다."'],
  ['자막', '(지원자의 눈동자가 아주 미세하게 흔들린다)'],
  ['뇌보도국 기자', '🚨 속보입니다! 뇌정부청사에 비상 사이렌이 울렸습니다!\n전 부서 위기 대응 태세 돌입!'],
  ['뇌보도국 기자', '시청자 여러분, 저는 지금 현장에 나와 있습니다.\n관리자님! 6개 국의 위기를 실시간으로 처리해 주십시오!']
];

export class Ep01IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Ep01Intro' });
  }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'bg');

    this.add
      .text(GAME_W / 2, 170, 'EP01', {
        fontFamily: FONT,
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#8a7fa8'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 240, '면접 대작전', {
        fontFamily: FONT,
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ffd9a0',
        stroke: '#7a3b12',
        strokeThickness: 10
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 312, '— 뇌보도국 특별 생중계 —', {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#c9b8e8'
      })
      .setOrigin(0.5);

    // 면접장 실루엣 (훅 장면)
    const sil = this.add.graphics();
    sil.fillStyle(0x2a1c45, 1);
    sil.fillCircle(250, 500, 46);
    sil.fillRoundedRect(192, 548, 116, 80, 16);
    sil.fillStyle(0x3d2a60, 1);
    sil.fillCircle(470, 500, 46);
    sil.fillRoundedRect(412, 548, 116, 80, 16);
    this.add
      .text(250, 660, '면접관', { fontFamily: FONT, fontSize: '22px', color: '#7e6ea8' })
      .setOrigin(0.5);
    this.add
      .text(470, 660, '주인님 (겉으로는 침착)', { fontFamily: FONT, fontSize: '22px', color: '#7e6ea8' })
      .setOrigin(0.5);

    // 대사 박스
    const box = this.add.graphics();
    box.fillStyle(0x1a0f2e, 0.96);
    box.fillRoundedRect(50, 760, GAME_W - 100, 280, 20);
    box.lineStyle(3, 0x8a6fc0, 0.8);
    box.strokeRoundedRect(50, 760, GAME_W - 100, 280, 20);
    this.speaker = this.add
      .text(90, 800, '', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#ffd9a0' })
      .setOrigin(0, 0.5);
    this.line = this.add
      .text(90, 845, '', {
        fontFamily: FONT,
        fontSize: '27px',
        color: '#e8dff5',
        lineSpacing: 8,
        wordWrap: { width: GAME_W - 180 }
      })
      .setOrigin(0, 0);

    const hint = this.add
      .text(GAME_W / 2, 1080, '▼ 탭하여 계속', { fontFamily: FONT, fontSize: '22px', color: '#8a7fa8' })
      .setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    const skip = this.add
      .text(GAME_W - 44, 170, '건너뛰기 ≫', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#6e6390',
        backgroundColor: '#12081fcc',
        padding: { x: 10, y: 6 }
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    skip.on('pointerdown', (p, lx, ly, ev) => {
      ev.stopPropagation();
      this.begin();
    });

    this.idx = 0;
    this.show();
    this.input.on('pointerdown', () => this.next());
  }

  show() {
    const [who, text] = LINES[this.idx];
    this.speaker.setText(who);
    this.line.setText(text);
    if (this.idx === 3) {
      sfx.siren();
      this.cameras.main.shake(200, 0.006);
    } else {
      sfx.tap();
    }
  }

  next() {
    this.idx += 1;
    if (this.idx < LINES.length) {
      this.show();
    } else {
      this.begin();
    }
  }

  begin() {
    this.input.removeAllListeners('pointerdown');
    sfx.wave();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, () => this.scene.start('Ep01'));
  }
}
