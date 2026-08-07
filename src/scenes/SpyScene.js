import Phaser from 'phaser';
import {
  GAME_W,
  GAME_H,
  SPY_TIME_MS,
  SPY_REWARD_COINS,
  SPY_REWARD_DIAMONDS,
  SPY_FAIL_FAME_LOSS
} from '../config.js';
import { BUREAUS } from '../data/bureaus.js';
import { saveState } from '../systems/save.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

// 알리바이 활동 풀 (스파이의 거짓 증언과 무관한 중립 활동)
const ACTIVITIES = [
  '민원 서류 결재',
  '서고 먼지 청소',
  '꿈 필름 정리',
  '알림 차단 순찰',
  '눈물 댐 수위 점검',
  '안테나탑 정비',
  '커피(도파민) 배달',
  '결재 도장 잉크 충전'
];

const NEUTRAL_SUFFIX = [
  '중이었습니다. 정말입니다.',
  '중이었습니다. 바빠 죽는 줄 알았네요.',
  '중이었습니다. 증인도 있어요.',
  '중이었습니다. 야근 수당 주세요.'
];

export class SpyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Spy' });
  }

  create() {
    this.state = this.registry.get('state');
    this.done = false;

    this.add.image(GAME_W / 2, GAME_H / 2, 'kingdom-ground').setAlpha(0.35);

    this.add
      .text(GAME_W / 2, 90, '🕵️ 뇌정부 감사실 — 스파이 색출', {
        fontFamily: FONT,
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffd9a0'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 140, '딴생각 스파이가 침투했습니다!\n증언을 대조해 거짓말하는 국장을 탭하세요.', {
        fontFamily: FONT,
        fontSize: '23px',
        color: '#a99cc7',
        align: 'center',
        lineSpacing: 6
      })
      .setOrigin(0.5);

    this.timeLeft = SPY_TIME_MS;
    this.timerText = this.add
      .text(GAME_W / 2, 205, '', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffe9a0' })
      .setOrigin(0.5);

    this.buildCase();
    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  // 사건 생성: 5개 국 증언, 스파이는 목격자와의 거짓 알리바이를 주장
  buildCase() {
    const lineup = Phaser.Utils.Array.Shuffle([...BUREAUS]).slice(0, 5);
    this.spy = Phaser.Utils.Array.GetRandom(lineup);
    const witness = Phaser.Utils.Array.GetRandom(lineup.filter((b) => b !== this.spy));
    const acts = Phaser.Utils.Array.Shuffle([...ACTIVITIES]);

    const testimonies = lineup.map((b, i) => {
      if (b === this.spy) {
        return { b, text: `저는 ${witness.keeper.name}과(와) 함께 ${acts[0]}을(를) 했습니다.` };
      }
      if (b === witness) {
        return { b, text: `저는 혼자서 ${acts[1]} 중이었습니다. 아무도 없었어요.` };
      }
      return {
        b,
        text: `저는 ${acts[2 + i]} ${Phaser.Utils.Array.GetRandom(NEUTRAL_SUFFIX)}`
      };
    });
    Phaser.Utils.Array.Shuffle(testimonies);

    this.cardObjs = [];
    testimonies.forEach((t, i) => {
      const y = 320 + i * 158;
      const card = this.add.container(GAME_W / 2, y);
      const bgRect = this.add
        .rectangle(0, 0, 620, 140, 0x1a0f2e, 0.95)
        .setStrokeStyle(2, t.b.color, 0.8);
      card.add(bgRect);
      card.add(this.add.image(-260, 0, `pet-${t.b.id}-1`).setScale(0.62));
      card.add(
        this.add
          .text(-195, -42, `${t.b.keeper.name} (${t.b.name})`, {
            fontFamily: FONT,
            fontSize: '23px',
            fontStyle: 'bold',
            color: '#' + t.b.color.toString(16).padStart(6, '0')
          })
          .setOrigin(0, 0.5)
      );
      card.add(
        this.add
          .text(-195, 12, `“${t.text}”`, {
            fontFamily: FONT,
            fontSize: '23px',
            color: '#e8dff5',
            wordWrap: { width: 480 },
            lineSpacing: 4
          })
          .setOrigin(0, 0.5)
      );
      bgRect.setInteractive({ useHandCursor: true });
      bgRect.on('pointerdown', () => this.accuse(t.b, card));
      this.cardObjs.push({ card, bureau: t.b, bgRect });
    });
  }

  accuse(bureau, card) {
    if (this.done) return;
    this.done = true;
    sfx.ui();

    const correct = bureau === this.spy;
    // 정답 카드 강조
    for (const o of this.cardObjs) {
      if (o.bureau === this.spy) {
        o.bgRect.setFillStyle(correct ? 0x2d4a2d : 0x4a1a22, 1);
        o.bgRect.setStrokeStyle(4, correct ? 0x53a860 : 0xe8565e, 1);
        this.tweens.add({ targets: o.card, scale: { from: 1.06, to: 1 }, duration: 300, ease: 'back.out' });
      } else {
        this.tweens.add({ targets: o.card, alpha: 0.45, duration: 300 });
      }
    }

    if (correct) {
      sfx.fanfare();
      this.time.delayedCall(400, () => sfx.gem());
      this.state.coins += SPY_REWARD_COINS;
      this.state.diamonds += SPY_REWARD_DIAMONDS;
      this.showResult(
        '정체 발각!',
        `${this.spy.keeper.name}의 몸에서 공상 구름 조각이 발견되었습니다.\n혼자 있었다는 증인과의 알리바이가 거짓이었군요!`,
        `🪙 +${SPY_REWARD_COINS}   💎 +${SPY_REWARD_DIAMONDS}`,
        '#ffd9a0'
      );
    } else {
      sfx.wrong();
      this.time.delayedCall(300, () => sfx.danger());
      for (const b of BUREAUS) {
        const s = this.state.bureaus[b.id];
        s.fame = Math.max(0, s.fame - SPY_FAIL_FAME_LOSS);
      }
      this.showResult(
        '무고한 시민을 지목했다…',
        `혼란을 틈타 진짜 스파이(${this.spy.keeper.name})는 도주했습니다.\n공화국의 신뢰도가 흔들립니다.`,
        `전 국 인지도 -${SPY_FAIL_FAME_LOSS}`,
        '#e8565e'
      );
    }
    saveState(this.state);
  }

  timeout() {
    if (this.done) return;
    this.done = true;
    sfx.danger();
    for (const b of BUREAUS) {
      const s = this.state.bureaus[b.id];
      s.fame = Math.max(0, s.fame - SPY_FAIL_FAME_LOSS);
    }
    saveState(this.state);
    this.showResult(
      '시간 초과…',
      `스파이(${this.spy.keeper.name})는 유유히 사라졌습니다.`,
      `전 국 인지도 -${SPY_FAIL_FAME_LOSS}`,
      '#e8565e'
    );
  }

  showResult(title, body, rewardLine, color) {
    const dim = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.55).setDepth(50).setInteractive();
    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(0x1a0f2e, 0.98);
    panel.fillRoundedRect(70, 420, GAME_W - 140, 440, 24);
    panel.lineStyle(3, 0x8a6fc0, 0.9);
    panel.strokeRoundedRect(70, 420, GAME_W - 140, 440, 24);
    this.add
      .text(GAME_W / 2, 490, title, { fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color })
      .setOrigin(0.5)
      .setDepth(52);
    this.add
      .text(GAME_W / 2, 600, body, {
        fontFamily: FONT,
        fontSize: '25px',
        color: '#e8dff5',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 520 }
      })
      .setOrigin(0.5)
      .setDepth(52);
    this.add
      .text(GAME_W / 2, 700, rewardLine, { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffe9a0' })
      .setOrigin(0.5)
      .setDepth(52);
    const btn = this.add
      .image(GAME_W / 2, 790, 'button')
      .setScale(0.78, 0.68)
      .setDepth(52)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_W / 2, 790, '확인', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#3a1c05' })
      .setOrigin(0.5)
      .setDepth(53);
    btn.on('pointerdown', () => {
      sfx.ui();
      this.scene.start('Map', { eventResult: null });
    });
  }

  update(_, deltaMs) {
    if (this.done) return;
    this.timeLeft -= deltaMs;
    const s = Math.max(0, Math.ceil(this.timeLeft / 1000));
    this.timerText.setText(`⏱ ${s}초`);
    this.timerText.setColor(s <= 8 ? '#e8565e' : '#ffe9a0');
    if (this.timeLeft <= 0) this.timeout();
  }
}
