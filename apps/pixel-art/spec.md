# 픽셀 아트 에디터 스펙

## 개요

16×16 격자에 도트를 찍어 그림을 그리고 PNG로 저장하는 웹앱.

---

## 파일 구조

```
/apps/pixel-art/
├── index.html    # 에디터 마크업
├── style.css     # 스타일 (CSS 변수로 라이트/다크 관리)
├── theme.js      # 다크모드 토글 (2048/theme.js 패턴 복제)
├── editor.js     # 캔버스 상태 + 렌더링
├── tools.js      # 펜·지우개·버킷 도구 로직
├── palette.js    # 기본 팔레트 + 커스텀 색상 추가
└── ui.js         # DOM 이벤트 연결, PNG 내보내기
```

전역 노출은 `window.PixelArt` 네임스페이스 하나로 제한.  
블로그 본체 파일(`index.html`, `css/`, `js/`, `posts/`)은 건드리지 않는다.

---

## 기능 명세

### 캔버스

- 크기: **16×16** 고정
- 렌더링: `<canvas>` — 셀당 24px, 캔버스 해상도 384×384px
- 그리드 선: 1px, CSS 변수 `--color-grid`로 라이트/다크 각각 지정
- 마우스 좌표 → 셀 인덱스 변환: `getBoundingClientRect()` 기준

### 도구

| 도구 | 단축키 | 동작 |
|------|--------|------|
| 펜 | `P` | 클릭/드래그한 셀을 현재 색상으로 채움 |
| 지우개 | `E` | 클릭/드래그한 셀을 투명(`null`)으로 초기화 |
| 버킷 | `B` | 클릭한 셀과 같은 색상의 연결 영역을 BFS로 채움 |

- 펜/지우개: `mousedown` → `mousemove` → `mouseup` 드래그 구현
- 모바일: `touchstart` / `touchmove` / `touchend` + `touch-action: none`

### 팔레트

기본 16색 (고정):
```
#000000 #ffffff #ff0000 #00ff00 #0000ff #ffff00
#ff00ff #00ffff #ff8800 #8800ff #00ff88 #ff0088
#888888 #444444 #cccccc #884400
```

- `<input type="color">`로 커스텀 색상 추가 (최대 32색, 초과 시 오래된 커스텀색 제거)
- 기본 16색은 삭제 불가, 커스텀색은 우클릭으로 삭제
- 현재 선택 색상을 팔레트 위에 크게 표시

### PNG 내보내기

- 오프스크린 canvas: 픽셀당 10px 스케일 업 (16×16 → 160×160)
- 투명 셀은 PNG에서 투명 처리
- 파일명: `pixel-art-YYYYMMDD-HHmmss.png`
- 단축키: `Ctrl+S`

### 자동저장

- localStorage 키: `pixel-art-state` (블로그 `theme`, `2048-best-score`와 충돌 없음)
- 픽셀 변경 후 500ms 디바운스로 저장
- 새로고침 시 이전 작업 복원

---

## 데이터 구조

```js
// 메모리 상태 (window.PixelArt.state)
{
  pixels: [[null, "#ff0000", ...], ...],  // 16×16, null = 투명
  activeTool: "pen",                       // "pen" | "eraser" | "bucket"
  activeColor: "#000000",
  palette: ["#000000", "#ffffff", ...]     // 최대 32색
}

// localStorage "pixel-art-state"
{
  version: 1,
  pixels: [[...], ...],
  palette: [...],
  activeColor: "#000000",
  savedAt: "2026-06-28T12:00:00.000Z"
}
```

---

## UI 레이아웃

```
┌─────────────────────────────────────────────────┐
│ ← Blog로 돌아가기    픽셀 아트 에디터      🌙   │
├──────────┬──────────────────────┬────────────────┤
│ 도구     │                      │ 현재색 ■       │
│ [펜]     │   16×16 canvas       │                │
│ [지우개] │                      │ ■■■■■■■■       │
│ [버킷]   │                      │ ■■■■■■■■       │
│          │                      │ [+ 색상 추가]  │
│ [PNG저장]│                      │                │
└──────────┴──────────────────────┴────────────────┘
```

- 데스크톱(≥768px): 3열 (툴바 | 캔버스 | 팔레트)
- 모바일(<768px): 1열 (툴바 가로 나열 → 캔버스 → 팔레트)

---

## CSS 변수

```css
:root {
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-text: #1a1a1a;
  --color-border: #d0d0d0;
  --color-grid: #c8c8c8;
  --color-tool-active: #0066cc;
  --color-canvas-bg: #e8e8e8;
}
[data-theme="dark"] {
  --color-bg: #1a1a1a;
  --color-surface: #2a2a2a;
  --color-text: #e8e8e8;
  --color-border: #444444;
  --color-grid: #3a3a3a;
  --color-tool-active: #4d9fff;
  --color-canvas-bg: #333333;
}
```

---

## 구현 주의사항

- 버킷 BFS: 클릭 셀 색상 = 현재 색상이면 즉시 리턴 (무한루프 방지). `null`도 색상값으로 취급.
- canvas `width`/`height` 속성(해상도)과 CSS 표시 크기 분리 관리. 셀 인덱스 계산은 항상 `getBoundingClientRect()` 기준.
- `devicePixelRatio` 대응: `canvas.width = 384 * dpr`, `ctx.scale(dpr, dpr)`
- localStorage 저장 시 `try/catch`로 QuotaExceededError 무시.
