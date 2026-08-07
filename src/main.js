import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#12081f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280
  },
  scene: [
    new Phaser.Class({
      Extends: Phaser.Scene,
      initialize: function BootScene() {
        Phaser.Scene.call(this, { key: 'Boot' });
      },
      create: function () {
        this.add
          .text(360, 640, '두뇌공화국\n면접 대작전\n\n(scaffold)', {
            fontFamily: 'sans-serif',
            fontSize: '48px',
            color: '#ffd9a0',
            align: 'center'
          })
          .setOrigin(0.5);
      }
    })
  ]
};

new Phaser.Game(config);
