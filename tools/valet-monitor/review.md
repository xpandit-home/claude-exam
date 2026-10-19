# 주차대행 모니터링 리뷰 (review.md)

## 요약
**수정 후 통과.** 버그 1건(상태 파일이 JSON 객체가 아닐 때 크래시)을 수정했다. 나머지는 spec과 일치한다. 실제 API 호출은 미검증.

## 검증 항목별 결과

| 항목 | 결과 | 근거 |
|---|---|---|
| 알림 규칙 4가지 (마감->가능 1회 / 유지 무알림 / 복귀 상태만 / 최초 가능 알림) | 통과 | urlopen 모의 테스트. monitor.py:183-188 |
| 연속 실패: 6회째 경고 1회, 7회째 이후 무알림, 복구 알림 1회 | 통과 | 403 응답 8회 연속 실행: 6회째만 전송, 7~8회 무전송. 성공 응답 시 복구 1건 + 가능 알림 1건 |
| 4xx 즉시 실패(재시도 없음, 상태코드만 로그) | 통과 | 로그 "HTTP 403", sleep 호출 없음 (monitor.py:61-62) |
| 5xx/네트워크 재시도 3회, 백오프 2/4/8초 | 통과 | 로그 "재시도 1/3..3/3" |
| 형식 오류(`data`가 문자열, JSON 아님) | 통과 | 알림 없이 fail_count 증가, 본문 200자 로그 |
| 상태 파일 없음 / 손상 | 수정 후 통과 | `{bad`, 빈 값, 잘못된 타입은 초기화. `[]`, `null`, `5`는 AttributeError 크래시였음 -> 수정 |
| 토큰 노출 | 통과 | 모든 경로 출력 캡처에 토큰 없음. urllib 예외는 클래스명만 기록(monitor.py:64-65), 전송 실패는 status만 기록(112). `mask()`도 이중 방어 |
| 텔레그램 전송 실패 시 상태 미갱신 | 통과 | 네트워크 오류, 403 모두 rc=1이고 상태 파일 불변 |
| 워크플로 구조 (cron, dispatch, concurrency, permissions: contents read) | 통과 | YAML 파싱 정상(`on` 키가 True로 파싱되는 건 PyYAML의 YAML1.1 특성이며 Actions에서는 정상) |
| cache restore/save 순서와 키 | 통과 | restore(run_id 키 + `valet-state-` 접두) -> 실행 -> save(run_id 키). 실패 job에서도 save되지만 저장 대상은 복원된 기존 상태 그대로라 낡은 상태가 새로 덮어쓰이는 문제 없음(실패 시 monitor.py가 상태를 쓰지 않음) |
| `if: always()` 시 `.state` 부재 | 통과 | 첫 실행 verify/test-notify 등에서 `.state`가 없으면 save 단계가 경고만 내고 실패하지 않음(actions/cache 동작). 최초 run 모드는 상태 파일을 생성 |
| Secrets 전달, 액션 버전 | 통과 | checkout@v4, setup-python@v5, cache/restore,save@v4 모두 존재 |
| 인젝션 | 통과 | `inputs.mode`는 env(MODE)로만 전달되고 `case`로 비교. `${{ }}`를 run 본문에 보간하지 않음 |
| README 설정 절차 vs spec 5장 | 통과 | 봇 생성, chat.id 확인, Secrets 2개, 수동 실행 모드 3종 일치. 로컬 모의 명령 실행 확인(dry-run 정상) |
| 네트워크 실호출 | 미검증 | api.amanopark.co.kr가 이 환경에서 403 차단 |

## 발견한 문제와 수정
1. `tools/valet-monitor/monitor.py:120-122` load_state: 상태 파일 내용이 JSON 객체가 아니면(`[]`, `null`, 숫자) `s.get`에서 AttributeError가 잡히지 않아 매 실행이 크래시하고 캐시가 복구되지 않음. `isinstance(s, dict)` 검사를 추가해 ValueError로 처리(초기화). 수정 후 재테스트 통과.

경미한 관찰(수정 안 함, 설계 변경 영역):
- 복구 알림 전송 성공 후 이어지는 "예약 가능" 알림이 실패하면 상태가 저장되지 않아 다음 실행에서 복구 알림이 한 번 더 갈 수 있음.
- 텔레그램 POST 타임아웃 재시도로 드물게 중복 메시지 가능.
- workflow_dispatch는 워크플로 파일이 기본 브랜치에 있어야 Actions 탭에 나타남(README에 명시되어 있지 않음).

## 미검증 항목 / 사용자가 직접 확인할 것
- 실제 API 응답 형식(`{data: bool}` 추정)과 true=예약 가능 의미. 첫 실행에서 `verify` 모드로 `dateType` 포함/생략 비교 후 브라우저와 대조.
- `test-notify`로 실제 텔레그램 수신 및 Secrets 설정 확인.
- cron 실제 실행/지연 및 캐시 복원 동작은 GitHub에서만 확인 가능(로컬에선 YAML 문법과 로직만 검증).
- 사이트 이용약관 확인.
