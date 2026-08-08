import Phaser from 'phaser';
import { GAME_W, GAME_H, GRADES, EP01_BEST_KEY, MENTAL_MAX } from '../config.js';
import { BUREAU_BY_ID } from '../data/bureaus.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

export class Ep01ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Ep01Result' });
  }

  init(data) {
    this.result = data;
  }

  create() {
    this.add.image(GAME_W / 2, GAME_H / 2, 'bg');
    const { failed, score, mental, maxCombo, stats } = this.result;

    // 최종 점수 = 점수 + 멘탈 잔량 보너스
    const finalScore = score + mental * 20;
    const grade = failed ? GRADES[GRADES.length - 1] : GRADES.find((g) => finalScore >= g.min);

    // 최고 기록
    const prevBest = Number(localStorage.getItem(EP01_BEST_KEY) || 0);
    const isBest = finalScore > prevBest;
    if (isBest) localStorage.setItem(EP01_BEST_KEY, String(finalScore));

    this.add
      .text(GAME_W / 2, 130, failed ? '멘탈 붕괴…' : '면접 종료!', {
        fontFamily: FONT,
        fontSize: '54px',
        fontStyle: 'bold',
        color: failed ? '#e8565e' : '#ffd9a0'
      })
      .setOrigin(0.5);

    // 등급 도장
    const gradeText = this.add
      .text(GAME_W / 2, 300, grade.grade, {
        fontFamily: FONT,
        fontSize: '200px',
        fontStyle: 'bold',
        color: failed ? '#e8565e' : '#ffd9a0',
        stroke: failed ? '#5e1a1e' : '#7a3b12',
        strokeThickness: 14
      })
      .setOrigin(0.5)
      .setAngle(-8)
      .setScale(3)
      .setAlpha(0);
    this.tweens.add({
      targets: gradeText,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'back.in',
      onComplete: () => sfx.stamp()
    });

    this.add
      .text(GAME_W / 2, 470, grade.label, {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#e8dff5',
        align: 'center',
        wordWrap: { width: 600 }
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_W / 2,
        560,
        `최종 점수  ${finalScore.toLocaleString()}${isBest ? '  (신기록!)' : ''}\n` +
          `멘탈 잔량  ${mental}/${MENTAL_MAX}  ·  최대 콤보  ${maxCombo}`,
        {
          fontFamily: FONT,
          fontSize: '30px',
          color: '#ffffff',
          align: 'center',
          lineSpacing: 10
        }
      )
      .setOrigin(0.5);

    this.buildRanking(stats);

    // 기자 클로징 멘트 + 이스터에그 (파일럿 스크립트 S13~S16 오마주)
    this.add
      .text(
        GAME_W / 2,
        955,
        '기자: "이상 뇌정부청사 현장이었습니다. …어?\n[말실수팀] 방금 자막의 \'합격\'이 \'햡격\'으로 발송됐다는 제보가—"',
        {
          fontFamily: FONT,
          fontSize: '22px',
          fontStyle: 'italic',
          color: '#a99cc7',
          align: 'center',
          lineSpacing: 6
        }
      )
      .setOrigin(0.5);

    // 버튼
    const retry = this.add.image(GAME_W / 2, 1050, 'button').setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_W / 2, 1050, '재도전', { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#3a1c05' })
      .setOrigin(0.5);
    retry.on('pointerdown', () => {
      sfx.start();
      this.scene.start('Ep01');
    });

    const home = this.add.image(GAME_W / 2, 1170, 'button-dark').setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_W / 2, 1170, '에피소드 목록으로', { fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#d8cfec' })
      .setOrigin(0.5);
    home.on('pointerdown', () => {
      sfx.ui();
      this.scene.start('Title');
    });
  }

  // 부서 활약 랭킹 — 원작 "이달의 등장 횟수" 명예 시스템 오마주
  buildRanking(stats) {
    const entries = Object.entries(stats);
    const topResolved = entries.slice().sort((a, b) => b[1].resolved - a[1].resolved)[0];
    const topBurst = entries.slice().sort((a, b) => b[1].burst - a[1].burst)[0];

    const y = 700;
    const g = this.add.graphics();
    g.fillStyle(0x0c0616, 0.85);
    g.fillRoundedRect(60, y - 44, GAME_W - 120, 220, 18);
    g.lineStyle(2, 0x5a4a80, 0.6);
    g.strokeRoundedRect(60, y - 44, GAME_W - 120, 220, 18);

    this.add
      .text(GAME_W / 2, y, '── 뇌정부 인사발령 속보 ──', {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#c9b8e8'
      })
      .setOrigin(0.5);

    const lines = [];
    if (topResolved && topResolved[1].resolved > 0) {
      const b = BUREAU_BY_ID[topResolved[0]];
      lines.push(`🏆 이달의 우수 부서: ${b.name} (위기 ${topResolved[1].resolved}건 해결)`);
    }
    if (topBurst && topBurst[1].burst > 0) {
      const b = BUREAU_BY_ID[topBurst[0]];
      lines.push(`📋 긴급 감사 대상: ${b.name} (폭주 ${topBurst[1].burst}건)`);
    }
    if (lines.length === 0) lines.push('전 부서 이상 무. 완벽한 하루였습니다.');

    this.add
      .text(GAME_W / 2, y + 90, lines.join('\n\n'), {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#e8dff5',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: 540 }
      })
      .setOrigin(0.5);
  }
}
