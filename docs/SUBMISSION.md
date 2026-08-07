# NAN 2026 예선 제출 런북 (마감: 2026-08-10 23:59 KST)

공식 규정 원문은 사이트(https://nan2026.nhn.com/) 기준으로 정리했습니다.
**5개 항목을 모두 제출해야 하며, 하나라도 누락 시 심사 대상에서 제외됩니다.**

## 제출물 체크리스트

| # | 항목 | 형식 | 상태 |
|---|---|---|---|
| 1 | 플레이 가능한 빌드 + 전체 소스 | GitHub (웹 빌드 링크 또는 APK) | 🟡 코드 완성, **공개 전환+Pages 활성화 필요** |
| 2 | 플레이 동영상 | YouTube, **30~60초**, 실제 플레이 화면 | 🔴 촬영 필요 (아래 가이드) |
| 3 | 게임 소개 및 설명 문서 | PDF | 🟡 원고 완성 (`GAME_INTRO.md` → pdf), 영상 링크만 기입 |
| 4 | AI 활용 기술 문서 | PDF | 🟢 원고 완성 (`AI_TECH_DOC.md` → pdf) |
| 5 | 팀원 롤 기술서 | PDF — **팀 참가이므로 필수** | 🟢 완성 (팀 뇌지컬연구소: 성지은·장우진) |
| — | 참가 신청서 | 구글폼 | 🔴 직접 제출: https://docs.google.com/forms/d/e/1FAIpQLSdb2ifNzAdJpOYrRUCFA0DDQ7S56zTfcUsm79MI3aNTKOgsGg/viewform |

## 규정 요점 (원문 발췌 요약)

- 웹 빌드는 "GitHub Pages 등으로 배포하여 **링크 클릭만으로 브라우저에서 바로 플레이**".
- "게임 **전체 소스 코드를 동일 저장소에 포함**하고, **커밋 기록을 유지**".
- "저장소는 **공개(public) 제출을 권장**. 부득이 비공개일 경우 심사 계정을 초대" —
  심사 계정: `dl_gameai_reviewer@nhn.com`.
- 영상: 30~60초, 실제 게임 플레이 장면 중심. **AI를 이용한 조작·합성 불가** — 실제
  플레이 화면 그대로. 공개 또는 링크 공유 상태 업로드.
- 제출 링크(GitHub·YouTube)는 심사 종료 시점까지 접근 가능 상태 유지.
- 접수 마감 후 제출 내용 변경 불가.
- 외부 에셋 사용 시 출처·라이선스를 AI 활용 기술 문서에 명시 (본작: 외부 에셋 0).

## 제출 직전 실행 순서 (D-day 런북)

### 1) 저장소 공개 전환 + GitHub Pages 활성화

권장안(규정상 public 권장 + "동일 저장소" 요건 충족):

```bash
# 1. 공개 전환
gh repo edit wing0907/brain-republic --visibility public --accept-visibility-change-consequences

# 2. gh-pages 브랜치로 빌드 배포 (workflow 스코프 불필요)
npm run deploy

# 3. Pages 활성화 (gh-pages 브랜치 소스)
gh api repos/wing0907/brain-republic/pages -X POST \
  -f "source[branch]=gh-pages" -f "source[path]=/"

# 4. 1~2분 후 접속 확인
open https://wing0907.github.io/brain-republic/
```

대안(비공개 유지를 원할 경우): 저장소를 비공개로 두고
`gh repo edit` 대신 GitHub 웹에서 Settings → Collaborators →
`dl_gameai_reviewer@nhn.com` 초대. 단, 이 경우 무료 플랜에서는 GitHub Pages를 쓸 수
없으므로 웹 빌드 링크 대신 **APK 또는 다른 정적 호스팅**이 필요함 → 공개 전환을 권장.

### 2) 모바일 실기기 확인
- 폰 브라우저로 Pages 링크 접속 → 터치 조작(연타/홀드/스와이프/2지선다) 확인.

### 3) 플레이 영상 촬영 (30~60초)
- **본인이 직접 플레이**하며 녹화 (규정상 AI 조작 불가).
- iPhone: 제어센터 화면 녹화 / Android: 화면 녹화 / 데스크톱: QuickTime·OBS.
- 추천 구성(55초):
  1. 타이틀 + 지도 훑기 3초
  2. 돌보기(먹이기/재우기 → 게이지 상승) 8초
  3. **야근 러시** 콤보 플레이 (아케이드 손맛 컷) 15초
  4. **스파이 색출** 증언 대조 → 지목 성공 10초
  5. `?demo=doom` 재접속 → 방치 정산(국장 소멸·세대교체) 모달 8초 ← 임팩트 컷
  6. 청사 증축 + `?demo=ending` 엔딩(폭죽·국장 단체 사진) 8초
- **데모 세이브 파라미터** (시연·촬영용, 실제 플레이 화면임):
  - `…/?demo=doom` 20시간 방치 상태(2개 국 소멸) — 생존 룰 시연
  - `…/?demo=rich` 후반부 성장 상태 — 증축·다이아 시연
  - `…/?demo=ending` 6국 완성 → 엔딩 직행
  - `…/?demo=fresh` 세이브 초기화(새 게임)
- YouTube에 **공개 또는 링크 공유(일부 공개)** 로 업로드.

### 4) PDF 마무리
- `docs/GAME_INTRO.md`의 "(업로드 후 기입)"에 YouTube 링크 기입.
- `docs/pdf/` 재생성: `npm run docs` (md → styled HTML → PDF).
- 팀 참가라면 `TEAM_ROLES.md` 작성 후 함께 변환.

### 5) 구글폼 제출 (마감 23:59, 여유 있게!)
- 참가자 정보(성명/연락처/이메일/생년월일), 팀이면 팀명+팀원 정보.
- 링크 3종: GitHub / Pages 플레이 링크 / YouTube + PDF 업로드.

## 주의(약관에서 확인된 사항)

- 저작권은 참가자 귀속, 단 수상 시 NHN이 홍보 목적 1년 무상 이용 + **사업화
  우선협상권 4개월** 부여에 동의하게 됨.
- 출품작은 순수 창작물이어야 하며 타인 저작물 무단 사용 시 실격.
  ✅ 원작 세계관 「두뇌공화국」 저작자 **성지은은 팀원**이므로 저작권 문제 없음.
- 본선(9/4~6, 판교 NHN 사옥) 48시간 전일 참여 필수, 온라인 참여 불가.
