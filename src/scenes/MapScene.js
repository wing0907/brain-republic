import Phaser from 'phaser';
import {
  GAME_W,
  GAME_H,
  MAX_LEVEL,
  DEPTS_PER_BUREAU,
  TOTAL_DEPTS,
  HUNGER_DECAY,
  ENERGY_DECAY,
  FAME_RISE,
  FAME_FALL,
  EVENT_MIN_MS,
  EVENT_MAX_MS,
  EVENT_EXPIRE_MS,
  EVENT_IGNORE_FAME_LOSS,
  DIAMOND_BOOST_COST
} from '../config.js';
import { BUREAUS, BUREAU_BY_ID } from '../data/bureaus.js';
import { loadState, saveState, incomePerSec, tickRealtime } from '../systems/save.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

// 아이소 대륙 위 건물 배치
const SPOTS = {
  memory: { x: 250, y: 430 },
  body: { x: 490, y: 470 },
  emotion: { x: 180, y: 630 },
  impulse: { x: 430, y: 660 },
  speech: { x: 275, y: 850 },
  dream: { x: 510, y: 845 }
};

export class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Map' });
  }

  init(data) {
    this.eventResult = data?.eventResult || null;
  }

  create() {
    // 상태 로드 (최초 1회만 localStorage에서)
    if (!this.registry.get('state')) {
      const { state, offline } = loadState();
      this.registry.set('state', state);
      this.offlineReport = offline;
    }
    this.state = this.registry.get('state');

    this.add.image(GAME_W / 2, GAME_H / 2, 'kingdom-ground');

    this.buildBuildings();
    this.buildHud();
    this.buildBottomBar();

    this.tickAcc = 0;
    this.saveAcc = 0;
    this.activeEvent = null;
    this.scheduleEvent();

    // 백그라운드 전환 시 저장
    this.visHandler = () => {
      if (document.visibilityState === 'hidden') saveState(this.state);
    };
    document.addEventListener('visibilitychange', this.visHandler);
    this.events.on('shutdown', () => {
      document.removeEventListener('visibilitychange', this.visHandler);
      saveState(this.state);
    });

    // 방치 정산 안내
    if (this.offlineReport) {
      this.showOfflineModal(this.offlineReport);
      this.offlineReport = null;
    } else if (!this.state.tutorialSeen) {
      this.showTutorial();
    }

    // 돌발상황 미니게임 결과 처리
    if (this.eventResult) {
      const b = BUREAU_BY_ID[this.eventResult.bureauId];
      if (this.eventResult.success) {
        this.toast(`${b.name} 돌발상황 해결! 보상이 지급되었습니다.`);
      } else {
        this.toast(`${b.name} 돌발상황 대응 실패…`);
      }
      this.eventResult = null;
    }

    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  // ---------- 건물 ----------

  buildBuildings() {
    this.buildings = {};
    for (const b of BUREAUS) {
      const s = this.state.bureaus[b.id];
      const spot = SPOTS[b.id];
      const img = this.add
        .image(spot.x, spot.y, `bld-${b.id}-${s.level}`)
        .setOrigin(0.5, 1)
        .setDepth(spot.y)
        .setInteractive({ useHandCursor: true });
      img.on('pointerdown', () => {
        sfx.pop();
        saveState(this.state);
        this.scene.start('Bureau', { bureauId: b.id });
      });
      // 둥실 애니메이션
      this.tweens.add({
        targets: img,
        y: spot.y - 4,
        duration: 1600 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inout'
      });

      const label = this.add
        .text(spot.x, spot.y + 6, '', {
          fontFamily: FONT,
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#e8dff5',
          backgroundColor: '#12081fcc',
          padding: { x: 8, y: 3 }
        })
        .setOrigin(0.5, 0)
        .setDepth(spot.y + 1);

      const status = this.add
        .image(spot.x + 46, spot.y - img.height - 8, 'ic-alert')
        .setScale(0.7)
        .setDepth(2000)
        .setVisible(false);
      this.tweens.add({
        targets: status,
        y: status.y - 8,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inout'
      });

      this.buildings[b.id] = { img, label, status, spot, bureau: b };
    }
    this.refreshBuildings();
  }

  refreshBuildings() {
    for (const b of BUREAUS) {
      const s = this.state.bureaus[b.id];
      const v = this.buildings[b.id];
      const key = `bld-${b.id}-${s.level}`;
      if (v.img.texture.key !== key) v.img.setTexture(key);
      const critical = s.fame <= 0;
      v.img.setTint(critical ? 0x666677 : 0xffffff);
      v.label.setText(
        `${b.short} Lv.${s.level}${s.complete ? ' ★' : ''}${critical ? ' 위독!' : ''}`
      );
      v.label.setColor(critical ? '#ff8a8a' : '#e8dff5');
      const hungry = s.hunger <= 25 || s.energy <= 25;
      v.status.setVisible(critical || hungry);
    }
  }

  // ---------- HUD ----------

  buildHud() {
    const g = this.add.graphics().setDepth(3000);
    g.fillStyle(0x0c0616, 0.9);
    g.fillRoundedRect(14, 12, GAME_W - 28, 132, 18);
    g.lineStyle(2, 0x5a4a80, 0.6);
    g.strokeRoundedRect(14, 12, GAME_W - 28, 132, 18);

    this.add.image(52, 48, 'ic-coin').setScale(0.8).setDepth(3001);
    this.coinText = this.add
      .text(80, 48, '0', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffe9a0' })
      .setOrigin(0, 0.5)
      .setDepth(3001);
    this.add.image(290, 48, 'ic-diamond').setScale(0.8).setDepth(3001);
    this.diamondText = this.add
      .text(318, 48, '0', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#a8f0f8' })
      .setOrigin(0, 0.5)
      .setDepth(3001);
    this.incomeText = this.add
      .text(GAME_W - 40, 48, '', { fontFamily: FONT, fontSize: '24px', color: '#8a7fa8' })
      .setOrigin(1, 0.5)
      .setDepth(3001);

    this.deptText = this.add
      .text(40, 96, '', { fontFamily: FONT, fontSize: '24px', color: '#d8cfec' })
      .setOrigin(0, 0.5)
      .setDepth(3001);
    this.healthText = this.add
      .text(GAME_W - 40, 96, '', { fontFamily: FONT, fontSize: '24px', color: '#d8cfec' })
      .setOrigin(1, 0.5)
      .setDepth(3001);

    this.refreshHud();
  }

  refreshHud() {
    const st = this.state;
    this.coinText.setText(Math.floor(st.coins).toLocaleString());
    this.diamondText.setText(String(st.diamonds));
    this.incomeText.setText(`+${incomePerSec(st).toFixed(1)}/초`);

    let depts = 0;
    let fameSum = 0;
    for (const b of BUREAUS) {
      const s = st.bureaus[b.id];
      depts += Math.round((s.level / MAX_LEVEL) * DEPTS_PER_BUREAU);
      fameSum += s.fame;
    }
    this.deptText.setText(`활성 부서 ${depts.toLocaleString()} / ${TOTAL_DEPTS.toLocaleString()}`);
    this.healthText.setText(`뇌 건강 ${Math.round(fameSum / BUREAUS.length)}%`);
  }

  // ---------- 하단 바 ----------

  buildBottomBar() {
    const y = GAME_H - 96;
    const g = this.add.graphics().setDepth(3000);
    g.fillStyle(0x0c0616, 0.9);
    g.fillRoundedRect(14, y - 44, GAME_W - 28, 122, 18);

    const boost = this.add
      .image(190, y + 16, 'button')
      .setScale(0.72, 0.68)
      .setDepth(3001)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(190, y + 16, `💎${DIAMOND_BOOST_COST} 전국 특식 배급`, {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#3a1c05'
      })
      .setOrigin(0.5)
      .setDepth(3002);
    boost.on('pointerdown', () => this.diamondBoost());

    const help = this.add
      .image(530, y + 16, 'button-dark')
      .setScale(0.72, 0.68)
      .setDepth(3001)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(530, y + 16, '도움말', {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#d8cfec'
      })
      .setOrigin(0.5)
      .setDepth(3002);
    help.on('pointerdown', () => this.showTutorial());
  }

  diamondBoost() {
    const st = this.state;
    if (st.diamonds < DIAMOND_BOOST_COST) {
      sfx.wrong();
      this.toast('다이아가 부족합니다. 에피소드·돌발상황에서 획득할 수 있어요!');
      return;
    }
    st.diamonds -= DIAMOND_BOOST_COST;
    for (const b of BUREAUS) {
      const s = st.bureaus[b.id];
      s.hunger = Math.min(100, s.hunger + 30);
      s.energy = Math.min(100, s.energy + 30);
      if (s.fame <= 0) s.fame = 5; // 위독 회생의 불씨
    }
    sfx.fanfare();
    this.toast('전국에 특식이 배급되었습니다! 시민들이 환호합니다 🎉');
    saveState(st);
    this.refreshBuildings();
    this.refreshHud();
  }

  // ---------- 돌발상황 ----------

  scheduleEvent() {
    const delay = Phaser.Math.Between(EVENT_MIN_MS, EVENT_MAX_MS);
    this.eventTimer = this.time.delayedCall(delay, () => this.spawnEvent());
  }

  spawnEvent() {
    const alive = BUREAUS.filter((b) => this.state.bureaus[b.id].fame > 0);
    if (alive.length === 0 || this.activeEvent) {
      this.scheduleEvent();
      return;
    }
    const b = Phaser.Utils.Array.GetRandom(alive);
    const v = this.buildings[b.id];
    const crisis = Phaser.Utils.Array.GetRandom(b.crisis);
    sfx.alert();

    const icon = this.add
      .image(v.spot.x, v.spot.y - v.img.height - 46, 'ic-alert')
      .setDepth(2500)
      .setScale(0)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: icon, scale: 1.1, duration: 250, ease: 'back.out' });
    this.tweens.add({
      targets: icon,
      angle: { from: -8, to: 8 },
      duration: 200,
      yoyo: true,
      repeat: -1
    });
    const bubble = this.add
      .text(v.spot.x, v.spot.y - v.img.height - 86, `[${crisis.dept}] ${crisis.line}`, {
        fontFamily: FONT,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffd9a0',
        backgroundColor: '#3a1020ee',
        padding: { x: 10, y: 6 },
        wordWrap: { width: 320 }
      })
      .setOrigin(0.5, 1)
      .setDepth(2500);

    this.activeEvent = { bureauId: b.id, icon, bubble };
    icon.on('pointerdown', () => {
      const minigame = Math.random() < 0.5 ? 'Puzzle' : 'CrisisMini';
      this.clearEvent();
      saveState(this.state);
      this.scene.start(minigame, { bureauId: b.id, from: 'event' });
    });

    this.eventExpire = this.time.delayedCall(EVENT_EXPIRE_MS, () => {
      const s = this.state.bureaus[b.id];
      s.fame = Math.max(0, s.fame - EVENT_IGNORE_FAME_LOSS);
      sfx.danger();
      this.toast(`${b.name} 돌발상황을 놓쳤습니다… 인지도 -${EVENT_IGNORE_FAME_LOSS}`);
      this.clearEvent();
      this.scheduleEvent();
    });
  }

  clearEvent() {
    if (!this.activeEvent) return;
    this.activeEvent.icon.destroy();
    this.activeEvent.bubble.destroy();
    this.activeEvent = null;
    if (this.eventExpire) this.eventExpire.remove(false);
  }

  // ---------- 공통 ----------

  update(_, deltaMs) {
    this.tickAcc += deltaMs;
    if (this.tickAcc >= 1000) {
      const dt = this.tickAcc / 1000;
      this.tickAcc = 0;
      tickRealtime(this.state, dt, { HUNGER_DECAY, ENERGY_DECAY, FAME_RISE, FAME_FALL });
      this.refreshHud();
      this.refreshBuildings();
      this.checkKingdomComplete();
    }
    this.saveAcc += deltaMs;
    if (this.saveAcc >= 5000) {
      this.saveAcc = 0;
      saveState(this.state);
    }
  }

  checkKingdomComplete() {
    if (this.state.kingdomComplete) return;
    if (BUREAUS.every((b) => this.state.bureaus[b.id].complete)) {
      this.state.kingdomComplete = true;
      saveState(this.state);
      this.scene.start('Ending');
    }
  }

  toast(msg) {
    if (this.toastText) this.toastText.destroy();
    this.toastText = this.add
      .text(GAME_W / 2, 200, msg, {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#fff6e3',
        backgroundColor: '#241638ee',
        padding: { x: 16, y: 10 },
        align: 'center',
        wordWrap: { width: 560 }
      })
      .setOrigin(0.5)
      .setDepth(5000);
    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 2200,
      duration: 400,
      onComplete: () => this.toastText && this.toastText.destroy()
    });
  }

  showOfflineModal(report) {
    const lines = [
      `자리를 비운 ${formatDuration(report.seconds)} 동안`,
      `공화국이 🪙 ${report.earned.toLocaleString()} 코인을 벌었습니다.`
    ];
    const deaths = report.deaths || [];
    if (deaths.length > 0) {
      lines.push('');
      if (deaths.length <= 2) {
        for (const id of deaths) {
          const b = BUREAU_BY_ID[id];
          lines.push(`⚠ ${b.keeper.name}(${b.name})이 잊혀져 소멸했습니다.`);
        }
      } else {
        const first = BUREAU_BY_ID[deaths[0]];
        lines.push(`⚠ ${first.keeper.name} 외 ${deaths.length - 1}명의 국장이`);
        lines.push('주인의 뇌에서 잊혀져 소멸했습니다.');
      }
      lines.push('');
      lines.push('새 국장이 부임하며 해당 국은 Lv.1부터 다시 시작합니다.');
      lines.push('시민들은 주인의 의식에 자주 등장해야만 살 수 있습니다…');
    }
    this.modal('공화국 소식', lines.join('\n'));
    if (deaths.length > 0) sfx.gameover();
    else sfx.coin();
  }

  showTutorial() {
    this.modal(
      '뇌정부청사 인수인계서',
      [
        '당신은 두뇌공화국의 새 관리자입니다.',
        '',
        '1. 건물을 탭해 각 국(局)으로 들어가세요.',
        '2. 국장을 먹이고 재우면 「인지도」가 오릅니다.',
        '   인지도 = 주인의 의식에 등장하는 빈도 = 시민의 수명!',
        '3. 인지도가 0이 되면 국장은 위독해지고,',
        '   오래 방치하면 잊혀져 소멸합니다.',
        '4. 에피소드와 돌발상황(⚠)을 해결해 코인·다이아를 모으고',
        '   6개 국을 모두 완성해 1,428개 부서를 되살리세요!'
      ].join('\n')
    );
    this.state.tutorialSeen = true;
    saveState(this.state);
  }

  modal(title, body) {
    const dim = this.add
      .rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.6)
      .setDepth(6000)
      .setInteractive();

    // 본문 크기를 먼저 측정해 패널 높이를 맞춘다
    const t2 = this.add
      .text(GAME_W / 2, 0, body, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#e8dff5',
        align: 'left',
        lineSpacing: 8,
        wordWrap: { width: GAME_W - 220 }
      })
      .setOrigin(0.5, 0)
      .setDepth(6002);
    const bodyH = t2.height;
    const panelH = Math.min(1040, bodyH + 240);
    const panelY = (GAME_H - panelH) / 2;

    const panel = this.add.graphics().setDepth(6001);
    panel.fillStyle(0x1a0f2e, 0.98);
    panel.fillRoundedRect(60, panelY, GAME_W - 120, panelH, 24);
    panel.lineStyle(3, 0x8a6fc0, 0.9);
    panel.strokeRoundedRect(60, panelY, GAME_W - 120, panelH, 24);

    const t1 = this.add
      .text(GAME_W / 2, panelY + 56, title, {
        fontFamily: FONT,
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffd9a0'
      })
      .setOrigin(0.5)
      .setDepth(6002);
    t2.setY(panelY + 104);

    const btnY = panelY + panelH - 66;
    const btn = this.add
      .image(GAME_W / 2, btnY, 'button')
      .setScale(0.72, 0.62)
      .setDepth(6002)
      .setInteractive({ useHandCursor: true });
    const bt = this.add
      .text(GAME_W / 2, btnY, '확인', {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#3a1c05'
      })
      .setOrigin(0.5)
      .setDepth(6003);
    btn.on('pointerdown', () => {
      [dim, panel, t1, t2, btn, bt].forEach((o) => o.destroy());
    });
  }
}

function formatDuration(sec) {
  if (sec >= 3600) return `${Math.floor(sec / 3600)}시간 ${Math.floor((sec % 3600) / 60)}분`;
  if (sec >= 60) return `${Math.floor(sec / 60)}분`;
  return `${sec}초`;
}
