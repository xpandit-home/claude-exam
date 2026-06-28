# Markdown Blog

마크다운 파일을 읽어서 블로그처럼 보여주는 정적 사이트입니다. 프레임워크 없이 순수 HTML/CSS/JS로 구현했습니다.

## 실행 방법

`.md` 파일을 `fetch()`로 불러오기 때문에 `file://`로 직접 열면 브라우저 CORS 정책에 막힙니다. 로컬 서버로 실행하세요.

```bash
npx serve .
```

또는 VSCode의 Live Server 확장을 사용해도 됩니다.

## 글 추가하는 방법

1. `posts/` 폴더에 새 `.md` 파일을 만듭니다. 상단에 프론트매터를 작성합니다.

```markdown
---
title: 글 제목
date: 2026-07-01
summary: 한 줄 요약
---

본문 내용...
```

2. `posts/posts.json`에 새 항목을 추가합니다.

```json
{ "id": "고유-id", "file": "파일명.md" }
```

3. `index.html`을 새로고침하면 목록에 바로 반영됩니다.

## 다크 모드

우측 상단의 토글 버튼으로 다크/라이트 모드를 전환할 수 있습니다. 선택값은 `localStorage`에 저장되어 다음 방문에도 유지됩니다.
