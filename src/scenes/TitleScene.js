import Phaser from 'phaser';
import { GAME_W, GAME_H, EP01_BEST_KEY } from '../config.js';
import { unlock, sfx, music } from '../systems/audio.js';

const FONT = 'Galmuri11, Pretendard, "Apple SD Gothic Neo", sans-serif';

// 에피소드 허브 — 원작 확장 계획(슬라이스 오브 라이프 시리즈) 구조 그대로:
// EP01(파일럿·면접 대작전)은 플레이 가능, 이후 에피소드는 차차 공개.
const LOCKED_EPS = [
  { no: 'EP02', title: '눈물참기훈련팀의 하루', desc: '슬픈 영화 시사회 경비 임무' },
  { no: 'EP03', title: '핸드폰중독관리팀 야간 순찰', desc: '새벽 3시, 릴스의 유혹' },
  { no: 'EP04', title: '꿈제작팀 신작 상영회', desc: '예산 부족, 그래도 꿈은 만든다' }
];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Title' });
  }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'kingdom-ground');

    this.add
      .text(GAME_W / 2, 130, '두뇌공화국', {
        fontFamily: FONT,
        fontSize: '84px',
        fontStyle: 'bold',
        color: '#ffd9a0',
        stroke: '#7a3b12',
        strokeThickness: 10
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 208, '당신의 무의식 하나하나가, 1,428개 부서의 업무입니다', {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#c9b8e8'
      })
      .setOrigin(0.5);

    // ---- EP01 메인 카드 ----
    const best = Number(localStorage.getItem(EP01_BEST_KEY) || 0);
    const card = this.add.graphics();
    card.fillStyle(0x241638, 0.96);
    card.fillRoundedRect(50, 280, GAME_W - 100, 230, 22);
    card.lineStyle(4, 0xff8c42, 1);
    card.strokeRoundedRect(50, 280, GAME_W - 100, 230, 22);
    this.add
      .text(90, 330, 'EP01 · 파일럿', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ff8c42' })
      .setOrigin(0, 0.5);
    this.add
      .text(90, 382, '면접 대작전', { fontFamily: FONT, fontSize: '48px', fontStyle: 'bold', color: '#fff6e3' })
      .setOrigin(0, 0.5);
    this.add
      .text(90, 434, best > 0 ? `면접 3분, 멘탈을 사수하라!  ·  최고 ${best.toLocaleString()}점` : '면접 3분, 멘탈을 사수하라!', {
        fontFamily: FONT,
        fontSize: '23px',
        color: '#a99cc7'
      })
      .setOrigin(0, 0.5);

    const play = this.add
      .image(GAME_W - 150, 395, 'button')
      .setDisplaySize(160, 120)
      .setInteractive({ useHandCursor: true });
    const playTxt = this.add
      .text(GAME_W - 150, 395, '▶\n플레이', {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#3a1c05',
        align: 'center'
      })
      .setOrigin(0.5);
    // setDisplaySize가 만든 기준 스케일 비례로 펄스 (절대값 트윈 금지 — 커짐 버그 방지)
    const bx = play.scaleX;
    const by = play.scaleY;
    this.tweens.add({
      targets: play,
      scaleX: { from: bx, to: bx * 1.06 },
      scaleY: { from: by, to: by * 1.06 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inout'
    });
    this.tweens.add({
      targets: playTxt,
      scale: { from: 1, to: 1.06 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inout'
    });
    play.on('pointerdown', () => {
      unlock();
      sfx.start();
      music.start();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start('Ep01Intro'));
    });

    // ---- 잠긴 에피소드 (확장 계획) ----
    this.add
      .text(GAME_W / 2, 560, '── 다음 에피소드 (확장 계획) ──', {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#8a7fa8'
      })
      .setOrigin(0.5);
    LOCKED_EPS.forEach((ep, i) => {
      const y = 630 + i * 108;
      const g = this.add.graphics();
      g.fillStyle(0x1a0f2e, 0.85);
      g.fillRoundedRect(70, y - 42, GAME_W - 140, 88, 16);
      g.lineStyle(2, 0x5a4a80, 0.5);
      g.strokeRoundedRect(70, y - 42, GAME_W - 140, 88, 16);
      this.add
        .text(104, y - 14, `🔒 ${ep.no} · ${ep.title}`, {
          fontFamily: FONT,
          fontSize: '26px',
          fontStyle: 'bold',
          color: '#8a7fa8'
        })
        .setOrigin(0, 0.5);
      this.add
        .text(104, y + 22, `${ep.desc} — 준비 중`, { fontFamily: FONT, fontSize: '20px', color: '#6e6390' })
        .setOrigin(0, 0.5);
    });

    // ---- 번외 모드 ----
    this.add
      .text(GAME_W / 2, 990, '── 번외 실험실 ──', { fontFamily: FONT, fontSize: '22px', color: '#6e6390' })
      .setOrigin(0.5);
    const king = this.add
      .image(190, 1060, 'button-dark')
      .setScale(0.75, 0.62)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(190, 1060, '🏰 왕국 키우기', { fontFamily: FONT, fontSize: '25px', fontStyle: 'bold', color: '#d8cfec' })
      .setOrigin(0.5);
    king.on('pointerdown', () => {
      unlock();
      sfx.ui();
      music.start();
      this.scene.start('Map');
    });
    const cube = this.add
      .image(530, 1060, 'button-dark')
      .setScale(0.75, 0.62)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(530, 1060, '🧊 3D 코어 원정대', { fontFamily: FONT, fontSize: '25px', fontStyle: 'bold', color: '#a8e8f0' })
      .setOrigin(0.5);
    cube.on('pointerdown', () => {
      window.location.href = './unity/';
    });

    this.add
      .text(GAME_W / 2, 1160, '원작·기획  성지은', { fontFamily: FONT, fontSize: '22px', color: '#8a7fa8' })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 1198, 'NAN 2026 — NHN Game × AI Hackathon 출품작 · 팀 뇌지컬연구소', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#6e6390'
      })
      .setOrigin(0.5);
  }
}
