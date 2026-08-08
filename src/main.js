import Phaser from 'phaser';
import { GAME_W, GAME_H, MAX_LEVEL, STORAGE_KEY } from './config.js';
import { freshState } from './systems/save.js';
import { BUREAUS } from './data/bureaus.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { MapScene } from './scenes/MapScene.js';
import { BureauScene } from './scenes/BureauScene.js';
import { EpisodeScene } from './scenes/EpisodeScene.js';
import { PuzzleScene } from './scenes/PuzzleScene.js';
import { CrisisMiniScene } from './scenes/CrisisMiniScene.js';
import { RushScene } from './scenes/RushScene.js';
import { SpyScene } from './scenes/SpyScene.js';
import { EndingScene } from './scenes/EndingScene.js';
import { Ep01IntroScene } from './scenes/Ep01IntroScene.js';
import { Ep01Scene } from './scenes/Ep01Scene.js';
import { Ep01ResultScene } from './scenes/Ep01ResultScene.js';

// 데모/시연용 세이브 주입 — URL 파라미터 ?demo=…
// doom: 20시간 방치 상태(2개 국 소멸 직전) → 입장 시 방치 정산·세대교체 연출
// rich: 후반부 성장 상태(레벨 4, 자원 풍족) / ending: 6국 완성 → 엔딩 직행
// fresh: 세이브 삭제 후 새 게임
function applyDemoParam() {
  const demo = new URLSearchParams(location.search).get('demo');
  if (!demo) return;
  try {
    if (demo === 'fresh') {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const st = freshState();
    st.tutorialSeen = true;
    if (demo === 'doom') {
      st.coins = 800;
      for (const b of BUREAUS) {
        const s = st.bureaus[b.id];
        s.level = 3;
        s.hunger = 90;
        s.energy = 90;
        s.fame = 70;
      }
      // 두 국은 완전히 잊혀진 채 방치 → 소멸(세대교체) 연출
      for (const id of ['memory', 'impulse']) {
        const s = st.bureaus[id];
        s.level = 4;
        s.hunger = 0;
        s.energy = 0;
        s.fame = 2;
      }
      st.lastTick = Date.now() - 20 * 3600 * 1000;
    } else if (demo === 'rich') {
      st.coins = 60000;
      st.diamonds = 40;
      for (const b of BUREAUS) {
        const s = st.bureaus[b.id];
        s.level = 4;
        s.hunger = 80;
        s.energy = 80;
        s.fame = 85;
        s.episode = 2;
      }
    } else if (demo === 'ending') {
      st.coins = 99999;
      st.diamonds = 77;
      for (const b of BUREAUS) {
        const s = st.bureaus[b.id];
        s.level = MAX_LEVEL;
        s.hunger = 100;
        s.energy = 100;
        s.fame = 100;
        s.episode = 3;
        s.complete = true;
      }
    } else {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  } catch {
    /* 시크릿 모드 등 저장 불가 환경은 무시 */
  }
}
applyDemoParam();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#12081f',
  pixelArt: true, // 니어리스트 스케일링 — 도트가 쨍하게
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H
  },
  input: {
    activePointers: 3
  },
  scene: [
    BootScene,
    TitleScene,
    Ep01IntroScene,
    Ep01Scene,
    Ep01ResultScene,
    MapScene,
    BureauScene,
    EpisodeScene,
    PuzzleScene,
    CrisisMiniScene,
    RushScene,
    SpyScene,
    EndingScene
  ]
});

// 테스트/디버그 훅 (스모크 테스트에서 씬 제어에 사용)
window.__BR = game;
