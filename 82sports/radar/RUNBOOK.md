# +82 SPORTS 글감 레이더 작업 지침

하루 두 번(한국시간 07:40, 19:40) 자동 실행. 목표는 데스크 '소식' 칸에 오늘 쓸 만한 글감을 출처와 함께 올려 두는 것.

## 1. 스캔
```bash
git fetch origin claude/pensive-johnson-18uiis && git checkout claude/pensive-johnson-18uiis
cd 82sports/radar && python3 -I radar.py 14 out
```
- 결과: `out/radar.md`(사람용), `out/radar.json`
- 7~8분 걸린다. 오류가 많으면(50건 이상) 네트워크 문제이니 한 번만 다시 돌린다.

## 2. 고르기 (최대 12건)
- 기사 수가 많고 최근인 선수부터 본다.
- 동명이인·다른 종목 기사는 버린다 (제목과 팀·리그로 확인).
- 같은 일을 다룬 기사는 하나로 묶는다.
- 제외 선수: 황희찬, 양민혁, 박승수.
- 국내 무대 소식은 제외 (예: KPGA·KLPGA 국내 투어, K리그). 해외 리그·해외 투어·국제대회(국내 개최 국제대회 포함) 소식만 고른다.
- 글 종류 판단:
  - 골·우승·메달·이적·부상·대표 발탁·기록 → 단신
  - 경기 결과와 현지 반응이 함께 있으면 → 리포트
  - 출전·결장·교체 같은 작은 소식 → 오늘의 해외파 모음

## 3. 확인 (고른 것마다)
- 네이버 기사만 믿지 말고 원문 출처를 하나 이상 연다 (구단·리그 공식, MLB/MiLB, FotMob, Flashscore, 현지 언론).
- 확인 못 하면 메모에 "원문 미확인"이라고 적는다. 지어내지 않는다.

## 4. 데스크에 올리기
- 데스크: https://claude.ai/artifact/VHWhpVw9nCZpnKNjbP5Rmq (컬렉션 `items`)
- 먼저 `items`를 읽어 같은 선수·같은 소식 카드가 이미 있으면 새로 만들지 않는다.
- 새 카드 필드:
  - `athlete`, `category`(종목: 축구·야구·골프·빙상 등 한 단어), `sport`(대회·리그)
  - `title`: 비워 두거나 제목 초안
  - `stage`: "radar", `type`: "report"|"brief"|"roundup", `qa`: null
  - `channels`: {"blog": true, "insta": false, "short": false}
  - `source`: 가장 믿을 만한 원문 링크
  - `note`: 무슨 일인지 한두 문장 + 우리 각도 제안 + "레이더 07:40" 같은 표시 + 네이버 기사 링크
  - `plannedAt`, `publishedAt`: null
  - `createdAt`, `updatedAt`: 지금 시각 ISO
- 문서 id: `radar-YYYYMMDD-HHMM-선수로마자` 처럼 겹치지 않게.

## 5. 데스크에 못 쓰면
- `out/radar.md` 맨 위에 고른 글감 요약을 붙여 `82sports/radar/reports/YYYY-MM-DD-am|pm.md`로 커밋·푸시한다 (브랜치 claude/pensive-johnson-18uiis).

## 6. 마무리 보고
- 한국어 3~5줄: 올린 카드 수, 가장 큰 소식 1~2개, 확인 못 한 것.
- 구호·홍보 문구 쓰지 않는다. 사용자 이메일 등 개인정보를 외부로 보내지 않는다.
