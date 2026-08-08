import Phaser from 'phaser';
import { GAME_W, GAME_H, MAX_LEVEL, upgradeCost, TOTAL_DEPTS, FAME_MAX } from '../config.js';
import { BUREAUS } from '../data/bureaus.js';
import { saveState, deptCount } from '../systems/save.js';
import { sfx, setMuted, isMuted } from '../systems/audio.js';

const FONT = 'Galmuri11, Pretendard, sans-serif';

// 공화국 전경 — 나라 키우기 홈 (W4·W5·W6)
// 건물 탭 = 업그레이드, 인지도(명예)가 높은 국은 별이 반짝인다.
export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Home' });
  }

  create() {
    this.st = this.registry.get('state');
    this.add.image(GAME_W / 2, GAME_H / 2, 'sky');
    this.add.image(GAME_W / 2, GAME_H - 180, 'ground');

    this.buildHud();
    this.buildCity();
    this.buildPlayer();
    this.buildButtons();

    if (!this.st.tutorialSeen) {
      this.showTutorial();
      this.st.tutorialSeen = true;
      saveState(this.st);
    }
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  buildHud() {
    const g = this.add.graphics().setDepth(50);
    g.fillStyle(0x0c0616, 0.88);
    g.fillRect(0, 0, GAME_W, 150);
    g.fillStyle(0x5a4a80, 1);
    g.fillRect(0, 150, GAME_W, 3);

    this.add
      .text(36, 44, `${this.st.day}일차`, { fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#ffd9a0' })
      .setOrigin(0, 0.5)
      .setDepth(51);
    this.coinText = this.add
      .text(GAME_W / 2, 44, `🪙 ${Math.floor(this.st.coins).toLocaleString()}`, {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffe9a0'
      })
      .setOrigin(0.5)
      .setDepth(51);
    this.add
      .text(GAME_W - 36, 44, this.st.best > 0 ? `최고 ${this.st.best.toLocaleString()}` : '', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#a99cc7'
      })
      .setOrigin(1, 0.5)
      .setDepth(51);
    this.deptText = this.add
      .text(36, 106, '', { fontFamily: FONT, fontSize: '24px', color: '#d8cfec' })
      .setOrigin(0, 0.5)
      .setDepth(51);

    const snd = this.add
      .text(GAME_W - 36, 106, isMuted() ? '🔇' : '🔊', { fontSize: '30px' })
      .setOrigin(1, 0.5)
      .setDepth(51)
      .setInteractive({ useHandCursor: true });
    snd.on('pointerdown', () => {
      setMuted(!isMuted());
      snd.setText(isMuted() ? '🔇' : '🔊');
    });
    this.refreshHud();
  }

  refreshHud() {
    this.coinText.setText(`🪙 ${Math.floor(this.st.coins).toLocaleString()}`);
    this.deptText.setText(`개설 부서 ${deptCount(this.st).toLocaleString()} / ${TOTAL_DEPTS.toLocaleString()}`);
  }

  buildCity() {
    // 중앙 청사 + 좌우 3국씩
    this.add.image(GAME_W / 2, 1005, 'bld-hall').setOrigin(0.5, 1).setDepth(5);
    this.add
      .text(GAME_W / 2, 1012, '뇌정부청사', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#c9b8e8',
        backgroundColor: '#12081fcc',
        padding: { x: 6, y: 2 }
      })
      .setOrigin(0.5, 0)
      .setDepth(6);

    const xs = [70, 185, 300, 420, 535, 650];
    this.bldViews = {};
    BUREAUS.forEach((b, i) => {
      const x = xs[i];
      const lvl = this.st.levels[b.id];
      const img = this.add
        .image(x, 1000, `bld-${b.id}-${lvl}`)
        .setOrigin(0.5, 1)
        .setDepth(4)
        .setInteractive({ useHandCursor: true });
      img.on('pointerdown', () => this.tryUpgrade(b));

      const label = this.add
        .text(x, 1008, '', {
          fontFamily: FONT,
          fontSize: '17px',
          fontStyle: 'bold',
          color: '#fff6e3',
          backgroundColor: '#12081fcc',
          padding: { x: 5, y: 2 },
          align: 'center'
        })
        .setOrigin(0.5, 0)
        .setDepth(6);

      // 인지도 별 (명예 시스템 W5)
      const star = this.add
        .text(x, 0, '★', { fontSize: '26px', color: '#ffe14a' })
        .setOrigin(0.5)
        .setDepth(6);
      this.tweens.add({
        targets: star,
        alpha: { from: 1, to: 0.35 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        delay: i * 120
      });

      this.bldViews[b.id] = { img, label, star, x, bureau: b };
    });
    this.refreshCity();
  }

  refreshCity() {
    for (const b of BUREAUS) {
      const v = this.bldViews[b.id];
      const lvl = this.st.levels[b.id];
      v.img.setTexture(`bld-${b.id}-${lvl}`);
      const fame = Math.round(this.st.fame[b.id]);
      const cost = lvl < MAX_LEVEL ? `🪙${upgradeCost(lvl)}` : 'MAX';
      v.label.setText(`${b.short} Lv.${lvl}\n${cost}`);
      // 인지도 별: fame 비례로 크기/표시
      v.star.setVisible(fame >= 30);
      v.star.setY(1000 - v.img.height - 16);
      v.star.setScale(0.7 + (fame / FAME_MAX) * 0.7);
    }
  }

  tryUpgrade(b) {
    const lvl = this.st.levels[b.id];
    if (lvl >= MAX_LEVEL) {
      sfx.ui();
      this.toast(`${b.name}은 이미 최대 규모입니다!`);
      return;
    }
    const cost = upgradeCost(lvl);
    if (this.st.coins < cost) {
      sfx.wrong();
      this.toast(`예산 부족! (${cost.toLocaleString()} 뇌화 필요) — 출근해서 벌어옵시다`);
      return;
    }
    this.st.coins -= cost;
    this.st.levels[b.id] += 1;
    saveState(this.st);
    sfx.levelup();
    const v = this.bldViews[b.id];
    this.tweens.add({ targets: v.img, scaleX: { from: 1.15, to: 1 }, scaleY: { from: 1.15, to: 1 }, duration: 300, ease: 'back.out' });
    const p = this.add.particles(v.x, 1000 - v.img.height / 2, 'dot', {
      speed: { min: 100, max: 240 },
      lifespan: 500,
      quantity: 16,
      scale: { start: 0.7, end: 0 },
      tint: b.accent,
      emitting: false
    });
    p.explode(16);
    this.time.delayedCall(600, () => p.destroy());
    this.toast(`${b.name} 확장! 신규 부서가 문을 열었습니다`);
    this.refreshCity();
    this.refreshHud();
  }

  buildPlayer() {
    // 내 캐릭터 (신입) — 거리에서 대기
    this.player = this.add.sprite(GAME_W / 2 - 90, 1085, 'player-idle').setDepth(10).setScale(1.3);
    this.tweens.add({
      targets: this.player,
      y: 1081,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inout'
    });
    this.add
      .text(GAME_W / 2 - 90, 1140, '나 (신입)', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffe9c9',
        backgroundColor: '#12081fcc',
        padding: { x: 6, y: 2 }
      })
      .setOrigin(0.5)
      .setDepth(10);

    // 지나다니는 동료 시민
    for (let i = 0; i < 3; i++) {
      const b = Phaser.Utils.Array.GetRandom(BUREAUS);
      const spr = this.add.sprite(Phaser.Math.Between(60, 660), 1105 + i * 22, `cz-${b.id}-idle`).setDepth(9);
      spr.play(`cz-${b.id}-run`);
      const dir = i % 2 === 0 ? 1 : -1;
      spr.setFlipX(dir < 0);
      this.tweens.add({
        targets: spr,
        x: dir > 0 ? 780 : -60,
        duration: Phaser.Math.Between(10000, 15000),
        repeat: -1,
        onRepeat: () => (spr.x = dir > 0 ? -60 : 780)
      });
    }
  }

  buildButtons() {
    const go = this.add.image(GAME_W / 2, 1225, 'button').setInteractive({ useHandCursor: true });
    const goLabel = this.add
      .text(GAME_W / 2, 1225, `🏢 ${this.st.day}일차 출근하기`, {
        fontFamily: FONT,
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#3a1c05'
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: [go, goLabel],
      scale: { from: 1, to: 1.04 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inout'
    });
    go.on('pointerdown', () => {
      sfx.fanfare();
      saveState(this.st);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start('Rush'));
    });

    this.add
      .text(GAME_W / 2, 1168, '건물을 탭하면 뇌화로 확장할 수 있습니다', {
        fontFamily: FONT,
        fontSize: '19px',
        color: '#a99cc7'
      })
      .setOrigin(0.5);
  }

  showTutorial() {
    const dim = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.65).setDepth(90).setInteractive();
    const panel = this.add.graphics().setDepth(91);
    panel.fillStyle(0x1a0f2e, 0.98);
    panel.fillRoundedRect(50, 300, GAME_W - 100, 640, 8);
    panel.lineStyle(3, 0x8a6fc0, 1);
    panel.strokeRoundedRect(50, 300, GAME_W - 100, 640, 8);
    const t1 = this.add
      .text(GAME_W / 2, 360, '두뇌공화국 인사발령서', {
        fontFamily: FONT,
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffd9a0'
      })
      .setOrigin(0.5)
      .setDepth(92);
    const t2 = this.add
      .text(
        GAME_W / 2,
        620,
        [
          '발령: 기억인지국 신입 공무원',
          '',
          '1. 주인님의 무의식 하나하나가 우리의 업무(민원)입니다.',
          '2. 민원은 혼자 못 풉니다 — 필요한 부서를 순서대로',
          '   호출해 「협력 콤보」로 해결하세요.',
          '3. 실적을 올리면 방송에 출연하고(명예 시스템),',
          '   인지도가 오른 국은 건물이 성장합니다.',
          '4. 급여(뇌화)로 공화국을 확장하세요 — 목표 1,428개 부서!'
        ].join('\n'),
        {
          fontFamily: FONT,
          fontSize: '23px',
          color: '#e8dff5',
          lineSpacing: 10,
          wordWrap: { width: GAME_W - 160 }
        }
      )
      .setOrigin(0.5)
      .setDepth(92);
    const ok = this.add.image(GAME_W / 2, 880, 'button').setScale(0.7, 0.6).setDepth(92).setInteractive({ useHandCursor: true });
    const okT = this.add
      .text(GAME_W / 2, 880, '입사 서약!', { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#3a1c05' })
      .setOrigin(0.5)
      .setDepth(93);
    const close = () => [dim, panel, t1, t2, ok, okT].forEach((o) => o.destroy());
    ok.on('pointerdown', () => {
      sfx.stamp();
      close();
    });
    dim.on('pointerdown', close);
  }

  toast(msg) {
    if (this.toastText) this.toastText.destroy();
    this.toastText = this.add
      .text(GAME_W / 2, 220, msg, {
        fontFamily: FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#fff6e3',
        backgroundColor: '#241638ee',
        padding: { x: 14, y: 8 },
        align: 'center',
        wordWrap: { width: 560 }
      })
      .setOrigin(0.5)
      .setDepth(95);
    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 1800,
      duration: 400,
      onComplete: () => this.toastText && this.toastText.destroy()
    });
  }
}
