import Phaser from 'phaser';
import { GAME_W, GAME_H } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { HomeScene } from './scenes/HomeScene.js';
import { RushScene } from './scenes/RushScene.js';
import { NewsScene } from './scenes/NewsScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#12081f',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H
  },
  input: { activePointers: 3 },
  scene: [BootScene, TitleScene, HomeScene, RushScene, NewsScene]
});

// 테스트/디버그 훅
window.__BR = game;
