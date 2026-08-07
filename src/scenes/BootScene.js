import Phaser from 'phaser';
import { generateTextures } from '../systems/art.js';
import { generateKingdomTextures } from '../systems/art2.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create() {
    generateTextures(this);        // 공용: 카드/버튼/파티클 등
    generateKingdomTextures(this); // v2: 지형/건물/크리처/문장/아이콘
    this.scene.start('Title');
  }
}
