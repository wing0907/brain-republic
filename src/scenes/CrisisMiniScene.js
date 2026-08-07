import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { BUREAU_BY_ID } from '../data/bureaus.js';
import { saveState } from '../systems/save.js';
import { applyReward } from '../systems/rewards.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

const ROUNDS = 5;
const NEED = 3;
const CARD_LIFE = 5500;
const MASH_TAPS = 6;
const HOLD_MS = 1300;
const SWIPE_DIST = 110;

export class CrisisMiniScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CrisisMini' });
  }

  init(data) {
    this.bureauId = data.bureauId;
    this.from = data.from;
    this.ep = data.ep;
  }

  create() {
    this.state = this.registry.get('state');
    this.bureau = BUREAU_BY_ID[this.bureauId];
    this.round = 0;
    this.resolved = 0;
    this.over = false;

    this.add.image(GAME_W / 2, GAME_H / 2, 'kingdom-ground').setAlpha(0.4);

    this.add
      .text(GAME_W / 2, 110, '밀려드는 업무를 처리하라!', {
        fontFamily: FONT,
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffd9a0'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 160, `${this.bureau.name} — ${ROUNDS}건 중 ${NEED}건 이상 성공!`, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#a99cc7'
      })
      .setOrigin(0.5);

    // 진행 점
    this.dots = [];
    for (let i = 0; i < ROUNDS; i++) {
      const d = this.add.circle(GAME_W / 2 - 90 + i * 45, 215, 12, 0x241638).setStrokeStyle(2, 0x8a6fc0);
      this.dots.push(d);
    }

    // 크리처 응원단
    const stage = this.state.bureaus[this.bureauId].level >= 5 ? 3 : this.state.bureaus[this.bureauId].level >= 3 ? 2 : 1;
    this.pet = this.add.image(120, 1130, `pet-${this.bureauId}-${stage}`).setScale(1.1);

    this.cards = Phaser.Utils.Array.Shuffle([...this.bureau.crisis]);
    while (this.cards.length < ROUNDS) this.cards.push(Phaser.Utils.Array.GetRandom(this.bureau.crisis));

    this.time.delayedCall(400, () => this.nextRound());
    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  nextRound() {
    if (this.over) return;
    if (this.round >= ROUNDS || this.resolved >= NEED) {
      this.end();
      return;
    }
    this.spawnCard(this.cards[this.round]);
    this.round += 1;
  }

  spawnCard(crisis) {
    sfx.siren();
    const c = this.add.container(GAME_W / 2, 620);
    c.setScale(0);
    c.crisis = crisis;
    c.life = CARD_LIFE;
    c.done = false;

    const paper = this.add.image(0, 0, 'card').setScale(1.5, 1.6);
    c.add(paper);
    c.add(
      this.add
        .text(-200, -105, `[${crisis.dept}]`, {
          fontFamily: FONT,
          fontSize: '28px',
          fontStyle: 'bold',
          color: '#b5443c'
        })
        .setOrigin(0, 0.5)
    );
    c.add(
      this.add
        .text(-200, -55, crisis.line, {
          fontFamily: FONT,
          fontSize: '30px',
          fontStyle: 'bold',
          color: '#3a2a18',
          wordWrap: { width: 400 }
        })
        .setOrigin(0, 0.5)
    );
    c.ring = this.add.graphics();
    c.add(c.ring);

    const mode = this.bureau.interaction;
    if (mode === 'choice') this.buildChoice(c, crisis);
    else this.buildGesture(c, mode);

    this.tweens.add({ targets: c, scale: 1, duration: 220, ease: 'back.out' });
    this.card = c;
  }

  buildGesture(c, mode) {
    c.add(
      this.add
        .text(0, 40, this.bureau.verb, {
          fontFamily: FONT,
          fontSize: '28px',
          fontStyle: 'bold',
          color: '#7a5a20'
        })
        .setOrigin(0.5)
    );
    c.progress = 0;
    c.progressBar = this.add.graphics();
    c.add(c.progressBar);
    c.setInteractive(new Phaser.Geom.Rectangle(-225, -136, 450, 272), Phaser.Geom.Rectangle.Contains);

    if (mode === 'mash') {
      c.on('pointerdown', () => {
        if (c.done) return;
        c.progress += 1 / MASH_TAPS;
        sfx.tap();
        this.tweens.add({ targets: c, angle: { from: -2, to: 0 }, duration: 80 });
        this.drawProgress(c);
        if (c.progress >= 0.999) this.resolve(c);
      });
    } else if (mode === 'hold') {
      c.holding = false;
      c.holdMs = 0;
      c.on('pointerdown', () => (c.holding = true));
      const stop = () => (c.holding = false);
      c.on('pointerup', stop);
      c.on('pointerout', stop);
    } else {
      c.on('pointerdown', (p) => (c.swipeStart = { x: p.x, y: p.y }));
      c.on('pointermove', (p) => {
        if (c.done || !c.swipeStart || !p.isDown) return;
        const d = Phaser.Math.Distance.Between(c.swipeStart.x, c.swipeStart.y, p.x, p.y);
        c.progress = Phaser.Math.Clamp(d / SWIPE_DIST, 0, 1);
        this.drawProgress(c);
        if (d >= SWIPE_DIST) {
          c.swipeStart = null;
          this.resolve(c);
        }
      });
      c.on('pointerup', () => {
        c.swipeStart = null;
        if (!c.done) {
          c.progress = 0;
          this.drawProgress(c);
        }
      });
    }
  }

  buildChoice(c, crisis) {
    const options = Phaser.Utils.Array.Shuffle([
      { text: crisis.good, good: true },
      { text: crisis.bad, good: false }
    ]);
    options.forEach((opt, i) => {
      const y = 30 + i * 78;
      const btn = this.add.image(0, y, 'choice-btn').setScale(1.4).setInteractive({ useHandCursor: true });
      c.add(btn);
      c.add(
        this.add
          .text(0, y, opt.text, {
            fontFamily: FONT,
            fontSize: '30px',
            fontStyle: 'bold',
            color: '#3a2a18'
          })
          .setOrigin(0.5)
      );
      btn.on('pointerdown', () => {
        if (c.done) return;
        if (opt.good) this.resolve(c);
        else this.fail(c, '오탈자 결재…!');
      });
    });
  }

  drawProgress(c) {
    if (!c.progressBar) return;
    const g = c.progressBar;
    g.clear();
    g.fillStyle(0xdcd2ba, 1);
    g.fillRoundedRect(-180, 80, 360, 16, 8);
    if (c.progress > 0) {
      g.fillStyle(0x53a860, 1);
      g.fillRoundedRect(-180, 80, 360 * Phaser.Math.Clamp(c.progress, 0, 1), 16, 8);
    }
  }

  resolve(c) {
    if (c.done) return;
    c.done = true;
    this.resolved += 1;
    sfx.stamp();
    this.dots[this.round - 1].setFillStyle(0x53a860);
    this.stamp(c);
    this.tweens.add({ targets: this.pet, angle: { from: -10, to: 0 }, duration: 250 });
    this.removeCard(c, true);
  }

  fail(c, msg) {
    if (c.done) return;
    c.done = true;
    sfx.burst();
    this.cameras.main.shake(150, 0.007);
    this.dots[this.round - 1].setFillStyle(0xe8565e);
    if (msg) {
      const t = this.add
        .text(GAME_W / 2, 430, msg, { fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: '#ff8a8a' })
        .setOrigin(0.5);
      this.tweens.add({ targets: t, alpha: 0, y: 390, duration: 900, onComplete: () => t.destroy() });
    }
    this.removeCard(c, false);
  }

  removeCard(c, success) {
    this.card = null;
    this.tweens.add({
      targets: c,
      scale: success ? 1.12 : 0.8,
      alpha: 0,
      duration: 200,
      onComplete: () => c.destroy()
    });
    this.time.delayedCall(450, () => this.nextRound());
  }

  stamp(c) {
    const s = this.add
      .text(c.x + 110, c.y + 60, '결재', {
        fontFamily: FONT,
        fontSize: '54px',
        fontStyle: 'bold',
        color: '#b5443c'
      })
      .setOrigin(0.5)
      .setAngle(-14)
      .setScale(2)
      .setAlpha(0);
    this.tweens.add({
      targets: s,
      scale: 1,
      alpha: 1,
      duration: 130,
      ease: 'back.in',
      onComplete: () =>
        this.tweens.add({ targets: s, alpha: 0, delay: 250, duration: 200, onComplete: () => s.destroy() })
    });
  }

  update(_, deltaMs) {
    const c = this.card;
    if (!c || c.done) return;

    if (this.bureau.interaction === 'hold' && c.holding) {
      c.holdMs += deltaMs;
      c.progress = Phaser.Math.Clamp(c.holdMs / HOLD_MS, 0, 1);
      if (Math.random() < 0.2) sfx.holdTick(c.progress);
      this.drawProgress(c);
      if (c.progress >= 1) {
        this.resolve(c);
        return;
      }
    }

    c.life -= deltaMs;
    const p = Phaser.Math.Clamp(c.life / CARD_LIFE, 0, 1);
    c.ring.clear();
    c.ring.lineStyle(9, p > 0.4 ? 0x53a860 : 0xe8565e, 1);
    c.ring.beginPath();
    c.ring.arc(185, -95, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p, false);
    c.ring.strokePath();
    if (c.life <= 0) this.fail(c, '시간 초과!');
  }

  end() {
    if (this.over) return;
    this.over = true;
    const success = this.resolved >= NEED;
    if (success) sfx.chime(3);
    const t = this.add
      .text(GAME_W / 2, 620, success ? '업무 처리 완료!' : '업무가 밀렸다…', {
        fontFamily: FONT,
        fontSize: '52px',
        fontStyle: 'bold',
        color: success ? '#ffe9a0' : '#ff8a8a',
        stroke: '#12081f',
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'back.out' });
    this.time.delayedCall(1100, () => this.finish(success));
  }

  finish(success) {
    if (this.from === 'episode') {
      this.scene.start('Episode', { bureauId: this.bureauId, ep: this.ep, phase: 'result', success });
      return;
    }
    applyReward(this.state, this.bureauId, this.from, success);
    saveState(this.state);
    if (this.from === 'event') {
      this.scene.start('Map', { eventResult: { success, bureauId: this.bureauId } });
    } else {
      this.scene.start('Bureau', { bureauId: this.bureauId });
    }
  }
}
