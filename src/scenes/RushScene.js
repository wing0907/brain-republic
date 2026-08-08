import Phaser from 'phaser';
import {
  GAME_W,
  GAME_H,
  RUSH_MENTAL,
  RUSH_BURST_DMG,
  RUSH_RESOLVE_HEAL,
  RUSH_WRONG_DMG,
  RUSH_KINGDOM_MULT,
  RUSH_COIN_DIV,
  RUSH_DIAMOND_PER,
  RUSH_DIAMOND_CAP,
  RUSH_FAME_BONUS,
  RUSH_FAME_SCORE,
  COMBO_STEP,
  MULT_MAX
} from '../config.js';
import { BUREAUS } from '../data/bureaus.js';
import { saveState } from '../systems/save.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Galmuri11, Pretendard, "Apple SD Gothic Neo", sans-serif';

const MASH_TAPS = 6;
const HOLD_MS = 1300;
const SWIPE_DIST = 110;

// 국 패널 배치 (v1 아케이드 레이아웃 계승)
const PANEL_POS = [
  { x: 186, y: 400 },
  { x: 534, y: 400 },
  { x: 186, y: 660 },
  { x: 534, y: 660 },
  { x: 186, y: 920 },
  { x: 534, y: 920 }
];

export class RushScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Rush' });
  }

  create() {
    this.state = this.registry.get('state');
    this.add.image(GAME_W / 2, 640, 'bg');

    this.elapsed = 0;
    this.mental = RUSH_MENTAL;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.resolvedCount = 0;
    this.spawnAcc = 0;
    this.cards = new Map();
    this.over = false;

    // 왕국 연동 배율: 국 레벨 총합이 높을수록 점수가 커진다
    const levelSum = BUREAUS.reduce((a, b) => a + this.state.bureaus[b.id].level, 0);
    this.kingdomMult = 1 + RUSH_KINGDOM_MULT * levelSum;

    this.buildHudTop();
    this.buildPanels();
    this.buildHudBottom();

    sfx.siren();
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  // ---------- 난이도 램프 ----------

  spawnEvery() {
    return Math.max(900, 2400 - this.elapsed * 25);
  }

  cardLife() {
    return Math.max(3200, 6000 - this.elapsed * 45);
  }

  maxActive() {
    return Math.min(5, 2 + Math.floor(this.elapsed / 25));
  }

  // ---------- UI ----------

  buildHudTop() {
    const g = this.add.graphics();
    g.fillStyle(0x0c0616, 0.92);
    g.fillRoundedRect(16, 14, GAME_W - 32, 218, 18);
    g.lineStyle(2, 0x5a4a80, 0.6);
    g.strokeRoundedRect(16, 14, GAME_W - 32, 218, 18);

    this.add
      .text(GAME_W / 2, 52, '🌙 뇌정부청사 야근 러시', {
        fontFamily: FONT,
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffd9a0'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 96, `공화국 보너스 ×${this.kingdomMult.toFixed(2)}  ·  최고 ${this.state.rushBest.toLocaleString()}`, {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#a99cc7'
      })
      .setOrigin(0.5);

    this.scoreText = this.add
      .text(48, 148, 'SCORE 0', { fontFamily: FONT, fontSize: '38px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0, 0.5);
    this.comboText = this.add
      .text(GAME_W - 48, 148, '', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffe9a0' })
      .setOrigin(1, 0.5);

    this.add
      .text(48, 200, 'MENTAL', { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#c9b8e8' })
      .setOrigin(0, 0.5);
    this.mentalBar = this.add.graphics();
    this.drawMental();
  }

  drawMental() {
    const g = this.mentalBar;
    const x = 160;
    const y = 190;
    const w = GAME_W - 160 - 44;
    const h = 20;
    g.clear();
    g.fillStyle(0x241638, 1);
    g.fillRoundedRect(x, y, w, h, 10);
    const p = Phaser.Math.Clamp(this.mental / RUSH_MENTAL, 0, 1);
    if (p > 0) {
      const color = p > 0.5 ? 0x53c2b4 : p > 0.25 ? 0xf0c541 : 0xe8565e;
      g.fillStyle(color, 1);
      g.fillRoundedRect(x, y, Math.max(h, w * p), h, 10);
    }
    g.lineStyle(2, 0x8a6fc0, 0.7);
    g.strokeRoundedRect(x, y, w, h, 10);
  }

  buildPanels() {
    this.panels = {};
    BUREAUS.forEach((b, i) => {
      const pos = PANEL_POS[i];
      const img = this.add.image(pos.x, pos.y, `panel-${b.id}`);
      const name = this.add
        .text(pos.x, pos.y - 86, b.name, {
          fontFamily: FONT,
          fontSize: '30px',
          fontStyle: 'bold',
          color: '#1a0e2a'
        })
        .setOrigin(0.5);
      const idle = this.add
        .text(pos.x, pos.y + 12, '야근 중…', { fontFamily: FONT, fontSize: '22px', color: '#8a7fa8' })
        .setOrigin(0.5);
      this.panels[b.id] = { img, name, idle, pos, bureau: b };
    });
  }

  buildHudBottom() {
    const y = 1130;
    const hud = this.add.graphics();
    hud.fillStyle(0x0c0616, 0.92);
    hud.fillRoundedRect(16, y - 58, GAME_W - 32, 150, 18);
    this.timeText = this.add
      .text(GAME_W / 2, y - 4, '0:00', { fontFamily: FONT, fontSize: '50px', fontStyle: 'bold', color: '#ffd9a0' })
      .setOrigin(0.5);
    const quit = this.add
      .text(GAME_W - 48, y + 52, '퇴근하기', {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#8a7fa8'
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    quit.on('pointerdown', () => {
      sfx.ui();
      this.finish();
    });
    this.add
      .text(48, y + 52, '버티는 만큼 벌어갑니다', { fontFamily: FONT, fontSize: '22px', color: '#6e6390' })
      .setOrigin(0, 0.5);
  }

  // ---------- 진행 ----------

  update(_, deltaMs) {
    if (this.over) return;
    this.elapsed += deltaMs / 1000;

    const mm = Math.floor(this.elapsed / 60);
    const ss = Math.floor(this.elapsed % 60);
    this.timeText.setText(`${mm}:${String(ss).padStart(2, '0')}`);

    this.spawnAcc += deltaMs;
    if (this.spawnAcc >= this.spawnEvery()) {
      this.spawnAcc = 0;
      if (this.cards.size < this.maxActive()) this.spawnCard();
    }
    for (const card of this.cards.values()) card.tick(deltaMs);
  }

  spawnCard() {
    const free = BUREAUS.filter((b) => !this.cards.has(b.id));
    if (free.length === 0) return;
    const bureau = Phaser.Utils.Array.GetRandom(free);
    const crisis = Phaser.Utils.Array.GetRandom(bureau.crisis);
    const panel = this.panels[bureau.id];

    sfx.siren();
    panel.img.setTexture(`panel-${bureau.id}-lit`);
    panel.idle.setVisible(false);

    const c = this.add.container(panel.pos.x, panel.pos.y);
    c.setDepth(10);
    c.bureau = bureau;
    c.life = this.cardLife();
    c.lifeMax = c.life;
    c.done = false;

    c.add(this.add.image(0, 0, 'card'));
    c.add(
      this.add
        .text(-134, -66, `[${crisis.dept}]`, {
          fontFamily: FONT,
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#b5443c'
        })
        .setOrigin(0, 0.5)
    );
    c.add(
      this.add
        .text(-134, -30, crisis.line, {
          fontFamily: FONT,
          fontSize: '24px',
          fontStyle: 'bold',
          color: '#3a2a18',
          wordWrap: { width: 268 }
        })
        .setOrigin(0, 0.5)
    );
    c.ring = this.add.graphics();
    c.add(c.ring);

    if (bureau.interaction === 'choice') this.buildChoiceCard(c, crisis);
    else this.buildGestureCard(c, bureau);

    c.setScale(0);
    this.tweens.add({ targets: c, scale: 1, duration: 200, ease: 'back.out' });
    c.tick = (dt) => this.tickCard(c, dt);
    this.cards.set(bureau.id, c);
  }

  buildGestureCard(c, bureau) {
    c.add(
      this.add
        .text(0, 28, bureau.verb, { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#7a5a20' })
        .setOrigin(0.5)
    );
    c.progress = 0;
    c.progressBar = this.add.graphics();
    c.add(c.progressBar);
    c.setInteractive(new Phaser.Geom.Rectangle(-150, -85, 300, 170), Phaser.Geom.Rectangle.Contains);

    if (bureau.interaction === 'mash') {
      c.on('pointerdown', () => {
        if (c.done) return;
        c.progress += 1 / MASH_TAPS;
        sfx.tap();
        this.tweens.add({ targets: c, angle: { from: -2, to: 0 }, duration: 80 });
        this.drawProgress(c);
        if (c.progress >= 0.999) this.resolveCard(c, 100);
      });
    } else if (bureau.interaction === 'hold') {
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
          this.resolveCard(c, 100);
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

  buildChoiceCard(c, crisis) {
    const options = Phaser.Utils.Array.Shuffle([
      { text: crisis.good, good: true },
      { text: crisis.bad, good: false }
    ]);
    options.forEach((opt, i) => {
      const y = 10 + i * 62;
      const btn = this.add.image(0, y, 'choice-btn').setInteractive({ useHandCursor: true });
      const label = this.add
        .text(0, y, opt.text, { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#3a2a18' })
        .setOrigin(0.5);
      c.add(btn);
      c.add(label);
      btn.on('pointerdown', () => {
        if (c.done) return;
        if (opt.good) this.resolveCard(c, 150);
        else this.wrongChoice(c);
      });
    });
    c.list[0].setScale(1, 1.32);
  }

  drawProgress(c) {
    if (!c.progressBar) return;
    const g = c.progressBar;
    g.clear();
    g.fillStyle(0xdcd2ba, 1);
    g.fillRoundedRect(-120, 52, 240, 12, 6);
    if (c.progress > 0) {
      g.fillStyle(0x53a860, 1);
      g.fillRoundedRect(-120, 52, 240 * Phaser.Math.Clamp(c.progress, 0, 1), 12, 6);
    }
  }

  tickCard(c, dt) {
    if (c.done) return;
    if (c.bureau.interaction === 'hold' && c.holding) {
      c.holdMs += dt;
      c.progress = Phaser.Math.Clamp(c.holdMs / HOLD_MS, 0, 1);
      if (Math.random() < 0.2) sfx.holdTick(c.progress);
      this.drawProgress(c);
      if (c.progress >= 1) {
        this.resolveCard(c, 100);
        return;
      }
    }
    c.life -= dt;
    const p = Phaser.Math.Clamp(c.life / c.lifeMax, 0, 1);
    c.ring.clear();
    c.ring.lineStyle(7, p > 0.4 ? 0x53a860 : 0xe8565e, 1);
    c.ring.beginPath();
    c.ring.arc(118, -50, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p, false);
    c.ring.strokePath();
    if (c.life <= 0) this.burstCard(c);
  }

  resolveCard(c, base) {
    if (c.done || this.over) return;
    c.done = true;
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.resolvedCount += 1;
    const comboMult = Math.min(MULT_MAX, 1 + Math.floor(this.combo / COMBO_STEP));
    const gained = Math.round(base * comboMult * this.kingdomMult);
    this.score += gained;
    this.mental = Math.min(RUSH_MENTAL, this.mental + RUSH_RESOLVE_HEAL);

    sfx.stamp();
    if (this.combo > 0 && this.combo % COMBO_STEP === 0) sfx.chime(this.combo / COMBO_STEP);
    this.floatText(c.x, c.y - 40, `+${gained}`, '#ffe9a0');
    this.updateHud();
    this.drawMental();
    this.removeCard(c, true);
  }

  wrongChoice(c) {
    if (c.done || this.over) return;
    c.done = true;
    this.combo = 0;
    this.mental -= RUSH_WRONG_DMG;
    sfx.wrong();
    this.floatText(c.x, c.y - 40, '오탈자 결재!', '#e8565e');
    this.updateHud();
    this.drawMental();
    this.removeCard(c, false);
    this.checkGameOver();
  }

  burstCard(c) {
    if (c.done || this.over) return;
    c.done = true;
    this.combo = 0;
    const dmg = Phaser.Math.Between(RUSH_BURST_DMG[0], RUSH_BURST_DMG[1]);
    this.mental -= dmg;
    sfx.burst();
    this.cameras.main.shake(180, 0.008);
    this.floatText(c.x, c.y - 40, `-${dmg} 멘탈`, '#e8565e');
    this.updateHud();
    this.drawMental();
    this.removeCard(c, false);
    this.checkGameOver();
  }

  removeCard(c, success) {
    this.cards.delete(c.bureau.id);
    const panel = this.panels[c.bureau.id];
    panel.img.setTexture(`panel-${c.bureau.id}`);
    panel.idle.setVisible(true);
    this.tweens.add({
      targets: c,
      scale: success ? 1.15 : 0.8,
      alpha: 0,
      duration: 200,
      onComplete: () => c.destroy()
    });
    if (success) {
      const p = this.add.particles(c.x, c.y, 'dot', {
        speed: { min: 120, max: 260 },
        lifespan: 450,
        quantity: 12,
        scale: { start: 0.7, end: 0 },
        tint: c.bureau.accent,
        emitting: false
      });
      p.explode(12);
      this.time.delayedCall(600, () => p.destroy());
    }
  }

  floatText(x, y, str, color) {
    const t = this.add
      .text(x, y, str, { fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color })
      .setOrigin(0.5)
      .setDepth(30);
    this.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 800, ease: 'sine.out', onComplete: () => t.destroy() });
  }

  updateHud() {
    this.scoreText.setText(`SCORE ${this.score.toLocaleString()}`);
    const mult = Math.min(MULT_MAX, 1 + Math.floor(this.combo / COMBO_STEP));
    this.comboText.setText(this.combo >= 2 ? `${this.combo} COMBO ×${mult}` : '');
  }

  checkGameOver() {
    if (this.mental <= 0) {
      this.mental = 0;
      this.finish();
    }
  }

  // ---------- 정산 ----------

  finish() {
    if (this.over) return;
    this.over = true;
    for (const card of this.cards.values()) card.destroy();
    this.cards.clear();

    const burnout = this.mental <= 0;
    if (burnout) sfx.gameover();
    else sfx.fanfare();

    // 보상 정산
    const coins = Math.floor(this.score / RUSH_COIN_DIV);
    const diamonds = Math.min(RUSH_DIAMOND_CAP, Math.floor(this.score / RUSH_DIAMOND_PER));
    const fameBonus = this.score >= RUSH_FAME_SCORE;
    this.state.coins += coins;
    this.state.diamonds += diamonds;
    if (fameBonus) {
      for (const b of BUREAUS) {
        const s = this.state.bureaus[b.id];
        if (s.fame > 0) s.fame = Math.min(100, s.fame + RUSH_FAME_BONUS);
      }
    }
    const isBest = this.score > this.state.rushBest;
    if (isBest) this.state.rushBest = this.score;
    saveState(this.state);

    // 결과 오버레이
    const dim = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.7).setDepth(100).setInteractive();
    const panel = this.add.graphics().setDepth(101);
    panel.fillStyle(0x1a0f2e, 0.98);
    panel.fillRoundedRect(70, 330, GAME_W - 140, 640, 24);
    panel.lineStyle(3, 0x8a6fc0, 0.9);
    panel.strokeRoundedRect(70, 330, GAME_W - 140, 640, 24);

    const mm = Math.floor(this.elapsed / 60);
    const ss = Math.floor(this.elapsed % 60);
    const lines = [
      `버틴 시간  ${mm}:${String(ss).padStart(2, '0')}  ·  처리 ${this.resolvedCount}건  ·  최대 콤보 ${this.maxCombo}`,
      '',
      `🪙 +${coins.toLocaleString()}${diamonds > 0 ? `   💎 +${diamonds}` : ''}`,
      fameBonus ? `전 국 인지도 +${RUSH_FAME_BONUS} (야근의 존재감!)` : ''
    ].filter(Boolean);

    this.add
      .text(GAME_W / 2, 400, burnout ? '번아웃…' : '퇴근!', {
        fontFamily: FONT,
        fontSize: '52px',
        fontStyle: 'bold',
        color: burnout ? '#e8565e' : '#ffd9a0'
      })
      .setOrigin(0.5)
      .setDepth(102);
    this.add
      .text(GAME_W / 2, 500, `SCORE ${this.score.toLocaleString()}${isBest ? '  ★신기록!' : ''}`, {
        fontFamily: FONT,
        fontSize: '42px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setDepth(102);
    this.add
      .text(GAME_W / 2, 630, lines.join('\n'), {
        fontFamily: FONT,
        fontSize: '27px',
        color: '#e8dff5',
        align: 'center',
        lineSpacing: 10
      })
      .setOrigin(0.5)
      .setDepth(102);
    if (diamonds > 0) this.time.delayedCall(400, () => sfx.gem());

    const retry = this.add
      .image(GAME_W / 2, 790, 'button')
      .setScale(0.8, 0.7)
      .setDepth(102)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_W / 2, 790, '한 번 더!', { fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: '#3a1c05' })
      .setOrigin(0.5)
      .setDepth(103);
    retry.on('pointerdown', () => {
      sfx.ui();
      this.scene.restart();
    });

    const home = this.add
      .image(GAME_W / 2, 900, 'button-dark')
      .setScale(0.8, 0.7)
      .setDepth(102)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_W / 2, 900, '지도로', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#d8cfec' })
      .setOrigin(0.5)
      .setDepth(103);
    home.on('pointerdown', () => {
      sfx.ui();
      this.scene.start('Map');
    });
  }
}
