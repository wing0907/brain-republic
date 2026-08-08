import Phaser from 'phaser';
import {
  GAME_W,
  RUN_SECONDS,
  MENTAL_MAX,
  MENTAL_BURST_DAMAGE,
  MENTAL_RESOLVE_HEAL,
  MENTAL_WRONG_CHOICE,
  COMBO_STEP,
  MULT_MAX,
  SCORE_BASE,
  SCORE_CHOICE,
  WAVES
} from '../config.js';
import { BUREAUS } from '../data/bureaus.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

const MASH_TAPS = 6;
const HOLD_MS = 1300;
const SWIPE_DIST = 110;

// 국 패널 배치 (2×3)
const PANEL_POS = [
  { x: 186, y: 400 },
  { x: 534, y: 400 },
  { x: 186, y: 660 },
  { x: 534, y: 660 },
  { x: 186, y: 920 },
  { x: 534, y: 920 }
];

export class Ep01Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Ep01' });
  }

  create() {
    this.add.image(GAME_W / 2, 640, 'bg');

    this.elapsed = 0;
    this.mental = MENTAL_MAX;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.waveIndex = -1;
    this.spawnAcc = 0;
    this.cards = new Map(); // bureauId -> card container
    this.stats = Object.fromEntries(BUREAUS.map((b) => [b.id, { resolved: 0, burst: 0 }]));
    this.over = false;

    this.buildRealityView();
    this.buildPanels();
    this.buildHud();

    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  // ---------- UI 구축 ----------

  buildRealityView() {
    // 면접장 스트립
    const strip = this.add.graphics();
    strip.fillStyle(0x0c0616, 0.92);
    strip.fillRoundedRect(16, 14, GAME_W - 32, 218, 18);
    strip.lineStyle(2, 0x5a4a80, 0.6);
    strip.strokeRoundedRect(16, 14, GAME_W - 32, 218, 18);

    // 면접관/지원자 실루엣
    const sil = this.add.graphics();
    sil.fillStyle(0x2a1c45, 1);
    sil.fillCircle(90, 92, 30); // 면접관 머리
    sil.fillRoundedRect(52, 122, 76, 50, 12);
    sil.fillStyle(0x3d2a60, 1);
    sil.fillCircle(GAME_W - 90, 92, 30); // 지원자 머리
    sil.fillRoundedRect(GAME_W - 128, 122, 76, 50, 12);

    this.add
      .text(90, 180, '면접관', { fontFamily: FONT, fontSize: '18px', color: '#7e6ea8' })
      .setOrigin(0.5);
    this.add
      .text(GAME_W - 90, 180, '나 (겉으로는 침착)', { fontFamily: FONT, fontSize: '18px', color: '#7e6ea8' })
      .setOrigin(0.5);

    // 면접관 질문 자막
    this.questionText = this.add
      .text(GAME_W / 2, 66, '', {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffe9c9',
        align: 'center',
        wordWrap: { width: 400 }
      })
      .setOrigin(0.5);

    // 현실 반응 캡션 (폭주 시)
    this.captionText = this.add
      .text(GAME_W / 2, 130, '', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#e88a8a',
        fontStyle: 'italic'
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // 멘탈 게이지
    this.add
      .text(48, 214, 'MENTAL', { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#c9b8e8' })
      .setOrigin(0, 0.5);
    this.mentalBar = this.add.graphics();
    this.drawMental();
  }

  drawMental() {
    const g = this.mentalBar;
    const x = 150;
    const y = 204;
    const w = GAME_W - 150 - 44;
    const h = 20;
    g.clear();
    g.fillStyle(0x241638, 1);
    g.fillRoundedRect(x, y, w, h, 12);
    const p = Phaser.Math.Clamp(this.mental / MENTAL_MAX, 0, 1);
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
        .text(pos.x, pos.y + 12, '정상 근무 중', {
          fontFamily: FONT,
          fontSize: '22px',
          color: '#8a7fa8'
        })
        .setOrigin(0.5);
      this.panels[b.id] = { img, name, idle, pos, bureau: b };
    });
  }

  buildHud() {
    const y = 1130;
    const hud = this.add.graphics();
    hud.fillStyle(0x0c0616, 0.92);
    hud.fillRoundedRect(16, y - 58, GAME_W - 32, 150, 18);

    this.timeText = this.add
      .text(GAME_W / 2, y - 8, '3:00', {
        fontFamily: FONT,
        fontSize: '58px',
        fontStyle: 'bold',
        color: '#ffd9a0'
      })
      .setOrigin(0.5);
    this.scoreText = this.add
      .text(60, y + 48, 'SCORE 0', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0, 0.5);
    this.comboText = this.add
      .text(GAME_W - 60, y + 48, '', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffe9a0' })
      .setOrigin(1, 0.5);
  }

  // ---------- 진행 ----------

  update(_, deltaMs) {
    if (this.over) return;
    this.elapsed += deltaMs / 1000;

    // 시간 표기
    const remain = Math.max(0, RUN_SECONDS - this.elapsed);
    const mm = Math.floor(remain / 60);
    const ss = Math.floor(remain % 60);
    this.timeText.setText(`${mm}:${String(ss).padStart(2, '0')}`);

    // 종료 판정
    if (remain <= 0) {
      this.finish(false);
      return;
    }

    // 웨이브 전환
    const nextWave = this.waveIndex + 1;
    if (nextWave < WAVES.length && this.elapsed >= WAVES[nextWave].t) {
      this.waveIndex = nextWave;
      this.onWave(WAVES[nextWave]);
    }

    // 스폰
    const wave = WAVES[Math.max(0, this.waveIndex)];
    this.spawnAcc += deltaMs;
    if (this.spawnAcc >= wave.spawnEvery) {
      this.spawnAcc = 0;
      if (this.cards.size < wave.maxActive) this.spawnCard(wave);
    }

    // 카드 업데이트
    for (const card of this.cards.values()) card.tick(deltaMs);
  }

  onWave(wave) {
    sfx.wave();
    this.questionText.setText(`“${wave.question}”`);
    this.tweens.add({
      targets: this.questionText,
      scale: { from: 1.25, to: 1 },
      duration: 350,
      ease: 'back.out'
    });
  }

  pickBureau(wave) {
    const free = BUREAUS.filter((b) => !this.cards.has(b.id));
    if (free.length === 0) return null;
    const pool = [];
    for (const b of free) {
      const w = wave.weights[b.id] ?? 1;
      for (let i = 0; i < w; i++) pool.push(b);
    }
    if (pool.length === 0) return Phaser.Utils.Array.GetRandom(free);
    return Phaser.Utils.Array.GetRandom(pool);
  }

  // ---------- 위기 카드 ----------

  spawnCard(wave) {
    const bureau = this.pickBureau(wave);
    if (!bureau) return;
    const crisis = Phaser.Utils.Array.GetRandom(bureau.crisis);
    const panel = this.panels[bureau.id];

    sfx.siren();
    panel.img.setTexture(`panel-${bureau.id}-lit`);
    panel.idle.setVisible(false);

    const c = this.add.container(panel.pos.x, panel.pos.y);
    c.setDepth(10);
    c.bureau = bureau;
    c.crisis = crisis;
    c.life = wave.cardLife;
    c.lifeMax = wave.cardLife;
    c.done = false;

    const paper = this.add.image(0, 0, 'card');
    c.add(paper);
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

    // 타이머 링
    c.ring = this.add.graphics();
    c.add(c.ring);

    if (bureau.interaction === 'choice') {
      this.buildChoiceCard(c, crisis);
    } else {
      this.buildGestureCard(c, bureau);
    }

    c.setScale(0);
    this.tweens.add({ targets: c, scale: 1, duration: 220, ease: 'back.out' });

    c.tick = (dt) => this.tickCard(c, dt);
    this.cards.set(bureau.id, c);
  }

  buildGestureCard(c, bureau) {
    const hint = this.add
      .text(0, 28, bureau.verb, {
        fontFamily: FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#7a5a20'
      })
      .setOrigin(0.5);
    c.add(hint);

    // 진행 바
    c.progress = 0;
    c.progressBar = this.add.graphics();
    c.add(c.progressBar);

    c.setInteractive(
      new Phaser.Geom.Rectangle(-150, -85, 300, 170),
      Phaser.Geom.Rectangle.Contains
    );

    if (bureau.interaction === 'mash') {
      c.on('pointerdown', () => {
        if (c.done) return;
        c.progress += 1 / MASH_TAPS;
        sfx.tap();
        this.tweens.add({ targets: c, angle: { from: -2, to: 0 }, duration: 80 });
        this.drawProgress(c);
        if (c.progress >= 0.999) this.resolveCard(c, SCORE_BASE);
      });
    } else if (bureau.interaction === 'hold') {
      c.holding = false;
      c.holdMs = 0;
      c.on('pointerdown', () => {
        c.holding = true;
      });
      const stop = () => {
        c.holding = false;
      };
      c.on('pointerup', stop);
      c.on('pointerout', stop);
    } else if (bureau.interaction === 'swipe') {
      c.on('pointerdown', (pointer) => {
        c.swipeStart = { x: pointer.x, y: pointer.y };
      });
      c.on('pointermove', (pointer) => {
        if (c.done || !c.swipeStart || !pointer.isDown) return;
        const d = Phaser.Math.Distance.Between(c.swipeStart.x, c.swipeStart.y, pointer.x, pointer.y);
        c.progress = Phaser.Math.Clamp(d / SWIPE_DIST, 0, 1);
        this.drawProgress(c);
        if (d >= SWIPE_DIST) {
          c.swipeStart = null;
          this.resolveCard(c, SCORE_BASE);
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
    // 2지선다: 올바른 단어 결재
    const options = Phaser.Utils.Array.Shuffle([
      { text: crisis.good, good: true },
      { text: crisis.bad, good: false }
    ]);
    options.forEach((opt, i) => {
      const y = 14 + i * 62 - 4;
      const btn = this.add.image(0, y, 'choice-btn').setInteractive({ useHandCursor: true });
      const label = this.add
        .text(0, y, opt.text, {
          fontFamily: FONT,
          fontSize: '24px',
          fontStyle: 'bold',
          color: '#3a2a18'
        })
        .setOrigin(0.5);
      c.add(btn);
      c.add(label);
      btn.on('pointerdown', () => {
        if (c.done) return;
        if (opt.good) {
          this.resolveCard(c, SCORE_CHOICE);
        } else {
          this.wrongChoice(c);
        }
      });
    });
    // choice 카드는 종이가 더 커야 함
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

    // 홀드 진행
    if (c.bureau.interaction === 'hold' && c.holding) {
      c.holdMs += dt;
      c.progress = Phaser.Math.Clamp(c.holdMs / HOLD_MS, 0, 1);
      if (Math.random() < 0.2) sfx.holdTick(c.progress);
      this.drawProgress(c);
      if (c.progress >= 1) {
        this.resolveCard(c, SCORE_BASE);
        return;
      }
    }

    // 수명 감소 + 타이머 링
    c.life -= dt;
    const p = Phaser.Math.Clamp(c.life / c.lifeMax, 0, 1);
    const ring = c.ring;
    ring.clear();
    ring.lineStyle(7, p > 0.4 ? 0x53a860 : 0xe8565e, 1);
    ring.beginPath();
    ring.arc(118, -50, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p, false);
    ring.strokePath();

    if (c.life <= 0) this.burstCard(c);
  }

  resolveCard(c, base) {
    if (c.done) return;
    c.done = true;
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const mult = Math.min(MULT_MAX, 1 + Math.floor(this.combo / COMBO_STEP));
    const gained = base * mult;
    this.score += gained;
    this.mental = Math.min(MENTAL_MAX, this.mental + MENTAL_RESOLVE_HEAL);
    this.stats[c.bureau.id].resolved += 1;

    sfx.stamp();
    if (this.combo > 0 && this.combo % COMBO_STEP === 0) sfx.chime(this.combo / COMBO_STEP);

    // 도장 연출 + 점수 플로팅
    this.floatText(c.x, c.y - 40, `+${gained}`, '#ffe9a0');
    this.stampEffect(c);
    this.updateHud();
    this.drawMental();
    this.removeCard(c, true);
  }

  wrongChoice(c) {
    if (c.done) return;
    c.done = true;
    this.combo = 0;
    this.mental -= MENTAL_WRONG_CHOICE;
    this.stats[c.bureau.id].burst += 1;
    sfx.wrong();
    this.floatText(c.x, c.y - 40, '앗, 오탈자!', '#e8565e');
    this.showCaption('(지원자가 이상한 단어를 말할 뻔했다)');
    this.updateHud();
    this.drawMental();
    this.removeCard(c, false);
    this.checkGameOver();
  }

  burstCard(c) {
    if (c.done) return;
    c.done = true;
    this.combo = 0;
    const dmg = Phaser.Math.Between(MENTAL_BURST_DAMAGE[0], MENTAL_BURST_DAMAGE[1]);
    this.mental -= dmg;
    this.stats[c.bureau.id].burst += 1;

    sfx.burst();
    this.cameras.main.shake(180, 0.008);
    this.floatText(c.x, c.y - 40, `-${dmg} 멘탈`, '#e8565e');
    this.showCaption(CAPTIONS[c.bureau.id] || '(지원자의 동공이 흔들린다)');
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
        quantity: 14,
        scale: { start: 0.7, end: 0 },
        tint: c.bureau.accent,
        emitting: false
      });
      p.explode(14);
      this.time.delayedCall(600, () => p.destroy());
    }
  }

  stampEffect(c) {
    const stamp = this.add
      .text(c.x + 70, c.y + 20, '결재', {
        fontFamily: FONT,
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#b5443c'
      })
      .setOrigin(0.5)
      .setAngle(-14)
      .setDepth(20)
      .setScale(2)
      .setAlpha(0);
    this.tweens.add({
      targets: stamp,
      scale: 1,
      alpha: 1,
      duration: 130,
      ease: 'back.in',
      onComplete: () => {
        this.tweens.add({ targets: stamp, alpha: 0, delay: 200, duration: 200, onComplete: () => stamp.destroy() });
      }
    });
  }

  floatText(x, y, str, color) {
    const t = this.add
      .text(x, y, str, { fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color })
      .setOrigin(0.5)
      .setDepth(30);
    this.tweens.add({
      targets: t,
      y: y - 70,
      alpha: 0,
      duration: 800,
      ease: 'sine.out',
      onComplete: () => t.destroy()
    });
  }

  showCaption(text) {
    this.captionText.setText(text);
    this.captionText.setAlpha(1);
    this.tweens.killTweensOf(this.captionText);
    this.tweens.add({ targets: this.captionText, alpha: 0, delay: 1200, duration: 400 });
  }

  updateHud() {
    this.scoreText.setText(`SCORE ${this.score.toLocaleString()}`);
    const mult = Math.min(MULT_MAX, 1 + Math.floor(this.combo / COMBO_STEP));
    this.comboText.setText(this.combo >= 2 ? `${this.combo} COMBO ×${mult}` : '');
  }

  checkGameOver() {
    if (this.mental <= 0) {
      this.mental = 0;
      this.finish(true);
    }
  }

  finish(failed) {
    if (this.over) return;
    this.over = true;
    for (const card of this.cards.values()) card.destroy();
    this.cards.clear();
    if (failed) sfx.gameover();
    else sfx.fanfare();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(520, () => {
      this.scene.start('Ep01Result', {
        failed,
        score: this.score,
        mental: this.mental,
        maxCombo: this.maxCombo,
        stats: this.stats
      });
    });
  }
}

// 폭주 시 현실 뷰 캡션 (국별)
const CAPTIONS = {
  memory: '(지원자가 "그… 그게…"를 반복한다)',
  body: '(지원자의 다리가 책상을 두드린다)',
  emotion: '(지원자의 눈시울이 촉촉해졌다)',
  impulse: '(지원자의 손이 주머니로 향한다)',
  speech: '(지원자가 이상한 단어를 말했다)',
  dream: '(지원자의 초점이 창밖으로 떠났다)'
};
