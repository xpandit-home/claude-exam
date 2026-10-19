#!/usr/bin/env python3
"""주차대행 취소분 모니터링: 마감 -> 예약 가능 전환 시 텔레그램 알림.

표준 라이브러리만 사용한다. 사용법은 README.md 참고.
환경변수: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, STATE_FILE
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

# ---- 조회 대상 (향후 확장 시 여기만 수정) ----
API_URL = "https://api.amanopark.co.kr/api/web/setting/booking/check"
BOOKING_URL = "https://valet.amanopark.co.kr/booking"
TARGET_DATE = "2026-10-24"
TARGET_TYPE = "BASIC"
TARGET_DATE_TYPE = "departing_at"

# 수동 테스트용: 환경변수 TARGET_DATE_OVERRIDE(YYYY-MM-DD)로 날짜를 바꿀 수 있다.
# 이 경우 실제 감시 상태와 섞이지 않도록 상태 파일도 분리한다.
DATE_OVERRIDE = os.environ.get("TARGET_DATE_OVERRIDE", "").strip()
if DATE_OVERRIDE:
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", DATE_OVERRIDE):
        sys.exit("TARGET_DATE_OVERRIDE 형식 오류 (YYYY-MM-DD)")
    TARGET_DATE = DATE_OVERRIDE
TARGET_LABEL = "출발일 {} 일반(BASIC)".format(TARGET_DATE) + (" [날짜 테스트]" if DATE_OVERRIDE else "")

USER_AGENT = "valet-monitor/1.0 (personal availability notifier)"
TIMEOUT = 10
MAX_RETRIES = 3          # 최초 시도 이후 재시도 횟수
BACKOFF_BASE = 2         # 2s, 4s, 8s
FAIL_ALERT_THRESHOLD = 6
DEFAULT_STATE_FILE = ".state/valet-state.json"
DEFAULT_STATE = {"available": None, "fail_count": 0, "alerted_fail": False}


def log(msg):
    print(mask(str(msg)), flush=True)


def mask(text):
    """토큰이 포함될 수 있는 문자열에서 비밀값을 가린다."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if token:
        text = text.replace(token, "***")
    return re.sub(r"bot\d+:[A-Za-z0-9_-]+", "bot***", text)


class HttpError(Exception):
    def __init__(self, status, msg=""):
        super().__init__(msg or "HTTP {}".format(status))
        self.status = status


def http_request(url, data=None, retries=MAX_RETRIES):
    """(status, body) 반환. 5xx/네트워크 오류는 재시도, 4xx는 즉시 HttpError."""
    last = None
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=data, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                return resp.status, resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if 400 <= e.code < 500:
                raise HttpError(e.code)
            last = HttpError(e.code)
        except Exception as e:  # URLError, timeout 등 (URL이 메시지에 섞일 수 있어 유형만 기록)
            last = HttpError(0, "network error: {}".format(type(e).__name__))
        if attempt < retries:
            wait = BACKOFF_BASE ** (attempt + 1)
            log("재시도 {}/{} ({}초 후): {}".format(attempt + 1, retries, wait, last))
            time.sleep(wait)
    raise last


def build_url(include_date_type=True):
    params = {"date": TARGET_DATE, "type": TARGET_TYPE}
    if include_date_type:
        params["dateType"] = TARGET_DATE_TYPE
    return API_URL + "?" + urllib.parse.urlencode(params)


def parse_availability(body):
    """True/False 반환, 형식이 다르면 ValueError."""
    try:
        obj = json.loads(body)
    except ValueError:
        raise ValueError("JSON 아님: " + body[:200])
    if isinstance(obj, dict) and isinstance(obj.get("data"), bool):
        return obj["data"]
    raise ValueError("예상 밖 형식: " + body[:200])


def fetch_available(mock=None):
    if mock is not None:
        log("[mock] 모의 응답 data={}".format(str(mock).lower()))
        return mock
    status, body = http_request(build_url())
    return parse_availability(body)


def send_telegram(text, mock_mode=False):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        if mock_mode:
            log("[dry-run] 텔레그램 토큰 없음, 전송 생략. 메시지: " + text.replace("\n", " | "))
            return
        raise RuntimeError("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID 환경변수가 없습니다")
    url = "https://api.telegram.org/bot{}/sendMessage".format(token)
    data = urllib.parse.urlencode({"chat_id": chat_id, "text": text}).encode()
    try:
        http_request(url, data=data)
    except HttpError as e:
        raise RuntimeError("텔레그램 전송 실패 (status={})".format(e.status))
    log("텔레그램 전송 완료")


def load_state(path):
    try:
        with open(path, encoding="utf-8") as f:
            s = json.load(f)
        if not isinstance(s, dict):
            raise ValueError("상태 파일이 객체가 아님")
        return {
            "available": s["available"] if isinstance(s.get("available"), bool) else None,
            "fail_count": int(s.get("fail_count", 0)),
            "alerted_fail": bool(s.get("alerted_fail", False)),
        }
    except FileNotFoundError:
        return dict(DEFAULT_STATE)
    except (ValueError, TypeError, OSError) as e:
        log("상태 파일 읽기 실패, 초기화: {}".format(type(e).__name__))
        return dict(DEFAULT_STATE)


def save_state(path, state):
    d = os.path.dirname(path)
    if d:
        os.makedirs(d, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f)


def run_verify():
    for inc in (True, False):
        url = build_url(inc)
        print("--- dateType {} ---".format("포함" if inc else "생략"))
        print("URL:", url)
        try:
            status, body = http_request(url, retries=1)
            print("status:", status)
            print("body[:500]:", body[:500])
        except HttpError as e:
            print("실패:", e, "(status={})".format(e.status))
    return 0


def run_monitor(state_path, mock):
    mock_mode = mock is not None
    state = load_state(state_path)
    prev = state["available"]
    log("이전 상태: {}".format(state))

    try:
        available = fetch_available(mock)
        error = None
    except (HttpError, ValueError) as e:
        available, error = None, e

    if error is not None:
        state["fail_count"] += 1
        log("경고: 조회 실패 {}회 연속 - {}".format(state["fail_count"], error))
        if state["fail_count"] >= FAIL_ALERT_THRESHOLD and not state["alerted_fail"]:
            send_telegram("[모니터링 이상] {}회 연속 조회 실패 ({}). 사이트/API 변경 여부를 확인하세요.".format(
                state["fail_count"], TARGET_LABEL), mock_mode)
            state["alerted_fail"] = True
        save_state(state_path, state)
        return 0

    # 성공 조회: 실패 상태 복구 처리
    if state["alerted_fail"]:
        send_telegram("[모니터링 복구] 조회가 정상으로 돌아왔습니다 ({}).".format(TARGET_LABEL), mock_mode)
    state["fail_count"] = 0
    state["alerted_fail"] = False

    log("현재: {}".format("예약 가능" if available else "마감"))
    if available and prev is not True:
        send_telegram("[예약 가능] {} 자리가 열렸습니다!\n{}".format(TARGET_LABEL, BOOKING_URL), mock_mode)
    elif available:
        log("가능 상태 유지, 알림 없음")
    elif prev is True:
        log("가능 -> 마감 복귀, 상태만 갱신")

    state["available"] = available
    save_state(state_path, state)
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--verify", action="store_true", help="원문 응답 확인 (알림/상태 변경 없음)")
    ap.add_argument("--test-notify", action="store_true", help="테스트 메시지 1회 전송")
    ap.add_argument("--mock-response", choices=["true", "false"], help="네트워크 없이 모의 응답 사용")
    args = ap.parse_args()

    try:
        if args.verify:
            return run_verify()
        if args.test_notify:
            send_telegram("[테스트] 주차대행 모니터링 알림 테스트입니다.")
            return 0
        mock = None if args.mock_response is None else args.mock_response == "true"
        state_path = os.environ.get("STATE_FILE", DEFAULT_STATE_FILE)
        if DATE_OVERRIDE:
            state_path = os.path.join(os.path.dirname(state_path), "test-{}.json".format(DATE_OVERRIDE))
        return run_monitor(state_path, mock)
    except RuntimeError as e:
        log("오류: {}".format(e))
        return 1


if __name__ == "__main__":
    sys.exit(main())
