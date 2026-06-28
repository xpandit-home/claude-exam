# 픽셀 아트 에디터 — Review 지침

## 역할
`D:\claude-exam\apps\pixel-art\` 의 구현 결과물을 검증하고 `review.md`를 작성한다.
코드를 수정해야 할 경우 직접 수정한다. 블로그 본체 파일은 건드리지 않는다.

## 검증 기준 문서
`D:\claude-exam\apps\pixel-art\spec.md`

## 검증 항목

### 1. 파일 완성도
모든 파일이 존재하는지 확인: index.html, style.css, theme.js, editor.js, tools.js, palette.js, ui.js

### 2. 코드 리뷰 (각 파일 전체 읽기)

**index.html**
- 스크립트 로드 순서: theme.js → palette.js → editor.js → tools.js → ui.js
- "← Blog로 돌아가기" 링크 (`../../index.html`)
- canvas 요소, 툴바, 팔레트 마크업 존재
- 다크모드 토글 버튼

**editor.js**
- `window.PixelArt` 네임스페이스 사용
- IIFE로 감싸져 있는지
- devicePixelRatio 대응 (canvas.width = 384 * dpr, ctx.scale(dpr, dpr))
- 셀 인덱스 계산이 getBoundingClientRect() 기준인지
- 투명(null) 셀 렌더링 처리
- 그리드 선 렌더링

**tools.js**
- 펜: mousedown+mousemove+mouseup 드래그
- 지우개: 동일 패턴으로 null 설정
- 버킷 BFS: null도 색상값으로 처리, 클릭색=현재색이면 즉시 return, 경계 체크
- 터치 이벤트 (touchstart/touchmove/touchend)

**palette.js**
- 기본 16색 정의
- 커스텀 색상 추가 (최대 32색)
- 우클릭 삭제 (기본 16색 보호)

**ui.js**
- PNG 내보내기: 오프스크린 canvas 160×160, null 셀 투명 처리
- localStorage 저장/복원 (키: "pixel-art-state")
- 단축키: P/E/B, Ctrl+S, Ctrl+Z, Ctrl+Y

**style.css**
- CSS 변수 라이트/다크 모두 정의
- 3열 레이아웃 (데스크톱) / 1열 (모바일 <768px)
- canvas touch-action: none

### 3. 버그 검출 체크리스트
- [ ] canvas 좌표 변환 오류 (getBoundingClientRect 미사용 등)
- [ ] 버킷 BFS 무한루프 가능성
- [ ] PNG 내보내기 시 투명 처리 누락
- [ ] localStorage 저장 시 try/catch 누락
- [ ] 스크립트 의존성 순서 오류 (window.PixelArt가 정의되기 전에 참조)
- [ ] 모바일 터치 이벤트 preventDefault 누락으로 스크롤 간섭

### 4. 블로그 본체 파일 무변경 확인
`D:\claude-exam\index.html`, `D:\claude-exam\css\`, `D:\claude-exam\js\` 를 확인해서
pixel-art 관련 변경이 없는지 확인.

## 수정 방법
버그 발견 시 직접 수정하고 수정 내용을 review.md에 기록.

## 결과물
`D:\claude-exam\apps\pixel-art\review.md` 작성:
- 각 항목별 PASS/FAIL
- 발견된 버그와 수정 내용
- 최종 결론 (PASS / FAIL)
