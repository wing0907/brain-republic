import Phaser from 'phaser';
import { GAME_W, GAME_H } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { BattleScene } from './scenes/BattleScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#12081f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H
  },
  input: { activePointers: 2 },
  scene: [BootScene, TitleScene, BattleScene]
});

// 테스트/디버그 훅
window.__BR = game;
