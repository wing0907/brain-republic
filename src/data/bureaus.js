// 6개 국(局) — 세계관 원문 기반 (WORLDBUILDING.md W3·W9·W10)
// species: 종족 외형 특징(도트 캐릭터 생성 파라미터), env: 국별 환경(건물 테마)

export const BUREAUS = [
  {
    id: 'memory',
    name: '기억인지국',
    short: '기억',
    color: 0xc9a35f,
    accent: 0xf3d9a4,
    interaction: 'maze',
    stepHint: '스와이프로 서고 미로를 돌파!',
    env: '오래된 나무뿌리 서고',
    species: 'rings', // 나이테 무늬·큰 귀
    keeper: '나이테 주임'
  },
  {
    id: 'body',
    name: '신체반응국',
    short: '신체',
    color: 0xe86a5e,
    accent: 0xffb3a7,
    interaction: 'hold',
    stepHint: '길게! 심호흡 밸브',
    env: '혈관처럼 얽힌 덩굴관',
    species: 'vines', // 덩굴 힘줄·촉수
    keeper: '덩쿨 주임'
  },
  {
    id: 'emotion',
    name: '감정사회국',
    short: '감정',
    color: 0x53c2b4,
    accent: 0xa8f0e6,
    interaction: 'hold',
    stepHint: '길게! 감정 조율',
    env: '이끼와 잔잔한 웅덩이',
    species: 'trans', // 반투명·색 변화
    keeper: '이슬 주임'
  },
  {
    id: 'impulse',
    name: '충동관리국',
    short: '충동',
    color: 0xb069e8,
    accent: 0xe0b8ff,
    interaction: 'swipe',
    stepHint: '스와이프! 유혹 쳐내기',
    env: '버섯 네온 번화가',
    species: 'glow', // 발광 돌기
    keeper: '반짝 주임'
  },
  {
    id: 'speech',
    name: '언어표현국',
    short: '언어',
    color: 0xf0c541,
    accent: 0xffe9a0,
    interaction: 'choice',
    stepHint: '결재! 올바른 표현',
    env: '속 빈 나무 안테나탑',
    species: 'antenna', // 안테나 귀
    keeper: '안테나 주임'
  },
  {
    id: 'dream',
    name: '수면상상국',
    short: '상상',
    color: 0x6f7ce8,
    accent: 0xb9c2ff,
    interaction: 'swipe',
    stepHint: '스와이프! 잡념 걷기',
    env: '안개와 반딧불이 구름 지대',
    species: 'firefly', // 반딧불 점
    keeper: '몽글 주임'
  }
];

export const BUREAU_BY_ID = Object.fromEntries(BUREAUS.map((b) => [b.id, b]));
export const BUREAU_INDEX = Object.fromEntries(BUREAUS.map((b, i) => [b.id, i]));
