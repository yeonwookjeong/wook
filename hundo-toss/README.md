# 훈도사주 앱인토스 미니앱

토스 앱 안에서 돌아가는 훈도사주입니다. 무료 화면은 휴대폰에서 계산하고(AI 비용 없음), 유료 보고서는 사이트(`../jojeong`) 서버가 씁니다.

| 화면 | 내용 | 돈이 되는 곳 |
| --- | --- | --- |
| 생일 입력 | 사이트와 같은 규칙으로 사주 계산 (`jojeong/lib/personForm.ts`) | — |
| 오늘 | 점수·가장 좋은 쪽은 무료, 자세한 풀이는 보상형 광고 1회로 그날 내내 열림 | 인앱 광고 |
| 신년운세 | 판정·달마다 흐름·짚어 볼 것 (무료, 계산만) | 보고서로 연결 |
| 보고서 | 신년운세 / 평생 사주 / 새해 준비 세트 | 인앱 결제 |
| 내 보고서 | 이 휴대폰과 이 토스 계정으로 산 보고서 | — |

## 구조

```text
hundo-toss (정적 웹 번들, 토스 WebView)
  ├ @/lib/*  ← ../jojeong/lib 계산 코드를 그대로 가져다 씀
  ├ 결제: IAP.createOneTimePurchaseOrder → processProductGrant
  │        └ POST {사이트}/api/toss/grant  (토스에 주문 확인 → 사이트 주문 생성, 같은 주문은 한 번만)
  ├ 보고서: POST {사이트}/api/toss/report  (사이트 /api/report와 같은 코드)
  └ 내 보고서: GET {사이트}/api/toss/orders?key=<토스 익명 키>
```

결제는 됐는데 보고서를 못 연 주문(앱 종료, 서버 오류)은 다음에 앱을 열 때 `IAP.getPendingOrders`로 찾아 자동으로 엽니다.

## 개발

```bash
npm install
cp .env.example .env.local   # VITE_HUNDO_API를 사이트 주소로
npm run dev                  # 브라우저에서 SDK는 개발 도구(mock)로 동작
npm run typecheck
```

로컬에서 결제 흐름까지 보려면 사이트를 `PAY_MOCK=1`로 띄우고 `VITE_HUNDO_API=http://localhost:3000`으로 맞춥니다. `PAY_MOCK`은 운영 배포에서는 절대 켜지지 않습니다.

## 출시 전에 할 일

1. **앱인토스 콘솔**
   - 미니앱 이름을 `apps-in-toss.config.ts`의 `appName`(`hundo-saju`)과 맞춥니다.
   - 인앱 결제 상품 3개를 등록하고 노출을 켭니다. sku는 반드시 아래와 같아야 합니다.
     | sku | 상품 | 권장 가격 (사이트 A안) |
     | --- | --- | --- |
     | `hundo_yeonun` | 신년운세 | 1,900원 |
     | `hundo_pyeongsaeng` | 평생 사주 | 2,900원 |
     | `hundo_ny_set` | 새해 준비 세트 (평생 + 신년운세 + 재물) | 3,900원 |
   - 인앱 광고를 신청하고 보상형 광고 그룹 ID를 받아 `VITE_AD_REWARDED`에 넣습니다.
   - mTLS 인증서와 키를 발급받습니다.
2. **사이트(Vercel) 환경 변수**
   - `TOSS_AIT_CERT`, `TOSS_AIT_KEY`: 위 인증서와 키 (PEM 그대로, 또는 base64 한 줄).
   - 없으면 어떤 결제도 확인할 수 없어서 보고서가 열리지 않습니다(결제는 미결 주문으로 남았다가, 넣은 뒤 다음 방문 때 열림).
3. **샌드박스에서 첫 결제를 해 보고 주문 상태 응답을 확인**
   - 토스 주문 상태 조회 API의 응답 형식은 공식 예제만으로 확정하지 못했습니다. `jojeong/lib/tossApps.ts`는 `PAYMENT_COMPLETED`, `PURCHASED`, `COMPLETED`, `PAID`, `DONE`, `SUCCESS` 중 하나일 때만 지급합니다.
   - 다른 값이 오면 지급을 거절하고 Vercel 로그에 `toss order not paid`와 응답 원문을 남깁니다. 그 값을 보고 목록을 맞춥니다.
4. **빌드와 배포**
   ```bash
   npm run build    # tsc + vite build + ait build
   npm run deploy   # 콘솔 API 키 필요
   ```

## 알아 둘 점

- 무료 화면은 사이트의 `jojeong/lib` 계산 코드를 그대로 씁니다. 사이트 계산을 바꾸면 미니앱도 다시 빌드해야 같은 결과가 나옵니다.
- 보고서는 사이트에서 산 것과 똑같이 저장되고(관리자 대시보드에 "토스 미니앱" 경로로 표시), 같은 주문 번호로 사이트의 `/r/…` 링크에서도 열립니다.
- 매일 운세 푸시는 앱인토스 정책상 기능성 메시지로 보내기 어려워 넣지 않았습니다. 재방문은 "오늘" 탭(하루 한 번 광고로 여는 풀이)이 맡습니다.
