import Phaser from 'phaser';
import {
  GAME_W,
  GAME_H,
  DAY_SECONDS,
  MENTAL_MAX,
  MENTAL_TIMEOUT_DMG,
  MENTAL_RESOLVE_HEAL,
  MENTAL_WRONG_TAP,
  CARD_TIME_MS,
  STEP_MASH,
  STEP_HOLD_MS,
  STEP_SWIPE,
  PLAYER_BUREAU,
  SCORE_STEP,
  SCORE_CARD,
  PERFECT_LIFE,
  PERFECT_MULT,
  COMBO_STEP,
  MULT_MAX,
  COIN_PER_SCORE
} from '../config.js';
import { BUREAUS, BUREAU_BY_ID } from '../data/bureaus.js';
import { COMPLAINTS } from '../data/complaints.js';
import { sfx, music } from '../systems/audio.js';

const FONT = 'Galmuri11, Pretendard, sans-serif';

// 시간대 자막 (주인의 하루 W12)
const DAYTIMES = ['AM 7:00 기상', 'AM 9:00 출근길', 'PM 12:00 점심', 'PM 3:00 업무', 'PM 7:00 저녁', 'PM 11:00 취침 전'];

const LANE_Y = 850;       // 협력 무대(거리) 기준선
const PLAYER_X = 130;
const HELPER_X = 400;     // 담당자 도착 위치

export class RushScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Rush' });
  }

  create() {
    this.st = this.registry.get('state');
    this.day = Math.min(this.st.day, 3);

    this.elapsed = 0;
    this.mental = MENTAL_MAX;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfects = 0;
    this.resolved = 0;
    this.useCount = Object.fromEntries(BUREAUS.map((b) => [b.id, 0]));
    this.over = false;
    this.card = null;       // 현재 민원
    this.helper = null;     // 현재 달려온 담당자
    this.inputMode = null;  // 'await-call' | 'gesture' | null
    this.musicFast = false;

    // 민원 풀 (일차 이하 전부, 셔플 순환)
    this.pool = Phaser.Utils.Array.Shuffle(COMPLAINTS.filter((c) => c.day <= this.day));
    this.poolIdx = 0;

    this.add.image(GAME_W / 2, GAME_H / 2, 'sky');
    this.add.image(GAME_W / 2, LANE_Y + 120, 'ground');

    this.buildTop();
    this.buildLane();
    this.buildCallButtons();
    this.buildGestureLayer();

    this.time.delayedCall(600, () => this.nextCard());
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  // ---------- 상단: 주인 상태 ----------

  buildTop() {
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0x0c0616, 0.9);
    g.fillRect(0, 0, GAME_W, 190);
    g.fillStyle(0x5a4a80, 1);
    g.fillRect(0, 190, GAME_W, 3);

    this.dayText = this.add
      .text(36, 40, `${this.st.day}일차`, { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#ffd9a0' })
      .setOrigin(0, 0.5)
      .setDepth(31);
    this.timeText = this.add
      .text(GAME_W - 36, 40, '', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(1, 0.5)
      .setDepth(31);
    this.daytimeText = this.add
      .text(GAME_W / 2, 40, DAYTIMES[0], { fontFamily: FONT, fontSize: '24px', color: '#c9b8e8' })
      .setOrigin(0.5)
      .setDepth(31);

    this.add
      .text(36, 92, '주인님 멘탈', { fontFamily: FONT, fontSize: '20px', color: '#c9b8e8' })
      .setOrigin(0, 0.5)
      .setDepth(31);
    this.mentalBar = this.add.graphics().setDepth(31);

    this.scoreText = this.add
      .text(36, 148, 'SCORE 0', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0, 0.5)
      .setDepth(31);
    this.comboText = this.add
      .text(GAME_W - 36, 148, '', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#ffe9a0' })
      .setOrigin(1, 0.5)
      .setDepth(31);
    this.drawMental();
  }

  drawMental() {
    const g = this.mentalBar;
    const x = 200;
    const y = 80;
    const w = GAME_W - 236;
    const h = 22;
    g.clear();
    g.fillStyle(0x241638, 1);
    g.fillRect(x, y, w, h);
    const p = Phaser.Math.Clamp(this.mental / MENTAL_MAX, 0, 1);
    if (p > 0) {
      g.fillStyle(p > 0.5 ? 0x53c2b4 : p > 0.25 ? 0xf0c541 : 0xe8565e, 1);
      g.fillRect(x, y, Math.max(8, w * p), h);
    }
    g.lineStyle(2, 0x8a6fc0, 0.8);
    g.strokeRect(x, y, w, h);
  }

  // ---------- 무대: 나 + 담당자 ----------

  buildLane() {
    this.player = this.add.sprite(PLAYER_X, LANE_Y, 'player-idle').setDepth(20).setScale(1.25);
    this.tweens.add({ targets: this.player, y: LANE_Y - 4, duration: 750, yoyo: true, repeat: -1, ease: 'sine.inout' });
    this.add
      .text(PLAYER_X, LANE_Y + 55, '나 (신입)', {
        fontFamily: FONT,
        fontSize: '17px',
        color: '#ffe9c9',
        backgroundColor: '#12081fcc',
        padding: { x: 5, y: 2 }
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  // ---------- 부서 호출 버튼 (3×2) ----------

  buildCallButtons() {
    this.callBtns = {};
    const xs = [126, 360, 594];
    const ys = [1050, 1180];
    BUREAUS.forEach((b, i) => {
      const x = xs[i % 3];
      const y = ys[Math.floor(i / 3)];
      const btn = this.add.image(x, y, `call-${b.id}`).setDepth(25).setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y - 8, b.short, { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#fff6e3' })
        .setOrigin(0.5)
        .setDepth(26);
      const sub = this.add
        .text(x, y + 26, b.id === PLAYER_BUREAU ? '내 전문!' : '호출', {
          fontFamily: FONT,
          fontSize: '16px',
          color: b.id === PLAYER_BUREAU ? '#ffe14a' : '#d8cfec'
        })
        .setOrigin(0.5)
        .setDepth(26);
      btn.on('pointerdown', () => this.onCall(b));
      this.callBtns[b.id] = { btn, label, sub, x, y };
    });
  }

  // 필요 부서 하이라이트
  refreshCallHighlight() {
    const need = this.card && this.inputMode === 'await-call' ? this.card.data.bureaus[this.card.step] : null;
    for (const b of BUREAUS) {
      const v = this.callBtns[b.id];
      const on = b.id === need;
      v.btn.setAlpha(this.inputMode === 'await-call' ? 1 : 0.55);
      v.btn.setScale(on ? 1.08 : 1);
      if (on) {
        this.tweens.killTweensOf(v.btn);
        this.tweens.add({ targets: v.btn, scale: { from: 1.08, to: 1.16 }, duration: 350, yoyo: true, repeat: -1 });
      } else {
        this.tweens.killTweensOf(v.btn);
        v.btn.setScale(1);
      }
    }
  }

  // ---------- 제스처 레이어 (부서별 미니 조작) ----------

  buildGestureLayer() {
    this.gestureZone = this.add
      .rectangle(GAME_W / 2, 640, GAME_W, GAME_H, 0x000000, 0.001)
      .setDepth(40)
      .setVisible(false)
      .setInteractive();
    this.gestureHint = this.add
      .text(GAME_W / 2, 620, '', {
        fontFamily: FONT,
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#fff6e3',
        backgroundColor: '#241638ee',
        padding: { x: 18, y: 12 },
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(41)
      .setVisible(false);
    this.gestureProgress = this.add.graphics().setDepth(41);

    // 2지선다 버튼
    this.choiceA = this.add.image(GAME_W / 2, 700, 'choice-btn').setScale(1.5).setDepth(41).setVisible(false).setInteractive({ useHandCursor: true });
    this.choiceB = this.add.image(GAME_W / 2, 790, 'choice-btn').setScale(1.5).setDepth(41).setVisible(false).setInteractive({ useHandCursor: true });
    this.choiceAText = this.add.text(GAME_W / 2, 700, '', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#3a2a18' }).setOrigin(0.5).setDepth(42).setVisible(false);
    this.choiceBText = this.add.text(GAME_W / 2, 790, '', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#3a2a18' }).setOrigin(0.5).setDepth(42).setVisible(false);

    // 제스처 입력 핸들러
    this.gestureZone.on('pointerdown', (p) => {
      if (this.inputMode !== 'gesture' || !this.gesture) return;
      const gtype = this.gesture.type;
      if (gtype === 'mash') {
        this.gesture.count += 1;
        sfx.tap();
        this.tweens.add({ targets: this.helper, angle: { from: -6, to: 0 }, duration: 70 });
        this.setGestureProgress(this.gesture.count / this.gesture.need);
        if (this.gesture.count >= this.gesture.need) this.stepSuccess();
      } else if (gtype === 'hold') {
        this.gesture.holding = true;
      } else if (gtype === 'swipe') {
        this.gesture.start = { x: p.x, y: p.y };
      }
    });
    this.gestureZone.on('pointermove', (p) => {
      if (this.inputMode !== 'gesture' || !this.gesture) return;
      if (this.gesture.type === 'swipe' && this.gesture.start && p.isDown) {
        const d = Phaser.Math.Distance.Between(this.gesture.start.x, this.gesture.start.y, p.x, p.y);
        this.setGestureProgress(d / STEP_SWIPE);
        if (d >= STEP_SWIPE) {
          this.gesture.start = null;
          this.stepSuccess();
        }
      }
    });
    const up = () => {
      if (!this.gesture) return;
      this.gesture.holding = false;
      if (this.gesture.type === 'swipe') {
        this.gesture.start = null;
        this.setGestureProgress(0);
      }
    };
    this.gestureZone.on('pointerup', up);
    this.gestureZone.on('pointerout', up);
  }

  setGestureProgress(p) {
    const g = this.gestureProgress;
    g.clear();
    if (this.inputMode !== 'gesture') return;
    const x = 160;
    const y = 672;
    const w = GAME_W - 320;
    g.fillStyle(0x241638, 0.9);
    g.fillRect(x, y, w, 14);
    g.fillStyle(0x53a860, 1);
    g.fillRect(x, y, w * Phaser.Math.Clamp(p, 0, 1), 14);
  }

  // ---------- 민원 카드 ----------

  nextCard() {
    if (this.over) return;
    const data = this.pool[this.poolIdx % this.pool.length];
    this.poolIdx += 1;

    const life = CARD_TIME_MS[this.day - 1] + (data.bureaus.length - 1) * 2500;
    const c = { data, step: 0, life, lifeMax: life, objs: [] };

    sfx.siren();
    const img = this.add.image(GAME_W / 2, 400, 'card').setDepth(10).setScale(0);
    this.tweens.add({ targets: img, scale: 1, duration: 220, ease: 'back.out' });
    c.objs.push(img);
    c.objs.push(
      this.add
        .text(120, 300, `[${data.from}]`, { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#fff6e3' })
        .setOrigin(0, 0.5)
        .setDepth(11)
    );
    c.objs.push(
      this.add
        .text(120, 360, data.text, {
          fontFamily: FONT,
          fontSize: '27px',
          fontStyle: 'bold',
          color: '#3a2a18',
          wordWrap: { width: 480 },
          lineSpacing: 6
        })
        .setOrigin(0, 0.5)
        .setDepth(11)
    );
    // 필요 부서 칩 (순서대로)
    c.chips = data.bureaus.map((id, i) => {
      const chip = this.add.image(150 + i * 110, 468, `chip-${id}`).setDepth(11).setScale(0.8);
      const t = this.add
        .text(150 + i * 110, 468, BUREAU_BY_ID[id].short, {
          fontFamily: FONT,
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#fff6e3'
        })
        .setOrigin(0.5)
        .setDepth(12);
      c.objs.push(chip, t);
      return { chip, t };
    });
    c.objs.push(
      this.add
        .text(560, 468, '← 순서대로 호출!', { fontFamily: FONT, fontSize: '18px', color: '#8a6a4a' })
        .setOrigin(0.5)
        .setDepth(11)
    );
    // 타이머 바
    c.timer = this.add.graphics().setDepth(12);
    c.objs.push(c.timer);

    this.card = c;
    this.inputMode = 'await-call';
    this.refreshCallHighlight();
    this.highlightChip();
  }

  highlightChip() {
    const c = this.card;
    if (!c) return;
    c.chips.forEach(({ chip }, i) => {
      this.tweens.killTweensOf(chip);
      if (i < c.step) {
        chip.setAlpha(0.35);
        chip.setScale(0.8);
      } else if (i === c.step) {
        this.tweens.add({ targets: chip, scale: { from: 0.85, to: 1.0 }, duration: 300, yoyo: true, repeat: -1 });
      } else {
        chip.setAlpha(0.9);
        chip.setScale(0.8);
      }
    });
  }

  // ---------- 협력: 호출 → 달려옴 → 제스처 ----------

  onCall(b) {
    if (this.over || !this.card || this.inputMode !== 'await-call') return;
    const need = this.card.data.bureaus[this.card.step];
    if (b.id !== need) {
      sfx.wrong();
      this.mental = Math.max(0, this.mental - MENTAL_WRONG_TAP);
      this.drawMental();
      const v = this.callBtns[b.id];
      this.tweens.add({ targets: v.btn, x: { from: v.x - 5, to: v.x }, duration: 60, repeat: 2 });
      this.floatText(v.x, v.y - 70, '담당이 아닙니다!', '#ff8a8a');
      this.checkMentalEnd();
      return;
    }
    sfx.run();
    this.inputMode = 'running';
    this.refreshCallHighlight();
    this.useCount[b.id] += 1;

    // 담당자 달려옴 (내 전문 분야면 내가 직접 뛴다!)
    const mine = b.id === PLAYER_BUREAU;
    const spr = mine
      ? this.player
      : this.add.sprite(GAME_W + 50, LANE_Y, `cz-${b.id}-idle`).setDepth(21).setScale(1.25);
    if (!mine) this.helper = spr;
    else this.helper = this.player;
    spr.play(mine ? 'player-run' : `cz-${b.id}-run`);
    spr.setFlipX(mine ? false : true);
    const targetX = mine ? HELPER_X : HELPER_X;
    this.tweens.killTweensOf(spr);
    this.tweens.add({
      targets: spr,
      x: targetX,
      y: LANE_Y,
      duration: mine ? 300 : 420,
      ease: 'sine.out',
      onComplete: () => {
        spr.stop();
        spr.setTexture(mine ? 'player-idle' : `cz-${b.id}-idle`);
        spr.setFlipX(false);
        this.startGesture(b, mine);
      }
    });
  }

  startGesture(b, mine) {
    this.inputMode = 'gesture';
    const c = this.card;
    const kind = b.interaction;

    if (kind === 'choice') {
      const q = c.data.choice || { good: '좋은 표현입니다', bad: '이상한 표현입니다' };
      const opts = Phaser.Utils.Array.Shuffle([
        { text: q.good, good: true },
        { text: q.bad, good: false }
      ]);
      this.gesture = { type: 'choice' };
      this.gestureHint.setText(`${b.keeper}: "올바른 표현을 결재해 주세요!"`).setVisible(true);
      const btns = [
        [this.choiceA, this.choiceAText, opts[0]],
        [this.choiceB, this.choiceBText, opts[1]]
      ];
      for (const [img, txt, opt] of btns) {
        img.setVisible(true);
        txt.setText(opt.text).setVisible(true);
        img.removeAllListeners('pointerdown');
        img.on('pointerdown', () => {
          if (opt.good) this.stepSuccess();
          else {
            sfx.wrong();
            this.mental = Math.max(0, this.mental - MENTAL_WRONG_TAP * 2);
            this.drawMental();
            this.floatText(GAME_W / 2, 640, '오탈자 결재!', '#ff8a8a');
            this.checkMentalEnd();
          }
        });
      }
      this.gestureZone.setVisible(true);
      return;
    }

    const needMash = mine ? STEP_MASH - 1 : STEP_MASH; // 전문 분야 보정
    this.gesture =
      kind === 'mash'
        ? { type: 'mash', count: 0, need: needMash }
        : kind === 'hold'
          ? { type: 'hold', holding: false, ms: 0 }
          : { type: 'swipe', start: null };
    this.gestureHint
      .setText(`${mine ? '나' : b.keeper}: ${b.stepHint}${mine ? ' (전문 분야!)' : ''}`)
      .setVisible(true);
    this.gestureZone.setVisible(true);
    this.setGestureProgress(0);
  }

  stepSuccess() {
    const c = this.card;
    sfx.step();
    const mult = Math.min(MULT_MAX, 1 + Math.floor(this.combo / COMBO_STEP));
    this.score += SCORE_STEP * mult;
    this.endGesture();

    // 담당자 퇴장 (플레이어면 제자리 복귀)
    const spr = this.helper;
    if (spr === this.player) {
      spr.play('player-run');
      spr.setFlipX(true);
      this.tweens.add({
        targets: spr,
        x: PLAYER_X,
        duration: 280,
        onComplete: () => {
          spr.stop();
          spr.setTexture('player-idle');
          spr.setFlipX(false);
        }
      });
    } else if (spr) {
      spr.play(`cz-${c.data.bureaus[c.step]}-run`);
      this.tweens.add({ targets: spr, x: GAME_W + 60, duration: 380, onComplete: () => spr.destroy() });
    }
    this.helper = null;

    c.step += 1;
    if (c.step >= c.data.bureaus.length) {
      this.resolveCard();
    } else {
      this.inputMode = 'await-call';
      this.refreshCallHighlight();
      this.highlightChip();
    }
    this.updateHud();
  }

  endGesture() {
    this.gesture = null;
    this.gestureZone.setVisible(false);
    this.gestureHint.setVisible(false);
    this.gestureProgress.clear();
    this.choiceA.setVisible(false);
    this.choiceB.setVisible(false);
    this.choiceAText.setVisible(false);
    this.choiceBText.setVisible(false);
  }

  resolveCard() {
    const c = this.card;
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const perfect = c.life / c.lifeMax >= PERFECT_LIFE;
    if (perfect) this.perfects += 1;
    const mult = Math.min(MULT_MAX, 1 + Math.floor(this.combo / COMBO_STEP));
    let gained = SCORE_CARD * mult * c.data.bureaus.length;
    if (perfect) gained = Math.round(gained * PERFECT_MULT);
    this.score += gained;
    this.mental = Math.min(MENTAL_MAX, this.mental + MENTAL_RESOLVE_HEAL);
    this.resolved += 1;

    sfx.stamp();
    if (this.combo % COMBO_STEP === 0) sfx.chime(this.combo / COMBO_STEP);
    this.punchZoom();
    this.floatText(GAME_W / 2, 350, perfect ? `협력 콤보 PERFECT! +${gained}` : `협력 콤보 성공! +${gained}`, perfect ? '#ffe14a' : '#ffe9a0');
    this.stampFx();
    this.destroyCard(true);
    this.updateHud();
    this.drawMental();
    this.time.delayedCall(550, () => this.nextCard());
  }

  burstCard() {
    const c = this.card;
    this.combo = 0;
    const dmg = Phaser.Math.Between(MENTAL_TIMEOUT_DMG[0], MENTAL_TIMEOUT_DMG[1]);
    this.mental = Math.max(0, this.mental - dmg);
    sfx.burst();
    this.cameras.main.shake(180, 0.008);
    this.floatText(GAME_W / 2, 350, `민원 폭주… 주인님 멘탈 -${dmg}`, '#ff8a8a');
    this.endGesture();
    if (this.helper && this.helper !== this.player) this.helper.destroy();
    this.helper = null;
    this.destroyCard(false);
    this.updateHud();
    this.drawMental();
    if (!this.checkMentalEnd()) this.time.delayedCall(550, () => this.nextCard());
  }

  destroyCard(success) {
    const c = this.card;
    this.card = null;
    this.inputMode = null;
    this.refreshCallHighlight();
    for (const o of c.objs) {
      this.tweens.add({
        targets: o,
        alpha: 0,
        y: o.y + (success ? -30 : 40),
        duration: 250,
        onComplete: () => o.destroy()
      });
    }
  }

  stampFx() {
    const s = this.add
      .text(560, 420, '결재', { fontFamily: FONT, fontSize: '54px', fontStyle: 'bold', color: '#b5443c' })
      .setOrigin(0.5)
      .setAngle(-14)
      .setDepth(15)
      .setScale(2)
      .setAlpha(0);
    this.tweens.add({
      targets: s,
      scale: 1,
      alpha: 1,
      duration: 130,
      ease: 'back.in',
      onComplete: () => this.tweens.add({ targets: s, alpha: 0, delay: 250, duration: 200, onComplete: () => s.destroy() })
    });
  }

  punchZoom() {
    this.tweens.killTweensOf(this.cameras.main);
    this.cameras.main.zoom = 1;
    this.tweens.add({ targets: this.cameras.main, zoom: 1.02, duration: 60, yoyo: true });
  }

  floatText(x, y, str, color) {
    const t = this.add
      .text(x, y, str, { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color })
      .setOrigin(0.5)
      .setDepth(45);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'sine.out', onComplete: () => t.destroy() });
  }

  updateHud() {
    this.scoreText.setText(`SCORE ${this.score.toLocaleString()}`);
    const mult = Math.min(MULT_MAX, 1 + Math.floor(this.combo / COMBO_STEP));
    this.comboText.setText(this.combo >= 2 ? `${this.combo} COMBO ×${mult}` : '');
  }

  checkMentalEnd() {
    if (this.mental <= 0 && !this.over) {
      this.finish(true);
      return true;
    }
    return false;
  }

  // ---------- 진행/종료 ----------

  update(_, deltaMs) {
    if (this.over) return;
    this.elapsed += deltaMs / 1000;

    const remain = Math.max(0, DAY_SECONDS - this.elapsed);
    this.timeText.setText(`${Math.floor(remain / 60)}:${String(Math.floor(remain % 60)).padStart(2, '0')}`);
    this.daytimeText.setText(DAYTIMES[Math.min(DAYTIMES.length - 1, Math.floor((this.elapsed / DAY_SECONDS) * DAYTIMES.length))]);

    if (remain <= 0) {
      this.finish(false);
      return;
    }
    // 종반 BGM 가속
    if (!this.musicFast && remain < 25) {
      this.musicFast = true;
      music.setRate(1.22);
    }

    // 홀드 제스처 진행
    if (this.inputMode === 'gesture' && this.gesture && this.gesture.type === 'hold' && this.gesture.holding) {
      this.gesture.ms += deltaMs;
      if (Math.random() < 0.2) sfx.holdTick(this.gesture.ms / STEP_HOLD_MS);
      this.setGestureProgress(this.gesture.ms / STEP_HOLD_MS);
      if (this.gesture.ms >= STEP_HOLD_MS) this.stepSuccess();
    }

    // 카드 타이머
    const c = this.card;
    if (c) {
      c.life -= deltaMs;
      const p = Phaser.Math.Clamp(c.life / c.lifeMax, 0, 1);
      c.timer.clear();
      c.timer.fillStyle(0x241638, 1);
      c.timer.fillRect(120, 508, 480, 12);
      c.timer.fillStyle(p > 0.4 ? 0x53a860 : 0xe8565e, 1);
      c.timer.fillRect(120, 508, 480 * p, 12);
      if (c.life <= 0) this.burstCard();
    }
  }

  finish(collapsed) {
    if (this.over) return;
    this.over = true;
    music.setRate(1);
    this.endGesture();
    if (this.card) this.destroyCard(false);
    if (collapsed) sfx.fail();
    else sfx.fanfare();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => {
      this.scene.start('News', {
        collapsed,
        score: this.score,
        resolved: this.resolved,
        perfects: this.perfects,
        maxCombo: this.maxCombo,
        mental: this.mental,
        useCount: this.useCount
      });
    });
  }
}
