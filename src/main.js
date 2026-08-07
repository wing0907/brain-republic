import Phaser from 'phaser';
import { GAME_W, GAME_H } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { MapScene } from './scenes/MapScene.js';
import { BureauScene } from './scenes/BureauScene.js';
import { EpisodeScene } from './scenes/EpisodeScene.js';
import { PuzzleScene } from './scenes/PuzzleScene.js';
import { CrisisMiniScene } from './scenes/CrisisMiniScene.js';
import { EndingScene } from './scenes/EndingScene.js';

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
    activePointers: 3
  },
  scene: [BootScene, TitleScene, MapScene, BureauScene, EpisodeScene, PuzzleScene, CrisisMiniScene, EndingScene]
});

// 테스트/디버그 훅 (스모크 테스트에서 씬 제어에 사용)
window.__BR = game;
