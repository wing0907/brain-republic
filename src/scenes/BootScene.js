import Phaser from 'phaser';
import { generateTextures } from '../systems/art.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create() {
    generateTextures(this);
    this.scene.start('Title');
  }
}
