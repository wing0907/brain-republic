// 미니게임 보상 정산 — 출처(from)별 보상 규칙
import {
  EPISODE_REWARD_COINS,
  EPISODE_REWARD_DIAMONDS,
  EVENT_REWARD_COINS,
  EVENT_REWARD_MULT,
  FAME_MINIGAME_BONUS
} from '../config.js';
import { EPISODES } from '../data/episodes.js';

// 성공 시 상태를 갱신하고 보상 요약 문자열을 반환. 실패 시 null.
export function applyReward(state, bureauId, from, success, ep) {
  if (!success) return null;
  const s = state.bureaus[bureauId];
  const parts = [];

  if (from === 'episode') {
    state.coins += EPISODE_REWARD_COINS;
    state.diamonds += EPISODE_REWARD_DIAMONDS;
    s.fame = Math.min(100, Math.max(s.fame, 0) + FAME_MINIGAME_BONUS);
    if (typeof ep === 'number') s.episode = Math.max(s.episode, ep + 1);
    parts.push(`🪙 ${EPISODE_REWARD_COINS}`, `💎 ${EPISODE_REWARD_DIAMONDS}`, `인지도 +${FAME_MINIGAME_BONUS}`);
  } else if (from === 'event') {
    const coins = EVENT_REWARD_COINS * EVENT_REWARD_MULT;
    state.coins += coins;
    s.fame = Math.min(100, Math.max(s.fame, 0) + FAME_MINIGAME_BONUS);
    parts.push(`🪙 ${coins} (돌발 보너스 ×${EVENT_REWARD_MULT})`, `인지도 +${FAME_MINIGAME_BONUS}`);
  } else {
    // 'work' — 긴급 업무: 일해서 존재감을 증명한다
    state.coins += EVENT_REWARD_COINS;
    s.fame = Math.min(100, Math.max(s.fame, 0) + FAME_MINIGAME_BONUS);
    parts.push(`🪙 ${EVENT_REWARD_COINS}`, `인지도 +${FAME_MINIGAME_BONUS}`);
  }
  return parts.join('  ');
}

// 국 완성 조건 판정 (레벨 MAX + 에피소드 완주)
export function isBureauComplete(state, bureauId, maxLevel) {
  const s = state.bureaus[bureauId];
  return s.level >= maxLevel && s.episode >= EPISODES[bureauId].length;
}
