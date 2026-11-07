#!/bin/bash
# 위키문헌 한 쪽의 원문을 action=raw로 받아 파일 끝에 붙인다. 사용: raw.sh <제목> <출력>
t="$1"; out="$2"
grep -qF "####### $t" "$out" 2>/dev/null && exit 0
enc=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$t")
for i in 1 2 3 4; do
  body=$(curl -s --max-time 30 -A "hundo-research/1.0 (classics reading)" -w "\n%{http_code}" "https://zh.wikisource.org/w/index.php?title=$enc&action=raw")
  code=${body##*$'\n'}; body=${body%$'\n'*}
  if [ "$code" = 200 ]; then printf "\n\n####### %s\n%s" "$t" "$body" >> "$out"; sleep 2; exit 0; fi
  sleep $((i*10))
done
echo "FAIL $t ($code)"
