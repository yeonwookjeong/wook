#!/bin/bash
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null; then
  echo "파이썬이 없습니다. https://www.python.org/downloads/ 에서 설치하세요."
  read -r -p "Enter를 누르면 닫힙니다"
  exit 1
fi

echo "준비 중... (처음엔 1분 정도 걸려요)"
python3 -m pip install -q -U yt-dlp 2>/dev/null || python3 -m pip install -q -U --user yt-dlp

while true; do
  echo
  read -r -p "유튜브 링크 붙여넣고 Enter (끝내려면 그냥 Enter): " URL
  [ -z "$URL" ] && break
  python3 scan.py "$URL"
  open out
done
