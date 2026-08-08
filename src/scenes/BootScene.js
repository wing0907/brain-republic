import Phaser from 'phaser';
import { generateTextures } from '../systems/art.js';
import { loadState } from '../systems/save.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create() {
    generateTextures(this);
    this.registry.set('state', loadState());

    // 시민 달리기 애니메이션 등록 (국별 + 플레이어)
    const mk = (prefix) => {
      if (this.anims.exists(`${prefix}-run`)) return;
      this.anims.create({
        key: `${prefix}-run`,
        frames: [{ key: `${prefix}-run1` }, { key: `${prefix}-run2` }],
        frameRate: 10,
        repeat: -1
      });
    };
    for (const id of ['memory', 'body', 'emotion', 'impulse', 'speech', 'dream']) mk(`cz-${id}`);
    mk('player');

    this.scene.start('Title');
  }
}
