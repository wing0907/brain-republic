import Phaser from 'phaser';
import {
  GAME_W,
  GAME_H,
  MAX_LEVEL,
  DEPTS_PER_BUREAU,
  FEED_COST,
  SLEEP_COST,
  FEED_GAIN,
  SLEEP_GAIN,
  upgradeCost,
  HUNGER_DECAY,
  ENERGY_DECAY,
  FAME_RISE,
  FAME_FALL,
  BUREAU_COMPLETE_DIAMONDS
} from '../config.js';
import { BUREAU_BY_ID } from '../data/bureaus.js';
import { EPISODES } from '../data/episodes.js';
import { saveState, tickRealtime } from '../systems/save.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Galmuri11, Pretendard, "Apple SD Gothic Neo", sans-serif';

export class BureauScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Bureau' });
  }

  init(data) {
    this.bureauId = data.bureauId;
  }

  create() {
    this.state = this.registry.get('state');
    this.bureau = BUREAU_BY_ID[this.bureauId];
    this.bs = this.state.bureaus[this.bureauId];

    this.add.image(GAME_W / 2, GAME_H / 2, 'kingdom-ground').setAlpha(0.55);

    // 뒤로가기
    const back = this.add
      .text(40, 46, '◀ 지도', {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#d8cfec',
        backgroundColor: '#12081fcc',
        padding: { x: 12, y: 8 }
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      sfx.ui();
      saveState(this.state);
      this.scene.start('Map');
    });

    // 헤더
    this.add
      .text(GAME_W / 2, 120, this.bureau.name, {
        fontFamily: FONT,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#' + this.bureau.color.toString(16).padStart(6, '0'),
        stroke: '#12081f',
        strokeThickness: 8
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 172, this.bureau.keeper.trait, {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#a99cc7',
        align: 'center',
        wordWrap: { width: 620 }
      })
      .setOrigin(0.5);

    // 건물 + 크리처
    this.buildingImg = this.add.image(510, 470, `bld-${this.bureauId}-${this.bs.level}`).setOrigin(0.5, 1);
    this.petImg = this.add.image(220, 440, this.petTexture()).setScale(1.6);
    this.tweens.add({
      targets: this.petImg,
      y: 432,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inout'
    });
    this.petName = this.add
      .text(220, 540, this.bureau.keeper.name, {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffe9c9',
        backgroundColor: '#12081fcc',
        padding: { x: 12, y: 5 }
      })
      .setOrigin(0.5);

    // 말풍선
    this.bubble = this.add
      .text(220, 320, '', {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#3a2a18',
        backgroundColor: '#fff6e3',
        padding: { x: 14, y: 8 }
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // 정보줄
    this.infoText = this.add
      .text(GAME_W / 2, 610, '', {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#d8cfec'
      })
      .setOrigin(0.5);
    this.statusText = this.add
      .text(GAME_W / 2, 652, '', {
        fontFamily: FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ff8a8a'
      })
      .setOrigin(0.5);

    // 게이지 3종
    this.bars = {};
    this.makeBar('hunger', 'ic-food', '배부름', 710);
    this.makeBar('energy', 'ic-sleep', '컨디션', 770);
    this.makeBar('fame', 'ic-heart', '인지도', 830);
    this.add
      .text(GAME_W - 52, 830, '=수명', { fontFamily: FONT, fontSize: '20px', color: '#ff8aa0' })
      .setOrigin(0.5);

    // 버튼 4종
    this.buttons = {};
    this.makeButton('feed', 116, 960, `먹이기\n🍚 ${FEED_COST}`, () => this.feed());
    this.makeButton('sleep', 296, 960, `재우기\n💤 ${SLEEP_COST}`, () => this.sleep());
    this.makeButton('upgrade', 476, 960, '', () => this.upgrade());
    this.makeButton('episode', 268, 1105, '', () => this.startEpisode(), 420);
    this.makeButton('minigame', 596, 1105, '긴급 업무\n(인지도 회복)', () => {
      saveState(this.state);
      this.scene.start(Math.random() < 0.5 ? 'Puzzle' : 'CrisisMini', {
        bureauId: this.bureauId,
        from: 'work'
      });
    }, 200);

    this.tickAcc = 0;
    this.wasCritical = this.bs.fame <= 0; // 이미 위독한 채 입장하면 경보 생략
    this.refresh();
    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  petTexture() {
    const stage = this.bs.level >= 5 ? 3 : this.bs.level >= 3 ? 2 : 1;
    return `pet-${this.bureauId}-${stage}`;
  }

  makeBar(key, icon, label, y) {
    this.add.image(64, y, icon).setScale(0.75);
    this.add
      .text(98, y, label, { fontFamily: FONT, fontSize: '24px', color: '#c9b8e8' })
      .setOrigin(0, 0.5);
    const g = this.add.graphics();
    this.bars[key] = { g, y };
  }

  drawBar(key, value, color) {
    const { g, y } = this.bars[key];
    const x = 200;
    const w = 400;
    const h = 22;
    g.clear();
    g.fillStyle(0x241638, 1);
    g.fillRoundedRect(x, y - h / 2, w, h, 11);
    if (value > 0) {
      g.fillStyle(color, 1);
      g.fillRoundedRect(x, y - h / 2, Math.max(h, (w * value) / 100), h, 11);
    }
    g.lineStyle(2, 0x8a6fc0, 0.6);
    g.strokeRoundedRect(x, y - h / 2, w, h, 11);
  }

  makeButton(key, x, y, label, onTap, width = 168) {
    const img = this.add
      .image(x, y, 'button')
      .setDisplaySize(width, 118)
      .setInteractive({ useHandCursor: true });
    // setDisplaySize가 만든 실제 스케일을 기준값으로 보존 — 탭 연출은 반드시 이 값으로 복귀
    const baseX = img.scaleX;
    const baseY = img.scaleY;
    const txt = this.add
      .text(x, y, label, {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#3a1c05',
        align: 'center',
        lineSpacing: 4
      })
      .setOrigin(0.5);
    img.on('pointerdown', () => {
      sfx.ui();
      this.tweens.killTweensOf([img, txt]);
      this.tweens.add({
        targets: img,
        scaleX: { from: baseX * 0.9, to: baseX },
        scaleY: { from: baseY * 0.9, to: baseY },
        duration: 150,
        ease: 'back.out'
      });
      this.tweens.add({
        targets: txt,
        scale: { from: 0.9, to: 1 },
        duration: 150,
        ease: 'back.out'
      });
      onTap();
    });
    this.buttons[key] = { img, txt };
  }

  // ---------- 액션 ----------

  say(text) {
    this.bubble.setText(text);
    this.bubble.setAlpha(1);
    this.tweens.killTweensOf(this.bubble);
    this.tweens.add({ targets: this.bubble, alpha: 0, delay: 1400, duration: 300 });
  }

  feed() {
    if (this.state.coins < FEED_COST) {
      sfx.wrong();
      this.say('금고가 비었어… (코인 부족)');
      return;
    }
    this.state.coins -= FEED_COST;
    this.bs.hunger = Math.min(100, this.bs.hunger + FEED_GAIN);
    if (this.bs.fame <= 0) this.bs.fame = 3; // 돌봄으로 회생의 불씨
    sfx.munch();
    this.say(Phaser.Utils.Array.GetRandom(['냠냠! 힘이 난다!', '이 맛은... 결재 각!', '역시 밥심이야!']));
    this.petJump();
    this.refresh();
    saveState(this.state);
  }

  sleep() {
    if (this.state.coins < SLEEP_COST) {
      sfx.wrong();
      this.say('금고가 비었어… (코인 부족)');
      return;
    }
    this.state.coins -= SLEEP_COST;
    this.bs.energy = Math.min(100, this.bs.energy + SLEEP_GAIN);
    if (this.bs.fame <= 0) this.bs.fame = 3;
    sfx.lull();
    this.say(Phaser.Utils.Array.GetRandom(['쿨쿨… 5분만…', '개운하다! 야근 가능!', 'Zzz… 꿈에서도 근무 중']));
    this.petJump();
    this.refresh();
    saveState(this.state);
  }

  upgrade() {
    if (this.bs.level >= MAX_LEVEL) {
      this.say('청사는 이미 최고층이야!');
      return;
    }
    const cost = upgradeCost(this.bs.level);
    if (this.state.coins < cost) {
      sfx.wrong();
      this.say(`증축 예산 부족! (${cost.toLocaleString()} 코인 필요)`);
      return;
    }
    this.state.coins -= cost;
    this.bs.level += 1;
    sfx.levelup();
    this.buildingImg.setTexture(`bld-${this.bureauId}-${this.bs.level}`);
    this.petImg.setTexture(this.petTexture());
    this.tweens.add({ targets: this.buildingImg, scale: { from: 1.15, to: 1 }, duration: 300, ease: 'back.out' });
    const gained = Math.round(DEPTS_PER_BUREAU / MAX_LEVEL);
    this.say(`청사 증축! 부서 ${gained}개가 새로 문을 열었어!`);
    this.checkComplete();
    this.refresh();
    saveState(this.state);
  }

  startEpisode() {
    const eps = EPISODES[this.bureauId];
    if (this.bs.episode >= eps.length) {
      this.say('모든 에피소드를 완주했어! 고마워!');
      return;
    }
    saveState(this.state);
    this.scene.start('Episode', { bureauId: this.bureauId, ep: this.bs.episode });
  }

  checkComplete() {
    const eps = EPISODES[this.bureauId];
    if (!this.bs.complete && this.bs.level >= MAX_LEVEL && this.bs.episode >= eps.length) {
      this.bs.complete = true;
      this.state.diamonds += BUREAU_COMPLETE_DIAMONDS;
      sfx.fanfare();
      this.time.delayedCall(500, () => sfx.gem());
      this.say(`${this.bureau.name} 완성! 💎${BUREAU_COMPLETE_DIAMONDS} 획득!`);
    }
  }

  petJump() {
    this.tweens.add({
      targets: this.petImg,
      scaleX: { from: 1.75, to: 1.6 },
      scaleY: { from: 1.45, to: 1.6 },
      duration: 260,
      ease: 'back.out'
    });
  }

  // ---------- 갱신 ----------

  refresh() {
    const s = this.bs;
    this.drawBar('hunger', s.hunger, 0xf0c541);
    this.drawBar('energy', s.energy, 0x6f7ce8);
    this.drawBar('fame', s.fame, 0xff8aa0);

    const depts = Math.round((s.level / MAX_LEVEL) * DEPTS_PER_BUREAU);
    this.infoText.setText(
      `Lv.${s.level}/${MAX_LEVEL}  ·  활성 부서 ${depts}/${DEPTS_PER_BUREAU}  ·  보유 ${Math.floor(this.state.coins).toLocaleString()} 코인  💎${this.state.diamonds}`
    );

    const critical = s.fame <= 0;
    if (critical && !this.wasCritical) {
      sfx.danger();
      this.say('의식에서... 잊혀지고 있어...');
    }
    this.wasCritical = critical;
    this.petImg.setTint(critical ? 0x666677 : 0xffffff);
    if (critical) {
      this.statusText.setText('⚠ 위독! 주인의 뇌에서 잊혀지는 중… 돌봐서 인지도를 회복하세요!');
    } else if (s.complete) {
      this.statusText.setText('★ 국 완성 — 시민들이 평화롭게 일하고 있습니다').setColor('#ffd9a0');
    } else {
      this.statusText.setText('');
    }

    // 업그레이드 버튼 라벨
    const up = this.buttons.upgrade.txt;
    up.setText(
      s.level >= MAX_LEVEL ? '증축 완료\n★MAX' : `청사 증축\n🪙 ${upgradeCost(s.level).toLocaleString()}`
    );

    // 에피소드 버튼 라벨
    const eps = EPISODES[this.bureauId];
    const ep = this.buttons.episode.txt;
    ep.setText(
      s.episode >= eps.length
        ? `에피소드 완주 ★ (${eps.length}/${eps.length})`
        : `📖 ${eps[s.episode].title}`
    );
  }

  update(_, deltaMs) {
    this.tickAcc += deltaMs;
    if (this.tickAcc >= 1000) {
      const dt = this.tickAcc / 1000;
      this.tickAcc = 0;
      tickRealtime(this.state, dt, { HUNGER_DECAY, ENERGY_DECAY, FAME_RISE, FAME_FALL });
      this.refresh();
    }
  }
}
