# 주차대행 취소분 모니터링

출발일 2026-10-24 일반(BASIC)이 마감에서 예약 가능으로 바뀌면 텔레그램으로 알립니다. 알림 전용이며 자동 예약은 하지 않습니다. 설계는 `spec.md` 참고.

## 1. 텔레그램 봇 생성
1. 텔레그램에서 `@BotFather` -> `/newbot` -> 봇 토큰 발급
2. 만든 봇에게 아무 메시지나 보냄
3. 본인 PC 브라우저에서 `https://api.telegram.org/bot<TOKEN>/getUpdates`를 열어 `chat.id` 확인 (토큰이 담긴 URL은 공유 금지)

## 2. Secrets 등록
저장소 Settings -> Secrets and variables -> Actions -> New repository secret
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## 3. 기본 브랜치에 병합 (필수)
GitHub Actions의 스케줄(cron)과 `Run workflow` 버튼은 **기본 브랜치(master)** 에 워크플로 파일이 있어야만 동작합니다. 작업 브랜치를 master에 병합한 뒤 다음 단계로 진행하세요.

## 4. 수동 실행 (Actions 탭 -> valet-monitor -> Run workflow)
- `test-notify`: 테스트 메시지 전송 (Secrets 확인)
- `verify`: 원문 응답 상태코드/본문 앞 500자 확인 (`dateType` 포함/생략 비교, 알림 없음). 브라우저의 실제 마감 여부와 대조해 true=가능 여부를 확정할 것
- `run`: 일반 실행 (5분마다 자동으로도 실행됨. 2시간마다 "동작 중" 확인 메시지가 텔레그램으로 옴)

로컬 모의 테스트 (토큰 없이 dry-run):
`STATE_FILE=/tmp/s.json python3 tools/valet-monitor/monitor.py --mock-response true`

## 5. 종료 방법
예약 성공 또는 10/24 경과 후 Actions 탭 -> valet-monitor -> `...` -> Disable workflow. 저장소에 60일간 활동이 없으면 스케줄이 자동 비활성화됩니다.

## 주의
비공식 API라 예고 없이 변경/차단될 수 있고, GitHub cron은 지연/누락될 수 있습니다. 사이트 이용약관을 직접 확인하세요.
