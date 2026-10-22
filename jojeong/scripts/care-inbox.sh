#!/usr/bin/env bash
# 배 객주(care) 댓글 확인용: 훈도사주 팀 inbox 를 읽어 /tmp/inbox.json 에 저장한다.
# 토큰은 헤더로만 쓰고 절대 출력하지 않는다. 출력은 응답 코드와 개수 요약뿐.
# 사용: bash jojeong/scripts/care-inbox.sh [since-ISO] [limit]
set -u

since="${1:-}"
limit="${2:-100}"
out=/tmp/inbox.json

# since 는 ISO 시각만 허용 (URL 조작 방지)
if [ -n "$since" ] && ! [[ "$since" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?Z$ ]]; then
  echo "since 형식 오류(예: 2026-10-22T07:00:00Z)"; exit 2
fi
[[ "$limit" =~ ^[0-9]{1,3}$ ]] || { echo "limit 형식 오류"; exit 2; }
[ -n "${TEAM_READ_TOKEN:-}" ] || { echo "code=no-token"; exit 3; }

url="https://www.hundosaju.com/api/team/inbox?limit=${limit}"
[ -n "$since" ] && url="${url}&since=${since}"

code=$(curl -s -m 30 -o "$out" -w '%{http_code}' \
  -H @<(printf 'Authorization: Bearer %s\n' "$TEAM_READ_TOKEN") "$url")
echo "code=$code"
[ "$code" = 200 ] || exit 1

python3 -I - "$out" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
r = d.get("threadsReplies")
print("replies", len(r) if isinstance(r, list) else r)
print("status", json.dumps(d.get("threadsRepliesStatus"), ensure_ascii=False)[:400])
PY
