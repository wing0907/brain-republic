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
  WAVES,
  PERFECT_LIFE,
  PERFECT_MULT,
  FEVER_COMBO,
  FEVER_MS,
  FEVER_SCORE_MULT,
  FEVER_SPAWN_ACCEL,
  BOSS_AT,
  BOSS_TIME_MS,
  BOSS_SCORE,
  BOSS_FAIL_DMG,
  BOSS_HEAL
} from '../config.js';
import { BUREAUS } from '../data/bureaus.js';
import { sfx, music } from '../systems/audio.js';

const FONT = 'Galmuri11, Pretendard, "Apple SD Gothic Neo", sans-serif';

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

    // 아케이드 심화 상태
    this.perfects = 0;
    this.feverUntil = 0;
    this.feverCount = 0;
    this.boss = null;
    this.bossSpawned = false;
    this.bossCleared = false;

    // 피버 오버레이 (노을이 달아오르는 연출)
    this.feverOverlay = this.add
      .rectangle(GAME_W / 2, 640, GAME_W, 1280, 0xff8c42, 0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(5);

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

    // 피버 종료 체크
    if (this.feverUntil > 0 && this.elapsed * 1000 >= this.feverUntil) {
      this.feverUntil = 0;
      music.setRate(1);
      this.tweens.add({ targets: this.feverOverlay, fillAlpha: 0, duration: 500 });
    }

    // 보스: 마지막 웨이브 개막과 함께 압박 면접관 등장
    if (!this.bossSpawned && this.elapsed >= BOSS_AT) {
      this.bossSpawned = true;
      this.spawnBoss();
    }

    // 스폰 (보스 대치 중에는 일반 위기 중단, 피버 중에는 가속)
    const wave = WAVES[Math.max(0, this.waveIndex)];
    this.spawnAcc += deltaMs;
    const interval = wave.spawnEvery * (this.feverUntil > 0 ? FEVER_SPAWN_ACCEL : 1);
    if (this.spawnAcc >= interval && !this.boss) {
      this.spawnAcc = 0;
      if (this.cards.size < wave.maxActive) this.spawnCard(wave);
    }

    // 카드 업데이트
    for (const card of this.cards.values()) card.tick(deltaMs);
    if (this.boss) this.tickBoss(deltaMs);
  }

  // ---------- 피버 ----------

  startFever() {
    if (this.feverUntil > 0) return;
    this.feverUntil = this.elapsed * 1000 + FEVER_MS;
    this.feverCount += 1;
    music.setRate(1.25);
    sfx.fanfare();
    this.tweens.add({ targets: this.feverOverlay, fillAlpha: 0.12, duration: 300 });
    const banner = this.add
      .text(GAME_W / 2, 620, '🔥 FEVER TIME! 점수 ×2 🔥', {
        fontFamily: FONT,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffd9a0',
        stroke: '#7a3b12',
        strokeThickness: 10
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setScale(0);
    this.tweens.add({
      targets: banner,
      scale: 1,
      duration: 300,
      ease: 'back.out',
      onComplete: () =>
        this.tweens.add({ targets: banner, alpha: 0, y: 560, delay: 900, duration: 400, onComplete: () => banner.destroy() })
    });
  }

  punchZoom() {
    this.tweens.killTweensOf(this.cameras.main);
    this.cameras.main.zoom = 1;
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.03,
      duration: 60,
      yoyo: true,
      ease: 'sine.out'
    });
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

    // PERFECT 판정: 타이머 링이 넉넉할 때 해결 (빠르고 정확한 손맛 보상)
    const perfect = c.lifeMax > 0 && c.life / c.lifeMax >= PERFECT_LIFE;
    if (perfect) this.perfects += 1;

    const comboMult = Math.min(MULT_MAX, 1 + Math.floor(this.combo / COMBO_STEP));
    let gained = base * comboMult;
    if (perfect) gained = Math.round(gained * PERFECT_MULT);
    if (this.feverUntil > 0) gained *= FEVER_SCORE_MULT;
    this.score += gained;
    this.mental = Math.min(MENTAL_MAX, this.mental + MENTAL_RESOLVE_HEAL);
    this.stats[c.bureau.id].resolved += 1;

    sfx.stamp();
    if (perfect) sfx.chime(6);
    if (this.combo > 0 && this.combo % COMBO_STEP === 0) sfx.chime(this.combo / COMBO_STEP);
    if (this.combo === FEVER_COMBO) this.startFever();
    this.punchZoom();

    // 도장 연출 + 점수 플로팅
    this.floatText(
      c.x,
      c.y - 40,
      perfect ? `PERFECT +${gained}` : `+${gained}`,
      perfect ? '#ffe14a' : '#ffe9a0'
    );
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

  // ---------- 보스: 압박 면접관 ----------

  spawnBoss() {
    sfx.danger();
    this.showCaption('(압박 면접관이 안경을 고쳐 쓴다…)');
    this.cameras.main.shake(250, 0.006);

    const c = this.add.container(GAME_W / 2, 640).setDepth(60);
    const paper = this.add.image(0, 0, 'card').setScale(1.7, 2.0);
    c.add(paper);
    c.add(
      this.add
        .text(0, -130, '⚡ 압박 면접관 등장 ⚡', {
          fontFamily: FONT,
          fontSize: '32px',
          fontStyle: 'bold',
          color: '#b5443c'
        })
        .setOrigin(0.5)
    );
    c.phaseText = this.add
      .text(0, -70, '', {
        fontFamily: FONT,
        fontSize: '27px',
        fontStyle: 'bold',
        color: '#3a2a18',
        align: 'center',
        wordWrap: { width: 440 }
      })
      .setOrigin(0.5);
    c.add(c.phaseText);
    c.hint = this.add
      .text(0, 20, '', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#7a5a20' })
      .setOrigin(0.5);
    c.add(c.hint);
    c.progressBar = this.add.graphics();
    c.add(c.progressBar);
    c.ring = this.add.graphics();
    c.add(c.ring);

    c.life = BOSS_TIME_MS;
    c.lifeMax = BOSS_TIME_MS;
    c.phase = 0;
    c.mash = 0;
    c.holding = false;
    c.holdMs = 0;
    c.done = false;
    c.progress = 0;

    c.setInteractive(new Phaser.Geom.Rectangle(-255, -170, 510, 340), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', () => {
      if (c.done) return;
      if (c.phase === 0) {
        c.mash += 1;
        sfx.tap();
        this.tweens.add({ targets: c, angle: { from: -1.5, to: 0 }, duration: 70 });
        c.progress = c.mash / 8;
        this.drawBossProgress(c);
        if (c.mash >= 8) this.bossAdvance(c);
      } else if (c.phase === 1) {
        c.holding = true;
      }
    });
    const stop = () => (c.holding = false);
    c.on('pointerup', stop);
    c.on('pointerout', stop);

    this.setBossPhase(c, 0);
    c.setScale(0);
    this.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'back.out' });
    this.boss = c;
  }

  setBossPhase(c, phase) {
    c.phase = phase;
    c.progress = 0;
    this.drawBossProgress(c);
    if (phase === 0) {
      c.phaseText.setText('"그래서, 그게 왜 우리 회사여야 하죠?"\n꼬리질문 폭격이 쏟아진다!');
      c.hint.setText('연타로 논리 방어! (8회)');
    } else if (phase === 1) {
      c.phaseText.setText('…정적. 면접관이 말없이 응시한다.');
      c.hint.setText('길게 눌러 심호흡을 유지하라!');
    } else if (phase === 2) {
      c.phaseText.setText('"마지막으로, 하고 싶은 말 있습니까?"');
      c.hint.setText('올바른 마무리 멘트를 결재하라!');
      const options = Phaser.Utils.Array.Shuffle([
        { text: '최선을 다하겠습니다!', good: true },
        { text: '최선을 다할게염!', good: false }
      ]);
      options.forEach((opt, i) => {
        const y = 70 + i * 64;
        const btn = this.add.image(0, y, 'choice-btn').setScale(1.3).setInteractive({ useHandCursor: true });
        const label = this.add
          .text(0, y, opt.text, { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#3a2a18' })
          .setOrigin(0.5);
        c.add(btn);
        c.add(label);
        btn.on('pointerdown', () => {
          if (c.done) return;
          if (opt.good) this.bossSuccess(c);
          else {
            sfx.wrong();
            this.mental -= MENTAL_WRONG_CHOICE;
            this.floatText(c.x, c.y - 200, '햡…햡격?!', '#e8565e');
            this.drawMental();
            this.checkGameOver();
          }
        });
      });
    }
    sfx.wave();
  }

  bossAdvance(c) {
    sfx.stamp();
    this.punchZoom();
    this.setBossPhase(c, c.phase + 1);
  }

  drawBossProgress(c) {
    const g = c.progressBar;
    g.clear();
    if (c.phase >= 2) return;
    g.fillStyle(0xdcd2ba, 1);
    g.fillRoundedRect(-180, 110, 360, 16, 8);
    if (c.progress > 0) {
      g.fillStyle(0x53a860, 1);
      g.fillRoundedRect(-180, 110, 360 * Phaser.Math.Clamp(c.progress, 0, 1), 16, 8);
    }
  }

  tickBoss(dt) {
    const c = this.boss;
    if (!c || c.done) return;

    if (c.phase === 1 && c.holding) {
      c.holdMs += dt;
      c.progress = Phaser.Math.Clamp(c.holdMs / 1200, 0, 1);
      if (Math.random() < 0.2) sfx.holdTick(c.progress);
      this.drawBossProgress(c);
      if (c.progress >= 1) {
        this.bossAdvance(c);
        return;
      }
    }

    c.life -= dt;
    const p = Phaser.Math.Clamp(c.life / c.lifeMax, 0, 1);
    c.ring.clear();
    c.ring.lineStyle(9, p > 0.4 ? 0x53a860 : 0xe8565e, 1);
    c.ring.beginPath();
    c.ring.arc(210, -140, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p, false);
    c.ring.strokePath();
    if (c.life <= 0) this.bossFail(c);
  }

  bossSuccess(c) {
    c.done = true;
    this.bossCleared = true;
    const comboMult = Math.min(MULT_MAX, 1 + Math.floor(this.combo / COMBO_STEP));
    let gained = BOSS_SCORE * comboMult;
    if (this.feverUntil > 0) gained *= FEVER_SCORE_MULT;
    this.score += gained;
    this.mental = Math.min(MENTAL_MAX, this.mental + BOSS_HEAL);
    sfx.fanfare();
    this.punchZoom();
    this.floatText(c.x, c.y - 210, `압박 면접 돌파! +${gained}`, '#ffe14a');
    this.showCaption('(면접관이 처음으로 고개를 끄덕였다)');
    this.updateHud();
    this.drawMental();
    this.destroyBoss(c, true);
  }

  bossFail(c) {
    c.done = true;
    this.mental -= BOSS_FAIL_DMG;
    sfx.burst();
    this.cameras.main.shake(300, 0.012);
    this.floatText(c.x, c.y - 210, `압박에 무너졌다… -${BOSS_FAIL_DMG} 멘탈`, '#e8565e');
    this.showCaption('(지원자의 이마에 식은땀 한 줄기)');
    this.updateHud();
    this.drawMental();
    this.destroyBoss(c, false);
    this.checkGameOver();
  }

  destroyBoss(c, success) {
    this.boss = null;
    this.tweens.add({
      targets: c,
      scale: success ? 1.15 : 0.8,
      alpha: 0,
      duration: 250,
      onComplete: () => c.destroy()
    });
  }

  finish(failed) {
    if (this.over) return;
    this.over = true;
    music.setRate(1);
    for (const card of this.cards.values()) card.destroy();
    this.cards.clear();
    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }
    if (failed) sfx.gameover();
    else sfx.fanfare();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(520, () => {
      this.scene.start('Ep01Result', {
        failed,
        score: this.score,
        mental: this.mental,
        maxCombo: this.maxCombo,
        stats: this.stats,
        perfects: this.perfects,
        feverCount: this.feverCount,
        bossCleared: this.bossCleared
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
