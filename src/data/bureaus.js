// 「두뇌공화국」 세계관 데이터 — 6개 국(局)과 위기 이벤트.
// 원작 설정: 뇌를 1,428개 부서를 가진 행정 공화국으로 의인화.
// crisis 배열의 항목이 곧 위기 카드 바리에이션 (부서명 + 민원 문구).

export const BUREAUS = [
  {
    id: 'memory',
    name: '기억인지국',
    short: '기억',
    color: 0xc9a35f, // 세피아 — 오래된 나무뿌리 서고
    accent: 0xf3d9a4,
    interaction: 'mash',
    verb: '연타로 서고 뒤지기!',
    keeper: { name: '나이테 국장', trait: '몸에 나이테 무늬, 귀가 큰 종족 — 오래된 서고의 수호자' },
    crisis: [
      { dept: '기억보관팀', line: '지원동기 서류가 없습니다!' },
      { dept: '단기기억팀', line: '방금 들은 질문을 분실했습니다!' },
      { dept: '이름암기팀', line: '면접관 성함이 증발했습니다!' },
      { dept: '경력정리팀', line: '프로젝트 연도가 뒤섞였습니다!' }
    ]
  },
  {
    id: 'body',
    name: '신체반응국',
    short: '신체',
    color: 0xe86a5e, // 레드코랄 — 혈관·신경 덩굴관
    accent: 0xffb3a7,
    interaction: 'hold',
    verb: '길게 눌러 심호흡!',
    keeper: { name: '덩쿨 국장', trait: '덩굴 힘줄 무늬, 자극에 반응하는 촉수 종족 — 신경망의 관리자' },
    crisis: [
      { dept: '손발저림관리팀', line: '손발 저림 수치 폭주!' },
      { dept: '심박조절팀', line: '심박수 140 돌파!' },
      { dept: '식은땀배출팀', line: '이마 배수로 과부하!' },
      { dept: '다리떨림억제팀', line: '무릎 진동 경보 발령!' }
    ]
  },
  {
    id: 'emotion',
    name: '감정사회국',
    short: '감정',
    color: 0x53c2b4, // 아쿠아 — 물기 있는 이끼, 웅덩이
    accent: 0xa8f0e6,
    interaction: 'hold',
    verb: '길게 눌러 게이트 보강!',
    keeper: { name: '이슬 국장', trait: '반투명한 피부색이 감정 따라 변하는 종족 — 웅덩이의 조율사' },
    crisis: [
      { dept: '눈물참기훈련팀', line: '눈물 게이트 붕괴 직전!' },
      { dept: '표정관리팀', line: '입꼬리 제어 불능!' },
      { dept: '긴장완화팀', line: '불안 수치 임계 초과!' },
      { dept: '자신감충전팀', line: '자존감 배터리 5%!' }
    ]
  },
  {
    id: 'impulse',
    name: '충동관리국',
    short: '충동',
    color: 0xb069e8, // 네온퍼플 — 버섯 불빛 번화가
    accent: 0xe0b8ff,
    interaction: 'swipe',
    verb: '스와이프로 밀어내기!',
    keeper: { name: '반짝 국장', trait: '충동 강도에 따라 몸의 돌기가 깜빡이는 종족 — 네온 번화가의 보안관' },
    crisis: [
      { dept: '핸드폰중독관리팀', line: '진동 확인 충동 유입!' },
      { dept: '도망가고싶음억제팀', line: '퇴장 충동 감지!' },
      { dept: '농담검열팀', line: '위험한 개그 발사 대기!' },
      { dept: '간식욕구관리팀', line: '꼬르륵 경보 발령!' }
    ]
  },
  {
    id: 'speech',
    name: '언어표현국',
    short: '언어',
    color: 0xf0c541, // 옐로 — 속 빈 나무 안테나탑
    accent: 0xffe9a0,
    interaction: 'choice',
    verb: '올바른 단어를 결재!',
    keeper: { name: '안테나 국장', trait: '안테나처럼 솟은 귀를 가진 종족 — 나무 안테나탑의 송출 책임자' },
    crisis: [
      { dept: '말실수팀', line: '발송 직전! 올바른 파일은?', good: '성실한 지원자', bad: '부실한 지원자' },
      { dept: '존댓말검수팀', line: '어미 오류 감지! 올바른 결재는?', good: '하겠습니다', bad: '할게염' },
      { dept: '단어선택팀', line: '표현 승인 요청! 올바른 파일은?', good: '도전적인 과제', bad: '노답인 과제' },
      { dept: '침묵방지팀', line: '3초 공백! 올바른 응답은?', good: '좋은 질문입니다', bad: '어…그게…' }
    ]
  },
  {
    id: 'dream',
    name: '수면상상국',
    short: '상상',
    color: 0x6f7ce8, // 인디고 — 안개와 반딧불이 구름 지대
    accent: 0xb9c2ff,
    interaction: 'swipe',
    verb: '스와이프로 구름 걷어내기!',
    keeper: { name: '몽글 국장', trait: '반딧불이처럼 빛나는 점을 가진 반투명 종족 — 안개 구름 지대의 감독' },
    crisis: [
      { dept: '꿈제작팀', line: '공상 구름 무단 상영 시작!' },
      { dept: '점심메뉴상상팀', line: '갑자기 국밥 생각 침투!' },
      { dept: '퇴근후계획팀', line: '합격 후 상상 조기 방영!' },
      { dept: '멍때리기방지팀', line: '초점 이탈 3초 전!' }
    ]
  }
];

export const BUREAU_BY_ID = Object.fromEntries(BUREAUS.map((b) => [b.id, b]));
