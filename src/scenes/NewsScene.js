import Phaser from 'phaser';
import { GAME_W, GAME_H, COIN_PER_SCORE, FAME_TOP_GAIN, FAME_USED_GAIN, FAME_MAX, MAX_DAYS } from '../config.js';
import { BUREAUS, BUREAU_BY_ID } from '../data/bureaus.js';
import { NEWS_LINES } from '../data/complaints.js';
import { saveState } from '../systems/save.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Galmuri11, Pretendard, sans-serif';

// 뇌보도국 9시 뉴스 — 명예 시스템 정산 (W5·W11)
export class NewsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'News' });
  }

  init(data) {
    this.r = data;
  }

  create() {
    this.st = this.registry.get('state');
    const r = this.r;

    // 정산 (W4·W5)
    const coins = Math.floor(r.score * COIN_PER_SCORE);
    this.st.coins += coins;
    if (r.score > this.st.best) this.st.best = r.score;

    // 최다 활약 부서 = 방송 출연
    const used = Object.entries(r.useCount).sort((a, b) => b[1] - a[1]);
    const top = used[0] && used[0][1] > 0 ? used[0][0] : null;
    const famed = [];
    for (const [id, n] of used) {
      if (n <= 0) continue;
      const gain = id === top ? FAME_TOP_GAIN : FAME_USED_GAIN;
      this.st.fame[id] = Math.min(FAME_MAX, this.st.fame[id] + gain);
      famed.push([id, gain]);
    }
    if (!r.collapsed) this.st.day = Math.min(this.st.day + 1, MAX_DAYS + 6);
    saveState(this.st);

    // ---- 연출 ----
    this.add.image(GAME_W / 2, GAME_H / 2, 'sky').setAlpha(0.5);
    const panel = this.add.graphics();
    panel.fillStyle(0x0c0616, 0.94);
    panel.fillRect(0, 130, GAME_W, 1020);
    panel.fillStyle(0xb5443c, 1);
    panel.fillRect(0, 130, GAME_W, 8);
    panel.fillRect(0, 1142, GAME_W, 8);

    this.add
      .text(GAME_W / 2, 200, '📺 뇌보도국 9시 뉴스', {
        fontFamily: FONT,
        fontSize: '42px',
        fontStyle: 'bold',
        color: '#ffd9a0'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 268, NEWS_LINES.open, {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#c9b8e8',
        align: 'center',
        wordWrap: { width: 600 }
      })
      .setOrigin(0.5);

    // 결과 요약
    this.add
      .text(
        GAME_W / 2,
        380,
        r.collapsed
          ? '⚠ 주인님 멘탈 붕괴로 조기 퇴근했습니다…'
          : `오늘의 협력 실적 — 민원 ${r.resolved}건 해결!`,
        { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: r.collapsed ? '#ff8a8a' : '#ffffff' }
      )
      .setOrigin(0.5);
    this.add
      .text(
        GAME_W / 2,
        450,
        `SCORE ${r.score.toLocaleString()}  ·  PERFECT ${r.perfects}  ·  최대 콤보 ${r.maxCombo}\n급여 지급  🪙 +${coins.toLocaleString()}`,
        { fontFamily: FONT, fontSize: '25px', color: '#ffe9a0', align: 'center', lineSpacing: 10 }
      )
      .setOrigin(0.5);

    // 방송 출연 (명예 시스템)
    let y = 570;
    if (top) {
      const tb = BUREAU_BY_ID[top];
      // 인터뷰이 캐릭터
      const spr = this.add.sprite(140, y + 60, `cz-${top}-idle`).setScale(2.2);
      this.tweens.add({ targets: spr, y: y + 54, duration: 700, yoyo: true, repeat: -1, ease: 'sine.inout' });
      this.add
        .text(400, y, NEWS_LINES.topFmt(tb.name, r.useCount[top]), {
          fontFamily: FONT,
          fontSize: '25px',
          fontStyle: 'bold',
          color: '#fff6e3',
          wordWrap: { width: 420 },
          lineSpacing: 6
        })
        .setOrigin(0.5, 0);
      this.add
        .text(400, y + 110, `${tb.keeper}: "다 같이 뛰었을 뿐입니다. 특히 신입이 잘 뛰더군요."`, {
          fontFamily: FONT,
          fontSize: '21px',
          fontStyle: 'italic',
          color: '#a99cc7',
          wordWrap: { width: 420 },
          lineSpacing: 6
        })
        .setOrigin(0.5, 0);
      y += 220;
    }

    // 인지도 상승 목록
    if (famed.length > 0) {
      const lines = famed
        .map(([id, gain]) => `${BUREAU_BY_ID[id].name} 인지도 +${gain}${id === top ? ' (방송 출연!)' : ''}`)
        .join('\n');
      this.add
        .text(GAME_W / 2, y + 20, lines, {
          fontFamily: FONT,
          fontSize: '22px',
          color: '#a8f0e6',
          align: 'center',
          lineSpacing: 8
        })
        .setOrigin(0.5, 0);
      y += 40 + famed.length * 30;
    }

    this.add
      .text(GAME_W / 2, Math.max(y + 40, 960), NEWS_LINES.close, {
        fontFamily: FONT,
        fontSize: '21px',
        color: '#8a7fa8'
      })
      .setOrigin(0.5);

    const btn = this.add.image(GAME_W / 2, 1215, 'button').setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_W / 2, 1215, '공화국으로', { fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#3a1c05' })
      .setOrigin(0.5);
    btn.on('pointerdown', () => {
      sfx.ui();
      this.scene.start('Home');
    });

    sfx.coin();
    this.time.delayedCall(300, () => sfx.fanfare());
  }
}
