import Phaser from 'phaser';
import {
  GAME_W,
  GAME_H,
  TERRAIN_TOP,
  TERRAIN_BASE,
  GRAVITY,
  WIND_MAX,
  POWER_MAX,
  DRAG_TO_POWER,
  HP_MAX,
  DIRECT_DMG,
  SPLASH_RADIUS,
  SPLASH_DMG,
  CRATER_RADIUS,
  CRATER_DEPTH,
  ROUNDS,
  BEST_KEY
} from '../config.js';
import { PLAYER_TEAM, MATCHUPS } from '../data/matchups.js';
import { sfx, music, setMuted, isMuted } from '../systems/audio.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", sans-serif';

const P_X = 120;   // 플레이어 진지 x
const E_X = 600;   // 상대 진지 x
const UNIT_R = 38; // 직격 판정 반경

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Battle' });
  }

  init(data) {
    this.round = data?.round ?? 0;
  }

  create() {
    this.matchup = MATCHUPS[this.round];
    this.aiCfg = ROUNDS[this.round];
    this.turn = null; // 'player' | 'enemy' | 'anim' | 'over'
    this.wind = 0;
    this.shell = null;
    this.hp = { player: HP_MAX, enemy: HP_MAX };

    this.add.image(GAME_W / 2, GAME_H / 2, 'sky');

    this.makeTerrain();
    this.makeUnits();
    this.makeHud();
    this.makeAiming();

    this.showIntro();
  }

  // ---------- 지형 (하이트맵 + 크레이터) ----------

  makeTerrain() {
    const rnd = new Phaser.Math.RandomDataGenerator(['terrain', String(this.round), String(Date.now() % 7)]);
    this.h = new Array(GAME_W);
    const a1 = rnd.between(40, 90);
    const a2 = rnd.between(20, 50);
    const p1 = rnd.frac() * Math.PI * 2;
    const p2 = rnd.frac() * Math.PI * 2;
    const mid = rnd.between(-60, 40); // 중앙 언덕/골짜기
    for (let x = 0; x < GAME_W; x++) {
      const t = x / GAME_W;
      let y =
        TERRAIN_BASE -
        a1 * Math.sin(t * Math.PI * 2 * 1.2 + p1) -
        a2 * Math.sin(t * Math.PI * 2 * 2.7 + p2) -
        mid * Math.sin(t * Math.PI); // 중앙 융기
      this.h[x] = Phaser.Math.Clamp(y, TERRAIN_TOP + 40, GAME_H - 90);
    }
    // 진지 주변 평탄화
    for (const ux of [P_X, E_X]) {
      const base = this.h[ux];
      for (let x = Math.max(0, ux - 46); x < Math.min(GAME_W, ux + 46); x++) {
        const d = Math.abs(x - ux) / 46;
        this.h[x] = this.h[x] * d + base * (1 - d);
      }
    }
    this.terrainG = this.add.graphics().setDepth(5);
    this.drawTerrain();
  }

  drawTerrain() {
    const g = this.terrainG;
    g.clear();
    // 본체
    const pts = [{ x: 0, y: GAME_H }];
    for (let x = 0; x < GAME_W; x += 3) pts.push({ x, y: this.h[x] });
    pts.push({ x: GAME_W, y: this.h[GAME_W - 1] });
    pts.push({ x: GAME_W, y: GAME_H });
    g.fillStyle(0x46284f, 1);
    g.fillPoints(pts, true);
    // 표면 글로우(뇌 주름 능선)
    g.lineStyle(6, 0xff9a5e, 0.5);
    g.beginPath();
    g.moveTo(0, this.h[0]);
    for (let x = 3; x < GAME_W; x += 3) g.lineTo(x, this.h[x]);
    g.strokePath();
    g.lineStyle(2, 0xffd9a0, 0.8);
    g.beginPath();
    g.moveTo(0, this.h[0] - 2);
    for (let x = 3; x < GAME_W; x += 3) g.lineTo(x, this.h[x] - 2);
    g.strokePath();
    // 지층 음영
    g.fillStyle(0x2a1636, 0.5);
    const pts2 = [{ x: 0, y: GAME_H }];
    for (let x = 0; x < GAME_W; x += 6) pts2.push({ x, y: Math.min(GAME_H - 20, this.h[x] + 90) });
    pts2.push({ x: GAME_W, y: GAME_H });
    g.fillPoints(pts2, true);
  }

  heightAt(x) {
    const xi = Phaser.Math.Clamp(Math.round(x), 0, GAME_W - 1);
    return this.h[xi];
  }

  crater(cx, cy) {
    for (let x = Math.max(0, Math.floor(cx - CRATER_RADIUS)); x <= Math.min(GAME_W - 1, Math.ceil(cx + CRATER_RADIUS)); x++) {
      const dx = x - cx;
      const dy = Math.sqrt(Math.max(0, CRATER_RADIUS * CRATER_RADIUS - dx * dx));
      const floorY = cy + (dy * CRATER_DEPTH) / CRATER_RADIUS;
      if (floorY > this.h[x]) this.h[x] = Math.min(GAME_H - 60, floorY);
    }
    this.drawTerrain();
    this.settleUnits();
  }

  // ---------- 유닛 ----------

  makeUnits() {
    this.units = {};
    const mk = (id, x, texKey, flip) => {
      const c = this.add.container(x, this.heightAt(x) - 34).setDepth(10);
      const barrel = this.add.image(flip ? -10 : 10, -6, 'barrel').setOrigin(0.15, 0.5);
      if (flip) barrel.setFlipX(true);
      const blob = this.add.image(0, 0, texKey);
      if (flip) blob.setFlipX(true);
      c.add([barrel, blob]);
      c.barrel = barrel;
      c.blob = blob;
      this.units[id] = c;
      // 숨쉬기
      this.tweens.add({
        targets: blob,
        scaleY: { from: 1, to: 1.04 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inout'
      });
    };
    mk('player', P_X, 'blob-player', false);
    mk('enemy', E_X, `blob-e${this.round}`, true);
    this.setBarrelAngle('player', -45);
    this.setBarrelAngle('enemy', 225);
  }

  setBarrelAngle(id, deg) {
    this.units[id].barrel.setAngle(deg);
  }

  settleUnits() {
    for (const id of ['player', 'enemy']) {
      const u = this.units[id];
      const ty = this.heightAt(u.x) - 34;
      if (Math.abs(ty - u.y) > 2) {
        this.tweens.add({ targets: u, y: ty, duration: 260, ease: 'bounce.out' });
      }
    }
  }

  // ---------- HUD ----------

  makeHud() {
    const g = this.add.graphics().setDepth(50);
    g.fillStyle(0x0c0616, 0.82);
    g.fillRoundedRect(14, 14, GAME_W - 28, 168, 20);
    g.lineStyle(2, 0x5a4a80, 0.7);
    g.strokeRoundedRect(14, 14, GAME_W - 28, 168, 20);

    this.add
      .text(GAME_W / 2, 44, `ROUND ${this.round + 1} / ${MATCHUPS.length}`, {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffd9a0'
      })
      .setOrigin(0.5)
      .setDepth(51);

    this.add
      .text(36, 86, PLAYER_TEAM.name, { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#e0b8ff' })
      .setOrigin(0, 0.5)
      .setDepth(51);
    this.add
      .text(GAME_W - 36, 86, this.matchup.name, {
        fontFamily: FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#' + this.matchup.accent.toString(16).padStart(6, '0')
      })
      .setOrigin(1, 0.5)
      .setDepth(51);
    this.hpG = this.add.graphics().setDepth(51);

    this.windText = this.add
      .text(GAME_W / 2, 148, '', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#a8e8f0' })
      .setOrigin(0.5)
      .setDepth(51);
    this.turnText = this.add
      .text(GAME_W / 2, 226, '', {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#fff6e3',
        backgroundColor: '#241638dd',
        padding: { x: 14, y: 8 }
      })
      .setOrigin(0.5)
      .setDepth(51);

    const snd = this.add
      .text(GAME_W - 30, 44, isMuted() ? '🔇' : '🔊', { fontSize: '26px' })
      .setOrigin(1, 0.5)
      .setDepth(51)
      .setInteractive({ useHandCursor: true });
    snd.on('pointerdown', () => {
      setMuted(!isMuted());
      snd.setText(isMuted() ? '🔇' : '🔊');
    });
    this.drawHp();
  }

  drawHp() {
    const g = this.hpG;
    g.clear();
    const bar = (x, hp, alignRight, color) => {
      const w = 280;
      const p = Phaser.Math.Clamp(hp / HP_MAX, 0, 1);
      const bx = alignRight ? x - w : x;
      g.fillStyle(0x241638, 1);
      g.fillRoundedRect(bx, 104, w, 18, 9);
      if (p > 0) {
        g.fillStyle(color, 1);
        const fw = Math.max(12, w * p);
        g.fillRoundedRect(alignRight ? x - fw : bx, 104, fw, 18, 9);
      }
      g.lineStyle(2, 0x8a6fc0, 0.7);
      g.strokeRoundedRect(bx, 104, w, 18, 9);
    };
    bar(36, this.hp.player, false, 0xb069e8);
    bar(GAME_W - 36, this.hp.enemy, true, this.matchup.color);
  }

  rollWind() {
    this.wind = Phaser.Math.Between(-WIND_MAX, WIND_MAX);
    const dir = this.wind > 8 ? '→' : this.wind < -8 ? '←' : '·';
    const mag = Math.abs(this.wind);
    const level = mag < 8 ? '무풍' : mag < 40 ? '산들' : mag < 70 ? '강풍' : '돌풍';
    this.windText.setText(`주인님의 변덕(바람) ${dir} ${level} ${mag > 8 ? Math.round(mag) : ''}`);
  }

  // ---------- 조준/발사 (슬링샷) ----------

  makeAiming() {
    this.aimG = this.add.graphics().setDepth(40);
    this.dragStart = null;

    this.input.on('pointerdown', (p) => {
      if (this.turn !== 'player') return;
      this.dragStart = { x: p.x, y: p.y };
    });
    this.input.on('pointermove', (p) => {
      if (this.turn !== 'player' || !this.dragStart || !p.isDown) return;
      this.previewAim(p);
    });
    this.input.on('pointerup', (p) => {
      if (this.turn !== 'player' || !this.dragStart) return;
      const v = this.dragVector(p);
      this.aimG.clear();
      const start = this.dragStart;
      this.dragStart = null;
      if (!v) return;
      this.fire('player', v.vx, v.vy);
    });
  }

  dragVector(p) {
    const dx = this.dragStart.x - p.x;
    const dy = this.dragStart.y - p.y;
    const len = Math.hypot(dx, dy);
    if (len < 24) return null;
    const pow = Math.min(POWER_MAX, len * DRAG_TO_POWER);
    const nx = dx / len;
    const ny = dy / len;
    return { vx: nx * pow, vy: ny * pow, pow };
  }

  previewAim(p) {
    const v = this.dragVector(p);
    const g = this.aimG;
    g.clear();
    if (!v) return;
    const u = this.units.player;
    this.setBarrelAngle('player', Phaser.Math.RadToDeg(Math.atan2(v.vy, v.vx)));
    // 점선 궤적 미리보기
    let x = u.x;
    let y = u.y - 10;
    let vx = v.vx;
    let vy = v.vy;
    const dt = 0.055;
    for (let i = 0; i < 26; i++) {
      vx += this.wind * dt;
      vy += GRAVITY * dt;
      x += vx * dt;
      y += vy * dt;
      if (y > this.heightAt(x)) break;
      const a = 0.85 - i * 0.03;
      g.fillStyle(0xffe9a0, Math.max(0.12, a));
      g.fillCircle(x, y, Math.max(2.5, 6 - i * 0.14));
    }
    // 파워 게이지 (유닛 위 호)
    const pr = v.pow / POWER_MAX;
    g.lineStyle(7, pr > 0.85 ? 0xe8565e : 0xffd9a0, 0.9);
    g.beginPath();
    g.arc(u.x, u.y, 52, Math.PI, Math.PI + Math.PI * pr, false);
    g.strokePath();
  }

  fire(who, vx, vy) {
    this.turn = 'anim';
    this.turnText.setText('');
    sfx.fire();
    const u = this.units[who];
    this.setBarrelAngle(who, Phaser.Math.RadToDeg(Math.atan2(vy, vx)));
    this.tweens.add({ targets: u, x: u.x + (vx > 0 ? -8 : 8), duration: 70, yoyo: true }); // 반동
    this.shell = {
      who,
      x: u.x,
      y: u.y - 10,
      vx,
      vy,
      spr: this.add.image(u.x, u.y - 10, 'shell').setDepth(30)
    };
    this.trail = this.add.particles(0, 0, 'dot', {
      follow: this.shell.spr,
      scale: { start: 0.28, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: 0xffd9a0,
      lifespan: 320,
      frequency: 24
    });
  }

  // ---------- 폭발/피해 ----------

  explode(x, y, direct) {
    if (this.trail) {
      this.trail.destroy();
      this.trail = null;
    }
    if (this.shell) {
      this.shell.spr.destroy();
      this.shell = null;
    }
    direct ? sfx.crit() : sfx.boom();
    this.cameras.main.shake(direct ? 300 : 200, direct ? 0.016 : 0.01);

    // 폭발 이펙트
    const p = this.add.particles(x, y, 'dot', {
      speed: { min: 90, max: 340 },
      lifespan: 600,
      quantity: 26,
      scale: { start: 0.9, end: 0 },
      tint: [0xffd9a0, 0xff9a5e, 0xe8565e, 0xfff6dc],
      emitting: false
    });
    p.explode(26);
    this.time.delayedCall(700, () => p.destroy());
    const ring = this.add.circle(x, y, 10, 0xfff0c8, 0.55).setDepth(35);
    this.tweens.add({ targets: ring, radius: SPLASH_RADIUS, alpha: 0, duration: 320, onComplete: () => ring.destroy() });

    // 지형 파괴
    this.crater(x, y);

    // 피해 (양측 모두 스플래시 — 자폭 주의는 포트리스의 낭만)
    for (const id of ['player', 'enemy']) {
      const u = this.units[id];
      const d = Phaser.Math.Distance.Between(x, y, u.x, u.y);
      let dmg = 0;
      if (direct && id === direct) dmg = DIRECT_DMG + Math.round(SPLASH_DMG * 0.8);
      else if (d < SPLASH_RADIUS) dmg = Math.round(SPLASH_DMG * (1 - d / SPLASH_RADIUS));
      if (dmg > 0) {
        this.hp[id] = Math.max(0, this.hp[id] - dmg);
        this.floatText(u.x, u.y - 70, `-${dmg}`, id === 'player' ? '#ff8a8a' : '#ffe14a');
        this.tweens.add({ targets: u.blob, angle: { from: -14, to: 0 }, duration: 300, ease: 'back.out' });
      }
    }
    this.drawHp();

    this.time.delayedCall(650, () => this.afterTurn());
  }

  afterTurn() {
    if (this.hp.enemy <= 0) {
      this.roundWin();
      return;
    }
    if (this.hp.player <= 0) {
      this.roundLose();
      return;
    }
    const next = this.lastWho === 'player' ? 'enemy' : 'player';
    this.startTurn(next);
  }

  startTurn(who) {
    this.rollWind();
    this.turn = who;
    if (who === 'player') {
      this.turnText.setText('내 차례! 드래그로 조준 → 놓으면 발사');
    } else {
      this.turnText.setText(`${this.matchup.name}이(가) 조준 중…`);
      // 이따금 도발
      if (Math.random() < 0.4) this.speech(this.units.enemy, this.matchup.taunt);
      this.time.delayedCall(1100, () => this.aiFire());
    }
  }

  // ---------- AI ----------

  aiFire() {
    if (this.turn !== 'enemy') return;
    const e = this.units.enemy;
    const t = this.units.player;
    // 샘플링으로 최적해 탐색
    let best = null;
    for (let i = 0; i < 60; i++) {
      const ang = Phaser.Math.DegToRad(Phaser.Math.FloatBetween(115, 165)); // 좌상 방향
      const pow = Phaser.Math.FloatBetween(POWER_MAX * 0.4, POWER_MAX);
      const land = this.simulateLanding(e.x, e.y - 10, Math.cos(ang) * pow, Math.sin(-Math.abs(Math.sin(ang))) * pow, ang, pow);
      const err = Math.abs(land - t.x);
      if (!best || err < best.err) best = { ang, pow, err };
    }
    // 라운드 난이도 오차 적용
    const ang = best.ang + Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-this.aiCfg.aimErr, this.aiCfg.aimErr));
    const pow = best.pow * (1 + Phaser.Math.FloatBetween(-this.aiCfg.powErr, this.aiCfg.powErr));
    this.fire('enemy', Math.cos(ang) * pow, -Math.abs(Math.sin(ang)) * pow);
  }

  simulateLanding(sx, sy, vx0, vy0, ang, pow) {
    let x = sx;
    let y = sy;
    let vx = Math.cos(ang) * pow;
    let vy = -Math.abs(Math.sin(ang)) * pow;
    const dt = 0.05;
    for (let i = 0; i < 200; i++) {
      vx += this.wind * dt;
      vy += GRAVITY * dt;
      x += vx * dt;
      y += vy * dt;
      if (x < -60 || x > GAME_W + 60) return x;
      if (y > this.heightAt(x)) return x;
    }
    return x;
  }

  // ---------- 진행 ----------

  update(_, deltaMs) {
    const s = this.shell;
    if (!s) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    s.vx += this.wind * dt;
    s.vy += GRAVITY * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.spr.setPosition(s.x, s.y);
    s.spr.setAngle(Phaser.Math.RadToDeg(Math.atan2(s.vy, s.vx)) + 90);

    this.lastWho = s.who;
    // 직격 판정
    const targetId = s.who === 'player' ? 'enemy' : 'player';
    const tu = this.units[targetId];
    if (Phaser.Math.Distance.Between(s.x, s.y, tu.x, tu.y) < UNIT_R) {
      const x = s.x;
      const y = s.y;
      this.shellCleanup();
      this.explode(x, y, targetId);
      return;
    }
    // 지형 충돌
    if (s.y > this.heightAt(s.x)) {
      const x = s.x;
      const y = this.heightAt(s.x);
      this.shellCleanup();
      this.explode(x, y, null);
      return;
    }
    // 장외
    if (s.x < -80 || s.x > GAME_W + 80 || s.y > GAME_H + 100) {
      this.shellCleanup();
      this.floatText(GAME_W / 2, 400, '장외!', '#a99cc7');
      this.time.delayedCall(400, () => this.afterTurn());
    }
  }

  shellCleanup() {
    if (this.trail) {
      this.trail.destroy();
      this.trail = null;
    }
    if (this.shell) {
      this.shell.spr.destroy();
      this.shell = null;
    }
  }

  // ---------- 라운드 흐름 ----------

  showIntro() {
    this.turn = 'over';
    const dim = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.62).setDepth(90).setInteractive();
    const panel = this.add.graphics().setDepth(91);
    panel.fillStyle(0x1a0f2e, 0.97);
    panel.fillRoundedRect(50, 380, GAME_W - 100, 520, 26);
    panel.lineStyle(3, 0x8a6fc0, 0.9);
    panel.strokeRoundedRect(50, 380, GAME_W - 100, 520, 26);
    const objs = [dim, panel];

    objs.push(
      this.add
        .text(GAME_W / 2, 440, `ROUND ${this.round + 1}`, {
          fontFamily: FONT,
          fontSize: '30px',
          fontStyle: 'bold',
          color: '#8a7fa8'
        })
        .setOrigin(0.5)
        .setDepth(92)
    );
    objs.push(
      this.add
        .text(GAME_W / 2, 505, `${PLAYER_TEAM.name}  VS  ${this.matchup.name}`, {
          fontFamily: FONT,
          fontSize: '30px',
          fontStyle: 'bold',
          color: '#fff6e3',
          align: 'center',
          wordWrap: { width: 560 }
        })
        .setOrigin(0.5)
        .setDepth(92)
    );
    const vsL = this.add.image(180, 620, 'blob-player').setScale(1.15).setDepth(92);
    const vsR = this.add.image(GAME_W - 180, 620, `blob-e${this.round}`).setScale(1.15).setFlipX(true).setDepth(92);
    objs.push(vsL, vsR);
    objs.push(
      this.add
        .text(GAME_W / 2, 620, '⚡', { fontSize: '48px' })
        .setOrigin(0.5)
        .setDepth(92)
    );
    objs.push(
      this.add
        .text(GAME_W / 2, 745, this.matchup.intro, {
          fontFamily: FONT,
          fontSize: '23px',
          color: '#c9b8e8',
          align: 'center',
          lineSpacing: 8,
          wordWrap: { width: 560 }
        })
        .setOrigin(0.5)
        .setDepth(92)
    );
    const btn = this.add.image(GAME_W / 2, 848, 'button').setScale(0.8, 0.72).setDepth(92).setInteractive({ useHandCursor: true });
    const bt = this.add
      .text(GAME_W / 2, 845, '대전 개시!', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#3a1c05' })
      .setOrigin(0.5)
      .setDepth(93);
    objs.push(btn, bt);
    btn.on('pointerdown', () => {
      sfx.ui();
      objs.forEach((o) => o.destroy());
      this.startTurn('player');
    });
  }

  roundWin() {
    this.turn = 'over';
    sfx.win();
    const last = this.round + 1 >= MATCHUPS.length;
    const best = Number(localStorage.getItem(BEST_KEY) || 0);
    if (this.round + 1 > best) localStorage.setItem(BEST_KEY, String(this.round + 1));

    if (last) {
      this.overlay('🏆 전 부서 평정!', '핸드폰중독관리팀, 두뇌공화국 부서대전 우승!\n오늘 밤 주인님의 취침 시간은 완벽하게 사수되었다.', [
        ['처음부터 다시', () => this.scene.restart({ round: 0 })]
      ]);
      this.time.delayedCall(400, () => sfx.fanfare());
    } else {
      this.overlay(`ROUND ${this.round + 1} 승리!`, `${this.matchup.name}이(가) 결재 서류에 깔렸다!\n다음 상대가 기다린다…`, [
        ['다음 라운드', () => this.scene.restart({ round: this.round + 1 })]
      ]);
    }
  }

  roundLose() {
    this.turn = 'over';
    sfx.lose();
    this.overlay('패배…', `${this.matchup.name}: "${this.matchup.taunt}"\n…분하다. 설욕전이다!`, [
      ['재도전', () => this.scene.restart({ round: this.round })],
      ['처음부터', () => this.scene.restart({ round: 0 })]
    ]);
  }

  overlay(title, body, buttons) {
    const dim = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.62).setDepth(90).setInteractive();
    const panel = this.add.graphics().setDepth(91);
    panel.fillStyle(0x1a0f2e, 0.97);
    panel.fillRoundedRect(60, 440, GAME_W - 120, 420, 26);
    panel.lineStyle(3, 0x8a6fc0, 0.9);
    panel.strokeRoundedRect(60, 440, GAME_W - 120, 420, 26);
    this.add
      .text(GAME_W / 2, 520, title, { fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color: '#ffd9a0' })
      .setOrigin(0.5)
      .setDepth(92);
    this.add
      .text(GAME_W / 2, 620, body, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#e8dff5',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 540 }
      })
      .setOrigin(0.5)
      .setDepth(92);
    buttons.forEach(([label, fn], i) => {
      const y = 740 + i * 96;
      const btn = this.add
        .image(GAME_W / 2, y, i === 0 ? 'button' : 'button-dark')
        .setScale(0.78, 0.68)
        .setDepth(92)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(GAME_W / 2, y - 3, label, {
          fontFamily: FONT,
          fontSize: '28px',
          fontStyle: 'bold',
          color: i === 0 ? '#3a1c05' : '#d8cfec'
        })
        .setOrigin(0.5)
        .setDepth(93);
      btn.on('pointerdown', () => {
        sfx.ui();
        fn();
      });
    });
  }

  // ---------- 연출 ----------

  speech(unit, text) {
    const t = this.add
      .text(unit.x, unit.y - 96, text, {
        fontFamily: FONT,
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#3a2a18',
        backgroundColor: '#fff6e3',
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5)
      .setDepth(45);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 26, delay: 1200, duration: 400, onComplete: () => t.destroy() });
  }

  floatText(x, y, str, color) {
    const t = this.add
      .text(x, y, str, { fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color, stroke: '#12081f', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(46);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'sine.out', onComplete: () => t.destroy() });
  }
}
