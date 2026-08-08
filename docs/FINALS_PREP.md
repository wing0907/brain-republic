# 본선(9/4~6, 판교 48h) 준비 노트

예선 제출 후 ~ 본선 사이(8/22 발표 후 약 2주)에 준비할 것들.

## 1. Unity MCP (에디터 실시간 조작) — 세팅 절차

예선 개발은 CLI 배치 파이프라인(BuildScript)으로 자동화했지만, 본선 48시간
현장에서는 **Claude가 열린 에디터를 실시간으로 조작**하는 Unity MCP가 유효하다.

이미 해둔 것:
- Unity 6000.3.21f1 + WebGL 모듈 설치됨 (`/Applications/Unity/Hub/Editor/`)
- `uv`(Python 러너) 설치 확인됨
- 프로젝트 manifest에 MCP 패키지 등록: `com.coplaydev.unity-mcp`
  (https://github.com/CoplayDev/unity-mcp — MIT. 에디터 툴링이며 빌드에 포함되지 않음)

남은 수동 절차 (GUI 필요, 5분):
1. Unity Hub에서 `unity/BrainRepublic3D` 프로젝트 열기 → 패키지 자동 설치됨
2. 메뉴 `Window > MCP For Unity` → **Auto-Setup** 클릭 → 클라이언트에 Claude Code 선택
   (Claude Code 설정에 MCP 서버가 자동 등록된다)
3. **새 Claude Code 세션** 시작 → `mcp` 도구 목록에 Unity 도구가 보이면 성공
4. 에디터를 켜둔 상태에서 사용 (브리지가 에디터 안에서 동작)

가능해지는 것: 씬 오브젝트 생성/수정, 컴포넌트 편집, 플레이모드 제어, 콘솔
로그 조회, 에셋 조작 등을 Claude가 대화로 직접 수행.

## 2. 본선 아이디어 카드 (주제 공개 후 조합)

- **3D 미로/탐험**: 예선 때 아껴둔 카드 — 코어 원정대 파이프라인(프로시저럴
  스테이지 빌더) 위에 1인칭/탑다운 미로 생성기를 얹으면 반나절 내 프로토타입 가능
- **두뇌공화국 IP 재활용**: 6개 국·국장 캐릭터·부서 개그·명예 시스템은 어떤
  주제가 나와도 세계관 스킨으로 즉시 전개 가능
- **검증 자산**: 헤드리스 스모크 테스트 패턴(SendMessage 디버그 훅), WebGL
  스트리핑 해결책(ShaderRefs/link.xml), 데모 세이브 파라미터 — 현장에서 재사용
- **LLM 인게임 활용**: 본선은 현장 API 사용 가능(참가자 부담) — 국장 NPC 대화,
  위기 카드 실시간 생성 등 (예선은 심사자 무비용 실행 요건 때문에 배제했음)

## 3. 예선 제출 체크리스트 (최종)

- [ ] 플레이 영상 30~60초 촬영 (본인 플레이) → YouTube 업로드
- [ ] `docs/GAME_INTRO.md` 영상 링크 기입 → `npm run docs` → PDF 최종본
- [ ] 구글폼 제출 (팀원 2인 인적사항, 링크 3종 + PDF)
- [ ] 제출 후 저장소·Pages·YouTube 링크 접근 가능 상태 유지 (심사 종료까지)
