import Phaser from 'phaser';
import {
  GAME_W,
  GAME_H,
  DAY_SECONDS_BY_DAY,
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
  MULT_MAX
} from '../config.js';
import { BUREAUS, BUREAU_BY_ID } from '../data/bureaus.js';
import { COMPLAINTS } from '../data/complaints.js';
import { sfx, music } from '../systems/audio.js';

const FONT = 'Galmuri11, Pretendard, sans-serif';

const DAYTIMES = ['AM 7:00 기상', 'AM 9:00 출근길', 'PM 12:00 점심', 'PM 3:00 업무', 'PM 7:00 저녁', 'PM 11:00 취침 전'];

// 오픈맵: 두 개의 거리(street) 위에 6국 청사 배치 — 동선이 곧 실력
const STREETS = { up: 780, down: 1080 };
const SPOTS = {
  body: { x: 130, street: 'up' },
  impulse: { x: 360, street: 'up' },
  dream: { x: 590, street: 'up' },
  memory: { x: 120, street: 'down' },
  emotion: { x: 360, street: 'down' },
  speech: { x: 600, street: 'down' }
};
const PLAYER_SPEED = 420; // px/s
const TRAVEL_BONUS_MS = 4000; // 오픈맵 이동 감안 카드 시간 보정

export class RushScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Rush' });
  }

  create() {
    this.st = this.registry.get('state');
    this.day = Math.min(this.st.day, 3);
    this.daySeconds = DAY_SECONDS_BY_DAY[this.day - 1];

    this.elapsed = 0;
    this.mental = MENTAL_MAX;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfects = 0;
    this.resolved = 0;
    this.useCount = Object.fromEntries(BUREAUS.map((b) => [b.id, 0]));
    this.over = false;
    this.card = null;
    this.helper = null;
    this.moving = false;
    this.gesture = null;
    this.inputMode = null; // 'move' | 'gesture' | null
    this.musicFast = false;

    this.pool = Phaser.Utils.Array.Shuffle(COMPLAINTS.filter((c) => c.day <= this.day));
    this.poolIdx = 0;

    this.add.image(GAME_W / 2, GAME_H / 2, 'sky');
    // 두 거리의 보도
    this.add.image(GAME_W / 2, STREETS.up + 60, 'ground').setCrop(0, 0, GAME_W, 180);
    this.add.image(GAME_W / 2, STREETS.down + 90, 'ground');

    this.buildTop();
    this.buildCity();
    this.buildPlayer();
    this.buildGestureLayer();

    this.time.delayedCall(600, () => this.nextCard());
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  // ---------- 상단 HUD + 민원 배너 ----------

  buildTop() {
    const g = this.add.graphics().setDepth(60);
    g.fillStyle(0x0c0616, 0.92);
    g.fillRect(0, 0, GAME_W, 168);
    g.fillStyle(0x5a4a80, 1);
    g.fillRect(0, 168, GAME_W, 3);

    this.dayText = this.add
      .text(30, 34, `${this.st.day}일차`, { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#ffd9a0' })
      .setOrigin(0, 0.5)
      .setDepth(61);
    this.daytimeText = this.add
      .text(GAME_W / 2, 34, DAYTIMES[0], { fontFamily: FONT, fontSize: '22px', color: '#c9b8e8' })
      .setOrigin(0.5)
      .setDepth(61);
    this.timeText = this.add
      .text(GAME_W - 30, 34, '', { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(1, 0.5)
      .setDepth(61);

    this.add
      .text(30, 76, '멘탈', { fontFamily: FONT, fontSize: '18px', color: '#c9b8e8' })
      .setOrigin(0, 0.5)
      .setDepth(61);
    this.mentalBar = this.add.graphics().setDepth(61);
    this.scoreText = this.add
      .text(30, 130, 'SCORE 0', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0, 0.5)
      .setDepth(61);
    this.comboText = this.add
      .text(GAME_W - 30, 130, '', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffe9a0' })
      .setOrigin(1, 0.5)
      .setDepth(61);

    // 민원 배너 (컴팩트)
    this.banner = this.add.graphics().setDepth(60);
    this.bannerFrom = this.add
      .text(30, 208, '', { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#ffd9a0' })
      .setOrigin(0, 0.5)
      .setDepth(61);
    this.bannerText = this.add
      .text(30, 246, '', {
        fontFamily: FONT,
        fontSize: '23px',
        fontStyle: 'bold',
        color: '#fff6e3',
        wordWrap: { width: 500 }
      })
      .setOrigin(0, 0.5)
      .setDepth(61);
    this.bannerChips = [];
    this.bannerTimer = this.add.graphics().setDepth(61);
    this.drawMental();
  }

  drawMental() {
    const g = this.mentalBar;
    const x = 110;
    const y = 66;
    const w = GAME_W - 146;
    const h = 20;
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

  // ---------- 도시(오픈맵 필드) ----------

  buildCity() {
    this.spots = {};
    for (const b of BUREAUS) {
      const s = SPOTS[b.id];
      const y = STREETS[s.street];
      const lvl = this.st.levels[b.id];
      const img = this.add
        .image(s.x, y, `bld-${b.id}-${lvl}`)
        .setOrigin(0.5, 1)
        .setDepth(s.street === 'up' ? 5 : 15)
        .setInteractive({ useHandCursor: true });
      img.on('pointerdown', () => this.onTapBuilding(b));
      const label = this.add
        .text(s.x, y + 4, b.short, {
          fontFamily: FONT,
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#fff6e3',
          backgroundColor: '#12081fcc',
          padding: { x: 6, y: 2 }
        })
        .setOrigin(0.5, 0)
        .setDepth(s.street === 'up' ? 6 : 16);
      // 민원 말풍선 (필요 시 표시)
      const bubble = this.add
        .image(s.x, y - img.height - 40, `chip-${b.id}`)
        .setScale(0.85)
        .setDepth(50)
        .setVisible(false);
      const bubbleMark = this.add
        .text(s.x, y - img.height - 40, '!', { fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#fff6e3' })
        .setOrigin(0.5)
        .setDepth(51)
        .setVisible(false);
      this.tweens.add({ targets: [bubble, bubbleMark], y: '-=8', duration: 380, yoyo: true, repeat: -1 });
      this.spots[b.id] = { img, label, bubble, bubbleMark, x: s.x, y, street: s.street, bureau: b };
    }
  }

  setBubble(bureauId, on) {
    for (const id of Object.keys(this.spots)) {
      const v = this.spots[id];
      const show = on && id === bureauId;
      v.bubble.setVisible(show);
      v.bubbleMark.setVisible(show);
    }
  }

  // ---------- 플레이어 (오픈맵 이동) ----------

  buildPlayer() {
    this.player = this.add.sprite(GAME_W / 2, STREETS.down + 40, 'player-idle').setDepth(30).setScale(1.25);
    this.idleTween();
    this.add
      .text(GAME_W / 2, STREETS.down + 92, '나 (신입)', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#ffe9c9',
        backgroundColor: '#12081fcc',
        padding: { x: 5, y: 2 }
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setName('meLabel');
  }

  idleTween() {
    this.tweens.killTweensOf(this.player);
    this.playerBob = this.tweens.add({
      targets: this.player,
      y: this.player.y - 4,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inout'
    });
  }

  onTapBuilding(b) {
    if (this.over || this.inputMode !== 'move' || this.moving) return;
    const spot = this.spots[b.id];
    const need = this.card ? this.card.data.bureaus[this.card.step] : null;

    // 달려간다 (맞든 틀리든 — 동선 낭비가 곧 페널티)
    this.moving = true;
    sfx.run();
    const targetY = spot.y + 40;
    const dist = Math.abs(this.player.x - spot.x) + Math.abs(this.player.y - targetY);
    const dur = Math.max(160, (dist / PLAYER_SPEED) * 1000);
    this.tweens.killTweensOf(this.player);
    this.player.play('player-run');
    this.player.setFlipX(spot.x < this.player.x);
    this.tweens.add({
      targets: this.player,
      x: spot.x,
      y: targetY,
      duration: dur,
      ease: 'sine.inOut',
      onComplete: () => {
        this.moving = false;
        this.player.stop();
        this.player.setTexture('player-idle');
        this.player.setFlipX(false);
        this.idleTween();
        if (!this.card) return;
        if (b.id === need) {
          this.arriveAt(b, spot);
        } else {
          sfx.wrong();
          this.mental = Math.max(0, this.mental - MENTAL_WRONG_TAP);
          this.drawMental();
          this.floatText(spot.x, spot.y - 120, '여긴 담당이 아닙니다!', '#ff8a8a');
          this.checkMentalEnd();
        }
      }
    });
  }

  // 도착: 그 국 시민이 마중 나와 협력 제스처 (W3 종족 + 협력)
  arriveAt(b, spot) {
    this.inputMode = 'busy';
    this.useCount[b.id] += 1;
    const mine = b.id === PLAYER_BUREAU;
    if (mine) {
      // 내 전문 분야 — 바로 착수
      this.startGesture(b, true);
      return;
    }
    const helper = this.add
      .sprite(spot.x + (this.player.x <= spot.x ? 46 : -46), spot.y - 8, `cz-${b.id}-idle`)
      .setDepth(31)
      .setScale(0.9)
      .setAlpha(0);
    this.helper = helper;
    sfx.ui();
    this.tweens.add({
      targets: helper,
      alpha: 1,
      y: this.player.y,
      scale: 1.2,
      duration: 260,
      ease: 'back.out',
      onComplete: () => this.startGesture(b, false)
    });
  }

  // ---------- 제스처 (부서별 미니 조작) ----------

  buildGestureLayer() {
    this.gestureZone = this.add
      .rectangle(GAME_W / 2, 640, GAME_W, GAME_H, 0x000000, 0.001)
      .setDepth(70)
      .setVisible(false)
      .setInteractive();
    this.gestureHint = this.add
      .text(GAME_W / 2, 560, '', {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#fff6e3',
        backgroundColor: '#241638ee',
        padding: { x: 16, y: 10 },
        align: 'center',
        wordWrap: { width: 560 }
      })
      .setOrigin(0.5)
      .setDepth(71)
      .setVisible(false);
    this.gestureProgress = this.add.graphics().setDepth(71);

    this.choiceA = this.add.image(GAME_W / 2, 640, 'choice-btn').setScale(1.5).setDepth(71).setVisible(false).setInteractive({ useHandCursor: true });
    this.choiceB = this.add.image(GAME_W / 2, 720, 'choice-btn').setScale(1.5).setDepth(71).setVisible(false).setInteractive({ useHandCursor: true });
    this.choiceAText = this.add.text(GAME_W / 2, 640, '', { fontFamily: FONT, fontSize: '25px', fontStyle: 'bold', color: '#3a2a18' }).setOrigin(0.5).setDepth(72).setVisible(false);
    this.choiceBText = this.add.text(GAME_W / 2, 720, '', { fontFamily: FONT, fontSize: '25px', fontStyle: 'bold', color: '#3a2a18' }).setOrigin(0.5).setDepth(72).setVisible(false);

    this.gestureZone.on('pointerdown', (p) => {
      if (this.inputMode !== 'gesture' || !this.gesture) return;
      const t = this.gesture.type;
      if (t === 'mash') {
        this.gesture.count += 1;
        sfx.tap();
        this.setGestureProgress(this.gesture.count / this.gesture.need);
        if (this.gesture.count >= this.gesture.need) this.stepSuccess();
      } else if (t === 'hold') {
        this.gesture.holding = true;
      } else if (t === 'swipe') {
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
    const y = 606;
    const w = GAME_W - 320;
    g.fillStyle(0x241638, 0.9);
    g.fillRect(x, y, w, 14);
    g.fillStyle(0x53a860, 1);
    g.fillRect(x, y, w * Phaser.Math.Clamp(p, 0, 1), 14);
  }

  startGesture(b, mine) {
    this.inputMode = 'gesture';
    const c = this.card;

    if (b.interaction === 'choice') {
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
            this.floatText(GAME_W / 2, 580, '오탈자 결재!', '#ff8a8a');
            this.checkMentalEnd();
          }
        });
      }
      this.gestureZone.setVisible(true);
      return;
    }

    const needMash = mine ? STEP_MASH - 1 : STEP_MASH;
    this.gesture =
      b.interaction === 'mash'
        ? { type: 'mash', count: 0, need: needMash }
        : b.interaction === 'hold'
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

    if (this.helper) {
      const h = this.helper;
      this.helper = null;
      this.tweens.add({ targets: h, alpha: 0, y: h.y - 20, duration: 260, onComplete: () => h.destroy() });
    }

    c.step += 1;
    if (c.step >= c.data.bureaus.length) {
      this.resolveCard();
    } else {
      this.inputMode = 'move';
      this.setBubble(c.data.bureaus[c.step], true);
      this.refreshBannerChips();
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

  // ---------- 민원 ----------

  nextCard() {
    if (this.over) return;
    const data = this.pool[this.poolIdx % this.pool.length];
    this.poolIdx += 1;

    const life = CARD_TIME_MS[this.day - 1] + (data.bureaus.length - 1) * 2500 + TRAVEL_BONUS_MS * data.bureaus.length;
    this.card = { data, step: 0, life, lifeMax: life };

    sfx.siren();
    this.banner.clear();
    this.banner.fillStyle(0x241638, 0.94);
    this.banner.fillRect(0, 180, GAME_W, 130);
    this.banner.fillStyle(0xb5443c, 1);
    this.banner.fillRect(0, 180, GAME_W, 4);
    this.bannerFrom.setText(`[${data.from}] 민원 접수!`);
    this.bannerText.setText(data.text);
    this.refreshBannerChips();
    this.setBubble(data.bureaus[0], true);
    this.inputMode = 'move';
  }

  refreshBannerChips() {
    for (const o of this.bannerChips) o.destroy();
    this.bannerChips = [];
    const c = this.card;
    if (!c) return;
    c.data.bureaus.forEach((id, i) => {
      const x = 560 + (i - (c.data.bureaus.length - 1) / 2) * 0; // 세로 나열
      const chip = this.add
        .image(586, 205 + i * 36, `chip-${id}`)
        .setScale(0.36)
        .setDepth(61)
        .setAlpha(i < c.step ? 0.35 : 1);
      const t = this.add
        .text(586 + 30, 205 + i * 36, BUREAU_BY_ID[id].short, {
          fontFamily: FONT,
          fontSize: '18px',
          fontStyle: 'bold',
          color: i < c.step ? '#6e6390' : i === c.step ? '#ffe14a' : '#d8cfec'
        })
        .setOrigin(0, 0.5)
        .setDepth(61);
      this.bannerChips.push(chip, t);
    });
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
    this.floatText(this.player.x, this.player.y - 90, perfect ? `PERFECT! +${gained}` : `협력 완료! +${gained}`, perfect ? '#ffe14a' : '#ffe9a0');
    this.clearCard();
    this.updateHud();
    this.drawMental();
    this.time.delayedCall(500, () => this.nextCard());
  }

  burstCard() {
    this.combo = 0;
    const dmg = Phaser.Math.Between(MENTAL_TIMEOUT_DMG[0], MENTAL_TIMEOUT_DMG[1]);
    this.mental = Math.max(0, this.mental - dmg);
    sfx.burst();
    this.cameras.main.shake(180, 0.008);
    this.floatText(GAME_W / 2, 340, `민원 폭주… 멘탈 -${dmg}`, '#ff8a8a');
    this.endGesture();
    if (this.helper) {
      this.helper.destroy();
      this.helper = null;
    }
    this.clearCard();
    this.updateHud();
    this.drawMental();
    if (!this.checkMentalEnd()) this.time.delayedCall(500, () => this.nextCard());
  }

  clearCard() {
    this.card = null;
    this.inputMode = null;
    this.setBubble(null, false);
    this.banner.clear();
    this.bannerFrom.setText('');
    this.bannerText.setText('');
    this.bannerTimer.clear();
    for (const o of this.bannerChips) o.destroy();
    this.bannerChips = [];
  }

  // ---------- 공통 ----------

  punchZoom() {
    this.tweens.killTweensOf(this.cameras.main);
    this.cameras.main.zoom = 1;
    this.tweens.add({ targets: this.cameras.main, zoom: 1.02, duration: 60, yoyo: true });
  }

  floatText(x, y, str, color) {
    const t = this.add
      .text(x, y, str, { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color })
      .setOrigin(0.5)
      .setDepth(75);
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

  update(_, deltaMs) {
    if (this.over) return;
    this.elapsed += deltaMs / 1000;

    const remain = Math.max(0, this.daySeconds - this.elapsed);
    this.timeText.setText(`${Math.floor(remain / 60)}:${String(Math.floor(remain % 60)).padStart(2, '0')}`);
    this.daytimeText.setText(DAYTIMES[Math.min(DAYTIMES.length - 1, Math.floor((this.elapsed / this.daySeconds) * DAYTIMES.length))]);

    if (remain <= 0) {
      this.finish(false);
      return;
    }
    if (!this.musicFast && remain < 20) {
      this.musicFast = true;
      music.setRate(1.22);
    }

    if (this.inputMode === 'gesture' && this.gesture && this.gesture.type === 'hold' && this.gesture.holding) {
      this.gesture.ms += deltaMs;
      if (Math.random() < 0.2) sfx.holdTick(this.gesture.ms / STEP_HOLD_MS);
      this.setGestureProgress(this.gesture.ms / STEP_HOLD_MS);
      if (this.gesture.ms >= STEP_HOLD_MS) this.stepSuccess();
    }

    const c = this.card;
    if (c) {
      c.life -= deltaMs;
      const p = Phaser.Math.Clamp(c.life / c.lifeMax, 0, 1);
      this.bannerTimer.clear();
      this.bannerTimer.fillStyle(0x241638, 1);
      this.bannerTimer.fillRect(0, 296, GAME_W, 10);
      this.bannerTimer.fillStyle(p > 0.4 ? 0x53a860 : 0xe8565e, 1);
      this.bannerTimer.fillRect(0, 296, GAME_W * p, 10);
      if (c.life <= 0) this.burstCard();
    }
  }

  finish(collapsed) {
    if (this.over) return;
    this.over = true;
    music.setRate(1);
    this.endGesture();
    if (this.card) this.clearCard();
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
