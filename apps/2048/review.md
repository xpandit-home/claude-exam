# 2048 게임 구현 검증 리포트

검증일: 2026-06-28
검증 대상: `D:\claude-exam\apps\2048\` (game.js, ui.js, input.js, theme.js, style.css, index.html)
기준 문서: `D:\claude-exam\apps\2048\spec.md`

## 1. 코드 리뷰

전체 파일을 모두 읽고 spec.md와 대조했다.

- **game.js**: `slideAndMergeRow`가 compact → 인접 병합(인덱스 2씩 건너뛰어 재병합 방지) → 패딩 순서로 정확히 구현됨. `moveBoard`가 방향별로 transpose/reverse를 적용해 "왼쪽 슬라이드"로 정규화하는 방식도 spec과 일치. `move()`는 `moved`가 false면 즉시 return하여 새 타일을 스폰하지 않음(spec 핵심 규칙 충족). `canMove()`로 4방향 시뮬레이션 후 게임오버 판정, `hasWinningTile()`로 승리 판정 — 승리 후에도 `isGameOver`만 아니면 계속 진행 가능한 구조로 spec 요구사항(승리 후 계속 진행 허용)을 만족.
- **ui.js**: localStorage 키가 `2048-best-score`로 spec과 일치. 매 렌더링마다 score/bestScore 갱신, 오버레이 표시/숨김 로직도 게임오버·승리 상태에 맞게 분기됨.
- **input.js**: 키보드(`ArrowLeft/Right/Up/Down`) 및 터치 스와이프(임계값 20px) 모두 동일한 `handleMove`로 합류. `preventDefault()`로 스크롤 방지, 터치 리스너는 `passive: true`로 등록(스크롤 방지는 CSS `touch-action: none`이 보드에 적용되어 있어 일관됨).
- **theme.js**: 블로그 `js/theme.js`와 동일한 패턴(`data-theme` 속성 + `prefers-color-scheme` + `localStorage`)을 독립적으로 복제. `STORAGE_KEY = "theme"`로 블로그와 동일한 키를 쓰지만, 이는 동일 출처(origin)에서 다크모드 설정을 블로그와 게임 간에 공유하는 것으로 자연스러운 동작이며 spec이 금지한 항목(점수 데이터 키 충돌)과는 무관함.
- **style.css**: CSS 변수 기반 라이트/다크 팔레트, 타일별 배경색·글자색 분기(2,4는 어두운 글자, 8 이상은 밝은 글자), 반응형 보드(`width: min(90vw, 420px); aspect-ratio: 1/1`) 모두 spec대로 구현됨. 트랜지션 80ms로 과도하지 않음.
- **index.html**: "← Blog로 돌아가기" 링크(`../../index.html`), 점수판, 새 게임 버튼, 오버레이, 보드 마크업 모두 spec 구조와 일치. `window.Game2048` 네임스페이스로 전역 노출 최소화됨.

코드 리뷰에서 로직 오류나 버그는 발견되지 않았다. 별도 수정 없음.

## 2. 로컬 서버 동작 확인

`npx --yes serve -p 5090 D:\claude-exam` 로 서버를 띄우고 curl로 확인:

| 요청 | 결과 |
|---|---|
| `GET /apps/2048/index.html` | `301` → `/apps/2048/index` 로 리다이렉트 (serve 패키지의 clean-URL 정규화 동작) |
| 리다이렉트 추적(`curl -L`) | `200 OK`, `<title>2048</title>` 정상 포함 |
| `GET /apps/2048/` (디렉터리) | `200 OK` |
| `GET /apps/2048/game.js` | `200 OK` |
| `GET /apps/2048/ui.js` | `200 OK` |
| `GET /apps/2048/input.js` | `200 OK` |
| `GET /apps/2048/theme.js` | `200 OK` |
| `GET /apps/2048/style.css` | `200 OK` |

301은 `serve` 도구 자체의 `.html` 확장자 정규화 동작이며 게임 코드의 결함이 아니다(브라우저에서 링크 클릭/주소창 접속 시 정상적으로 200까지 도달함). 모든 정적 자원이 정상 응답.

## 3. game.js 핵심 로직 Node 유닛 테스트

Node `vm` 모듈로 `game.js`를 격리 실행하고 `Game2048.createGame()`의 공개 API(`move`, `state`)를 통해 보드를 직접 주입하여 검증했다. 총 12개 검증 모두 통과:

- `[2,2,0,0]`을 왼쪽으로 밀면 `[4,0,0,0,...]`, `moved=true`, score +4
- `[2,2,2,2]` 왼쪽 슬라이드 시 `[4,4,0,0]`(같은 턴에 재병합되어 `[8,0,0,0]`이 되지 않음) — **재병합 방지 규칙 정상**
- 이미 완전히 정렬되어 더 이상 이동할 수 없는 보드에서 `move("left")` → `moved=false`이고 보드가 전혀 변하지 않음(새 타일 미생성) — **moved=false 시 스폰 안 함 규칙 정상**
- `move("right")`: `[0,0,2,2]` → 오른쪽 끝에 `4` 병합
- `move("up")`: 전치(transpose) 경로 검증, 세로 `[2,2,0,0]` → 위쪽에 `4` 병합
- 4방향 모두 이동 불가능한 데드락 보드에서 `moved=false`
- `2048` 타일 생성 시 `isWon = true`로 전환

테스트 스크립트는 임시 위치(`scratchpad/test2048.js`)에만 작성했으며 `apps/2048/` 안에는 남기지 않았다.

## 4. 블로그 본체 파일 무변경 확인

```
git status --short apps/        →  ?? apps/   (신규 untracked, 예상된 결과)
git diff --stat -- index.html css js posts post.html  →  (변경 없음, diff 출력 없음)
```

`index.html`, `css/`, `js/`, `posts/`, `post.html` 등 블로그 본체 파일에는 일체 수정이 없음을 확인했다. (참고: `CLAUDE.md`에 이번 작업과 무관한 기존 변경 사항이 작업 트리에 남아 있었으나, 이는 본 검증 작업에서 건드리지 않았고 블로그 본체 파일 범위에도 포함되지 않는다.)

## 5. localStorage 키 충돌 확인

- 블로그 `js/theme.js`: `STORAGE_KEY = "theme"`
- 게임 `apps/2048/ui.js`: `BEST_SCORE_KEY = "2048-best-score"`
- 게임 `apps/2048/theme.js`: `STORAGE_KEY = "theme"` (다크모드 설정 키, 블로그와 동일 — 의도적 공유로 데이터 손상 위험 없음. 점수 데이터와는 무관)

요구사항인 점수 키(`2048-best-score`)와 블로그의 `theme` 키 사이에 충돌은 없다. 다크모드 키를 블로그와 공유하는 것은 사이트 전역에서 다크모드 설정이 일관되게 적용되는 효과를 주며 부작용이 없다.

## 최종 결론

**통과 (PASS)**

- 코드 리뷰: 버그·누락 없음, 수정 불필요
- 로컬 서버 응답: 모든 정적 파일 200 OK (단, `index.html` 직접 요청 시 `serve`가 301로 clean URL 리다이렉트하는 것은 도구 특성이며 정상 동작)
- game.js 핵심 로직 Node 테스트: 12/12 통과 (이동/병합, 재병합 방지, moved=false 시 미스폰, 승리/데드락 판정 모두 정상)
- 블로그 본체 파일: 무변경 확인
- localStorage 키 충돌: 없음

spec.md에 정의된 요구사항을 모두 충족하며, 별도 코드 수정 없이 검증을 통과했다.
