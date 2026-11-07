# 내 사주 동네 (앱인토스 미니앱)

생일 하나와 사는 시군구로, 전국 시군구가 내 사주에 얼마나 맞는지 지도로 보여 주는 무료 미니앱입니다. 계산은 모두 휴대폰에서 하고(사이트 엔진 `../jojeong/lib` 그대로), 서버로 보내는 것은 없습니다.

| 화면 | 내용 | 공유 |
| --- | --- | --- |
| 내 운명의 동네 1위 | 시도마다 한 곳씩 뽑은 TOP5와 한 줄 이유 | 카드 A "너는 어디야?" |
| 동네 성적표 | 지도를 눌러 그 동네의 순위(N곳 중 M위), 지명 한자 풀이 | 카드 B "너희 동네는 몇 위야?" |
| 우리 둘의 동네 | 링크를 받은 사람이 생일을 넣으면 둘 다 좋은 동네 | 카드 C "너랑 나는 어디서 살까?" |

## 점수

- 방향 60%: 지금 사는 곳에서 본 방향의 오행(북 수, 북동 토, 동 목, 남동 목, 남 화, 남서 토, 서 금, 북서 금). 거리는 보지 않는다. 바로 옆(0.06도 안)은 방향이 없어 순위에서 뺀다.
- 이름 40%: 지명 한자의 자원오행(`jojeong/lib/naming/hanja.tsv`). 오행이 드러나지 않는 이름(中, 光 등)은 방향만 본다. 256곳 중 156곳에 있다.
- 무엇이 필요한지는 사이트와 같은 `readChart`(용신, 희신, 기신).

## 데이터

- `src/data/regions.json`: `python3 -I scripts/regions2026.py <HangJeongDong_ver20261001.geojson>` (vuski/admdongkor, 2026-10-01 행정동 → 시군구 256곳).
- `src/data/names.json`: `npm run data`. `scripts/placehanja.txt`는 사람이 적은 지명 한자 표라, 돌릴 때마다 인명용 한자 표의 음과 한 글자씩 맞춰 보고 틀리면 멈춘다.
- 행정구역이 바뀌면 두 스크립트를 다시 돌리고 `placehanja.txt`에 새 시군구를 더한다.

## 둘의 동네 링크

`intoss://hundo-dongne?with=<토큰>`. 토큰에는 이름, 사주 여덟 글자, 사는 시군구 코드만 든다(생일과 주소는 없음).

## 개발

```bash
ln -s ../hundo-toss/node_modules node_modules   # 또는 npm install
npm run dev
npm run typecheck
```

## 출시 전에 할 일

1. 앱인토스 콘솔에 미니앱 "내 사주 동네"를 만들고 이름을 `apps-in-toss.config.ts`의 `appName`(`hundo-dongne`)과 맞춘다.
2. 카드 저장(`File.saveBase64`)과 공유 링크를 토스 앱 샌드박스에서 확인한다.
3. `npm run build`, `npm run deploy`.
