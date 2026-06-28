---
title: Claude Code 퍼미션 규칙 설정
date: 2026-06-28
summary: Claude Code에서 자동 허용/거부할 명령어를 settings.local.json으로 관리하는 방법을 정리했습니다.
---

# Claude Code 퍼미션 규칙 설정

Claude Code는 파일 수정이나 터미널 명령 실행 시 사용자에게 허가를 요청한다. 자주 쓰는 안전한 명령은 자동으로 허용하고, 위험한 명령은 아예 차단하도록 규칙을 설정해두면 훨씬 편리하다.

## 설정 파일 위치

프로젝트 루트의 `.claude/settings.local.json`에 작성한다. 이 파일은 `.gitignore`에 포함시켜 개인 설정이 원격 저장소에 올라가지 않도록 한다.

```json
{
  "permissions": {
    "allow": [...],
    "deny": [...]
  }
}
```

## 자동 허용 규칙 (Allow)

자주 실행하는 안전한 명령들을 미리 허용해두면 매번 승인 창이 뜨지 않는다.

```json
"allow": [
  "Bash(git *)",
  "Bash(npm test)",
  "Bash(npx live-server *)",
  "Bash(gh auth *)",
  "Bash(gh repo *)",
  "Bash(gh api *)"
]
```

## 자동 거부 규칙 (Deny)

실수나 악의적인 사용을 막기 위해 위험한 명령은 아예 실행되지 않도록 차단한다.

```json
"deny": [
  "Bash(rm -rf *)",
  "Bash(sudo *)",
  "Bash(chmod 777 *)",
  "Bash(curl * | bash)",
  "Bash(curl * | sh)",
  "Bash(wget * | bash)",
  "Bash(wget * | sh)",
  "Bash(bash <(curl *))",
  "Bash(sh <(curl *))",
  "Bash(git push --force *)",
  "Bash(git push -f *)",
  "Bash(git reset --hard *)"
]
```

## 거부 규칙 설명

| 규칙 | 이유 |
|---|---|
| `rm -rf *` | 디렉터리째로 삭제하는 복구 불가 명령 |
| `sudo *` | 관리자 권한 남용 방지 |
| `chmod 777 *` | 모든 사용자에게 실행 권한을 주는 보안 취약 설정 |
| `curl/wget \| bash/sh` | 인터넷에서 받은 스크립트를 검토 없이 즉시 실행하는 위험한 패턴 |
| `git push --force` | 원격 저장소 히스토리를 강제로 덮어씌워 협업 이력 파괴 가능 |
| `git reset --hard` | 커밋되지 않은 변경사항을 복구 불가능하게 삭제 |

## 우선순위

deny가 allow보다 항상 먼저 적용된다. `git *`을 허용해도 `git push --force`는 deny에 걸려 차단된다.
