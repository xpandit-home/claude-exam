# 픽셀 아트 에디터 — Build 지침

## 역할
이 지침에 따라 `D:\claude-exam\apps\pixel-art\` 폴더 안의 파일만 구현한다.
블로그 본체(`index.html`, `css/`, `js/`, `posts/`, `post.html`)는 절대 건드리지 않는다.

## 스펙 파일
`D:\claude-exam\apps\pixel-art\spec.md` 를 반드시 먼저 읽고 구현한다.

## 구현할 파일 목록

1. `theme.js` — `D:\claude-exam\apps\2048\theme.js` 를 읽고 그대로 복제
2. `style.css` — spec의 CSS 변수 + 3열→1열 반응형 레이아웃
3. `editor.js` — 캔버스 상태, 픽셀 렌더링, devicePixelRatio 대응
4. `tools.js` — 펜/지우개 드래그, 버킷 BFS, 마우스+터치 이벤트
5. `palette.js` — 기본 16색 정의, 커스텀 색상 추가/삭제
6. `ui.js` — 툴바 이벤트, 팔레트 렌더링, PNG 내보내기, localStorage 자동저장
7. `index.html` — 전체 마크업, 스크립트 로드 순서 준수

## 스크립트 로드 순서 (index.html)
```
theme.js → palette.js → editor.js → tools.js → ui.js
```

## 핵심 구현 규칙

### canvas 좌표 계산
- `canvas.width = 384 * devicePixelRatio` (해상도)
- CSS: `width: min(92vw, 384px); aspect-ratio: 1/1`
- 셀 인덱스 계산: `getBoundingClientRect()` 기준으로 비율 환산

```js
const rect = canvas.getBoundingClientRect();
const col = Math.floor((clientX - rect.left) / rect.width * size);
const row = Math.floor((clientY - rect.top) / rect.height * size);
```

### 렌더링
- 매 변경마다 전체 캔버스 재렌더링
- 투명(null) 셀: `--color-canvas-bg` 색상으로 채움
- 그리드 선: 모든 셀 경계에 1px `--color-grid` 색상 선

### 버킷 BFS
```js
// 클릭 셀 색상 === 현재 색상이면 즉시 return
// null도 하나의 색상값으로 취급
// 4방향 탐색, 캔버스 경계 내 제한
```

### Undo/Redo (선택 구현)
- mouseup/touchend 시점에 스냅샷 저장 (최대 50단계)
- 단축키: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo)

### PNG 내보내기
```js
const offscreen = document.createElement("canvas");
offscreen.width = 16 * 10;   // 160px
offscreen.height = 16 * 10;
// 각 셀을 10×10px으로 그리기, null 셀은 건너뜀(투명 유지)
const link = document.createElement("a");
link.download = `pixel-art-${timestamp}.png`;
link.href = offscreen.toDataURL("image/png");
link.click();
```

### localStorage
- 키: `"pixel-art-state"`
- 디바운스 500ms 후 저장
- try/catch로 QuotaExceededError 무시

### 전역 네임스페이스
- 모든 파일은 IIFE `(function(){ ... })()` 로 감싸기
- `window.PixelArt = {}` 에 필요한 API만 노출

## 완료 조건
- 모든 7개 파일 생성 완료
- `spec.md`의 기능 명세를 모두 충족
- 블로그 본체 파일 변경 없음
