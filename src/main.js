import Phaser from 'phaser';
import { GAME_W, GAME_H } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ResultScene } from './scenes/ResultScene.js';

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
  input: {
    activePointers: 3 // 멀티터치 (동시 카드 대응)
  },
  scene: [BootScene, TitleScene, GameScene, ResultScene]
});

// 테스트/디버그 훅 (스모크 테스트에서 씬 제어에 사용)
window.__BR = game;
