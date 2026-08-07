# CI (보류)

`deploy.yml`은 GitHub Pages용 Actions 워크플로입니다.
현재 gh 토큰에 `workflow` 스코프가 없어 저장소에 직접 푸시할 수 없고,
무료 플랜에서는 비공개 레포 Pages가 지원되지 않습니다.

제출 직전 저장소를 public으로 전환할 때 `.github/workflows/deploy.yml`로 옮겨 활성화하세요.
(스코프 부여: `gh auth refresh -h github.com -s workflow`)
