#!/bin/bash
# 사용: bash domcheck.sh 도메인... → 000이면 막힘
for d in "$@"; do c=$(curl -s -o /dev/null -w '%{http_code}' -m 12 "https://$d/"); echo "$c $d"; done
