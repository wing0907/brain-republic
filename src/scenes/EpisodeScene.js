import Phaser from 'phaser';
import { GAME_W, GAME_H, MAX_LEVEL, BUREAU_COMPLETE_DIAMONDS } from '../config.js';
import { BUREAU_BY_ID } from '../data/bureaus.js';
import { EPISODES, SPEAKER_NAMES } from '../data/episodes.js';
import { saveState } from '../systems/save.js';
import { applyReward, isBureauComplete } from '../systems/rewards.js';
import { sfx } from '../systems/audio.js';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

export class EpisodeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Episode' });
  }

  init(data) {
    this.bureauId = data.bureauId;
    this.ep = data.ep;
    this.phase = data.phase || 'intro';
    this.success = data.success ?? false;
  }

  create() {
    this.state = this.registry.get('state');
    this.bureau = BUREAU_BY_ID[this.bureauId];
    this.episode = EPISODES[this.bureauId][this.ep];

    this.add.image(GAME_W / 2, GAME_H / 2, 'kingdom-ground').setAlpha(0.45);

    // 에피소드 타이틀
    this.add
      .text(GAME_W / 2, 150, this.episode.title, {
        fontFamily: FONT,
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffd9a0',
        align: 'center',
        wordWrap: { width: 620 }
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 205, this.bureau.name, {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#' + this.bureau.color.toString(16).padStart(6, '0')
      })
      .setOrigin(0.5);

    // 국장 크리처
    const stage = this.state.bureaus[this.bureauId].level >= 5 ? 3 : this.state.bureaus[this.bureauId].level >= 3 ? 2 : 1;
    this.add.image(GAME_W / 2, 480, `pet-${this.bureauId}-${stage}`).setScale(1.9);

    if (this.phase === 'intro') this.runIntro();
    else this.runResult();
  }

  // 대사를 한 줄씩 탭으로 진행
  runIntro() {
    this.lineIdx = 0;
    this.speakerText = this.add
      .text(90, 730, '', {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffd9a0'
      })
      .setOrigin(0, 0.5);
    const box = this.add.graphics();
    box.fillStyle(0x1a0f2e, 0.95);
    box.fillRoundedRect(50, 760, GAME_W - 100, 260, 20);
    box.lineStyle(3, 0x8a6fc0, 0.8);
    box.strokeRoundedRect(50, 760, GAME_W - 100, 260, 20);
    this.dialogText = this.add
      .text(90, 800, '', {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#e8dff5',
        lineSpacing: 8,
        wordWrap: { width: GAME_W - 180 }
      })
      .setOrigin(0, 0);
    this.tapHint = this.add
      .text(GAME_W / 2, 1060, '▼ 탭하여 계속', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#8a7fa8'
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: this.tapHint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    this.showLine();
    this.input.on('pointerdown', () => this.nextLine());
  }

  speakerName(code) {
    if (code === 'keeper') return this.bureau.keeper.name;
    return SPEAKER_NAMES[code] || code;
  }

  showLine() {
    const [speaker, text] = this.episode.intro[this.lineIdx];
    this.speakerText.setText(`${this.speakerName(speaker)}`);
    this.dialogText.setText(text);
    sfx.tap();
  }

  nextLine() {
    this.lineIdx += 1;
    if (this.lineIdx < this.episode.intro.length) {
      this.showLine();
      return;
    }
    // 대사 끝 → 미니게임 시작
    this.input.removeAllListeners('pointerdown');
    saveState(this.state);
    const scene = this.episode.minigame === 'puzzle' ? 'Puzzle' : 'CrisisMini';
    this.scene.start(scene, { bureauId: this.bureauId, from: 'episode', ep: this.ep });
  }

  runResult() {
    let title;
    let body;
    let rewardLine = null;

    if (this.success) {
      rewardLine = applyReward(this.state, this.bureauId, 'episode', true, this.ep);
      title = '에피소드 완료!';
      body = this.episode.outro;
      sfx.fanfare();
      // 국 완성 판정
      const bs = this.state.bureaus[this.bureauId];
      if (!bs.complete && isBureauComplete(this.state, this.bureauId, MAX_LEVEL)) {
        bs.complete = true;
        this.state.diamonds += BUREAU_COMPLETE_DIAMONDS;
        body += `\n\n★ ${this.bureau.name} 완성! 💎${BUREAU_COMPLETE_DIAMONDS} 추가 획득!`;
      }
      saveState(this.state);
    } else {
      title = '아쉽게 실패…';
      body = `${this.bureau.keeper.name}: "괜찮아, 다시 도전하면 돼! 공화국은 포기를 모른다구!"`;
      sfx.wrong();
    }

    this.add
      .text(GAME_W / 2, 760, title, {
        fontFamily: FONT,
        fontSize: '48px',
        fontStyle: 'bold',
        color: this.success ? '#ffd9a0' : '#ff8a8a'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 880, body, {
        fontFamily: FONT,
        fontSize: '27px',
        color: '#e8dff5',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 580 }
      })
      .setOrigin(0.5);
    if (rewardLine) {
      this.add
        .text(GAME_W / 2, 1010, rewardLine, {
          fontFamily: FONT,
          fontSize: '30px',
          fontStyle: 'bold',
          color: '#ffe9a0'
        })
        .setOrigin(0.5);
    }

    const btn = this.add
      .image(GAME_W / 2, 1120, 'button')
      .setScale(0.85, 0.75)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_W / 2, 1120, '확인', {
        fontFamily: FONT,
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#3a1c05'
      })
      .setOrigin(0.5);
    btn.on('pointerdown', () => this.scene.start('Bureau', { bureauId: this.bureauId }));
  }
}
