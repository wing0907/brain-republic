// 민원 데이터 — W1("무의식 반응 = 시민의 업무") + W13("공감 유머")
// bureaus: 협력 필요 부서 순서. day: 등장 시작 일차.
// choice가 포함된 민원은 언어표현국 결재 문항(good/bad) 필요.

export const COMPLAINTS = [
  // ---- 1일차: 1~2개 부서 (협력 배우기) ----
  { day: 1, text: '아침 알람을 끄고 5분만 더… 위기!', bureaus: ['impulse'], from: '기상관리팀' },
  { day: 1, text: '어제 본 드라마 제목이 혀끝에서 맴돕니다', bureaus: ['memory'], from: '단어인출팀' },
  { day: 1, text: '엘리베이터에서 상사와 단둘이! 표정 관리 요망', bureaus: ['emotion'], from: '표정관리팀' },
  { day: 1, text: '월요일 아침 회의, 하품이 새어 나옵니다', bureaus: ['body', 'emotion'], from: '하품은폐팀' },
  { day: 1, text: '점심 메뉴 고민이 업무를 침범했습니다', bureaus: ['dream', 'impulse'], from: '점심상상팀' },
  { day: 1, text: '지하철에서 아는 사람인 줄 알고 인사할 뻔!', bureaus: ['memory', 'body'], from: '안면인식팀' },

  // ---- 2일차: 2개 부서 (협력 본격화) ----
  { day: 2, text: '소개팅 상대의 이름이 기억나지 않습니다!', bureaus: ['memory', 'speech'], from: '이름보관팀',
    choice: { good: '성함이 어떻게 되셨죠?', bad: '야, 너 이름 뭐였지?' } },
  { day: 2, text: '발표 중 갑자기 목소리가 떨립니다', bureaus: ['body', 'speech'], from: '성대안정팀',
    choice: { good: '차분히 말씀드리겠습니다', bad: '히익… 그게… 저기…' } },
  { day: 2, text: '슬픈 영화인데 옆자리가 회사 동료입니다', bureaus: ['emotion', 'impulse'], from: '눈물참기훈련팀' },
  { day: 2, text: '새벽 2시, 릴스가 한 개만 더를 외칩니다', bureaus: ['impulse', 'dream'], from: '핸드폰중독관리팀' },
  { day: 2, text: '중요한 미팅 중 어젯밤 꿈이 떠올랐습니다', bureaus: ['dream', 'memory'], from: '꿈잔상처리팀' },
  { day: 2, text: '매운 걸 먹었는데 안 매운 척해야 합니다', bureaus: ['body', 'emotion'], from: '통각은폐팀' },

  // ---- 3일차: 3개 부서 (풀 협력) ----
  { day: 3, text: '면접 질문: "본인의 단점은 무엇인가요?"', bureaus: ['memory', 'emotion', 'speech'], from: '면접대응 TF',
    choice: { good: '꼼꼼하다 보니 신중한 편입니다', bad: '단점이요? 완벽한 게 단점입니다' } },
  { day: 3, text: '짝사랑에게서 온 카톡, 답장 작성 중…', bureaus: ['emotion', 'impulse', 'speech'], from: '연애문장팀',
    choice: { good: '좋아요! 언제 시간 되세요?', bad: 'ㅇㅋ' } },
  { day: 3, text: '월급날 전날, 장바구니가 아우성칩니다', bureaus: ['impulse', 'memory', 'body'], from: '지름신방어팀' },
  { day: 3, text: '발표 자료가 안 열립니다. 침착하라, 침착하라!', bureaus: ['body', 'emotion', 'dream'], from: '위기연출팀' },
  { day: 3, text: '자기 전 이불킥 기억이 재생되기 시작했습니다', bureaus: ['memory', 'dream', 'emotion'], from: '흑역사봉인팀' }
];

// 부서 간 알력 (W7) — 중재 민원: 어느 부서 손을 들어줄지 선택
export const CONFLICTS = [
  {
    day: 2,
    text: '핸드폰중독관리팀 vs 스크린타임확대팀 — 취침 전 10분 분쟁!',
    a: { id: 'impulse', label: '중독관리팀 지지 (건강한 수면)' },
    b: { id: 'dream', label: '상상국 지지 (릴스도 영감이다)' }
  },
  {
    day: 3,
    text: '눈물참기훈련팀 vs 감동극대화팀 — 결혼식 축사 분쟁!',
    a: { id: 'emotion', label: '눈물 개방 (진심 전달)' },
    b: { id: 'body', label: '눈물 봉쇄 (체면 사수)' }
  }
];

// 뇌보도국 뉴스 멘트 (W11)
export const NEWS_LINES = {
  open: '뇌보도국 9시 뉴스입니다. 오늘 주인님의 하루, 현장 소식 전해드립니다.',
  topFmt: (name, n) => `오늘의 인터뷰 — ${name}! 협력 ${n}건의 맹활약으로 방송 출연이 확정됐습니다.`,
  fameFmt: (name) => `${name}의 인지도가 상승, 주인님의 의식에 한층 깊이 자리 잡았습니다.`,
  close: '이상 뇌보도국이었습니다. 시민 여러분, 내일도 힘냅시다!'
};
