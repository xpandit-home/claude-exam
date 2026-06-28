# 2048 게임 구현 계획

## 0. 전제 및 컨벤션
기존 블로그는 프레임워크/빌드도구 없이 순수 HTML/CSS/JS로 작성되어 있고, 다크모드는 `documentElement`의 `data-theme` 속성 + CSS 변수(`:root`, `[data-theme="dark"]`) + `localStorage`로 구현되어 있다(`js/theme.js` 참고). `/apps/` 폴더는 새로 생성하며, 2048 게임은 블로그 본체 파일(`index.html`, `css/style.css`, `js/*.js`, `posts/*`)을 전혀 건드리지 않고 `/apps/2048/` 안에서 완전히 독립적으로 동작한다.

## 1. 파일 구조

```
/apps/2048/
├── index.html      # 게임 페이지 마크업
├── style.css       # 게임 전용 스타일
├── theme.js        # 다크모드 토글 (블로그 theme.js 패턴 복제, 독립적으로 보유)
├── game.js         # 게임 코어 로직 (그리드 상태, 이동/병합, 랜덤 타일, 승패 판정)
├── input.js        # 키보드 + 터치 스와이프 입력 처리
└── ui.js           # 렌더링 + 점수판 UI + localStorage 최고점수 관리
```

- `index.html`에 "← Blog로 돌아가기" 링크 추가 (`../../index.html`).
- 전역 노출은 `window.Game2048` 네임스페이스 객체 하나로 최소화.

## 2. 게임 로직 (game.js)

### 상태
- `board`: 4x4 배열, `0`은 빈 칸
- `score`, `bestScore`, `isGameOver`, `isWon`

### 이동/병합 알고리즘
모든 방향을 "왼쪽으로 슬라이드"로 정규화:
- 좌: 그대로 / 우: 행 reverse / 위·아래: 전치(transpose) 후 좌·우와 동일 처리, 다시 전치

각 행에 대해 `slideAndMergeRow(row)`:
1. 0이 아닌 값만 추출(compact)
2. 인접한 같은 값 병합 (병합된 타일은 같은 턴에 재병합 안 되도록 인덱스 건너뛰기), `score` 누적
3. 오른쪽을 0으로 패딩해 길이 4 유지
4. `moved` 플래그 반환 — 변화 없으면 새 타일 생성 안 함 (2048 핵심 규칙)

### 랜덤 타일 생성
빈 칸 좌표 중 무작위 선택, 90% `2` / 10% `4`.

### 게임오버 판정
- 승리: 보드에 2048 이상 값 존재 → `isWon = true` (이후 계속 진행 허용)
- 패배: 빈 칸 없고 4방향 시뮬레이션 모두 `moved=false` → `isGameOver = true`

### 초기화
보드 전체 0, score 0, 시작 타일 2개 스폰. "새 게임" 버튼으로 재호출.

## 3. 입력 처리 (input.js)

- **키보드**: `ArrowLeft/Right/Up/Down` → 방향 매핑, `preventDefault()`로 스크롤 방지
- **터치 스와이프**: `touchstart`/`touchend` 좌표 차이로 방향 판정 (임계값 20px), 보드 영역은 `touch-action: none`으로 페이지 스크롤 방지
- 두 입력 모두 동일한 `handleMove(direction)` 함수로 합류

## 4. 점수판 UI (ui.js)

```html
<div class="scoreboard">
  <div class="score-box"><span class="label">SCORE</span><span id="current-score">0</span></div>
  <div class="score-box"><span class="label">BEST</span><span id="best-score">0</span></div>
</div>
<button id="new-game-btn">새 게임</button>
<div id="board" class="board"></div>
```

- localStorage 키: `2048-best-score` (블로그 `theme.js`의 `theme` 키와 충돌 방지)
- 매 이동 후 현재 점수 갱신, 최고 점수 비교 후 갱신
- 보드는 매 이동마다 전체 재렌더링 (4x4 규모에서 성능 문제 없음, 구현 단순화)

## 5. 스타일링 (style.css)

- 원작 2048 팔레트 기반 CSS 변수 (`--tile-2` ~ `--tile-2048`, `--tile-super`)
- 다크모드: `[data-theme="dark"]` 오버라이드
- 작은 수(2,4)는 어두운 글자, 8 이상은 밝은 글자
- 반응형 그리드: `width: min(90vw, 420px); aspect-ratio: 1/1; grid-template-columns: repeat(4, 1fr)`
- 트랜지션은 100ms 이내로 짧게 (과한 애니메이션 지양)

## 6. 구현 순서

1. `/apps/2048/index.html` 뼈대 (보드, 점수판, 새게임 버튼, 돌아가기 링크)
2. `game.js` — 순수 로직 (보드/이동/병합/스폰/게임오버)
3. `ui.js` — 렌더링 + 점수판 + localStorage
4. `input.js` — 키보드 연결 후 동작 확인
5. 터치 스와이프 추가 및 모바일 테스트
6. `style.css` — 라이트/다크 모드 둘 다 시각 확인
7. 게임오버/승리 배너 추가, 최종 교차 확인 (라이트/다크/모바일)

## 검증 방법 (Review 단계)

- 로컬 서버에서 `/apps/2048/index.html` 접속
- 방향키 4개 모두 타일 이동/병합 정상 동작 확인
- 모바일 너비에서 터치 스와이프 동작 확인
- 점수 증가 및 새로고침 후 최고점수 유지 확인 (localStorage)
- 게임오버/2048 달성 시 배너 표시 확인
- 다크모드 토글 시 정상 전환 확인
- 블로그 본체 파일(`index.html`, `css/`, `js/`, `posts/`)이 변경되지 않았는지 확인
