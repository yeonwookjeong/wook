# youth-hub (임시 이름: 오픈런)

공모전 · 여행 지원금 · 채용 공고를 마감 순으로 골라 보여주는 청년 기회 모음 사이트.
Astro 정적 사이트 → Cloudflare Pages 배포, 공고는 GitHub Actions가 4시간마다 수집.

## 실행

```bash
cd youth-hub
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ 에 정적 파일 생성
```

## 구조

| 위치 | 내용 |
|---|---|
| `src/site.config.ts` | **브랜드명, 도메인, 애드센스·GA4 ID, 광고 간격** — 이름이 정해지면 여기만 바꾸면 됨 |
| `src/data/items.json` | 사람이 쓴 카드 + 화면 확인용 예시 카드(`sample: true`, 실제 데이터가 들어오면 삭제) |
| `src/data/collected/*.json` | 수집 스크립트가 쓰는 카드 (같은 id면 `items.json`이 우선) |
| `src/lib/items.ts` | 카드 형식(Item), D-day, 추천 점수 |
| `src/content/guides/*.md` | 직접 쓴 가이드 글 (애드센스 승인·검색 유입 담당). `draft: true`면 공개 안 됨 |
| `src/pages/` | 메인, `/contest` `/travel` `/job` 탭, `/guide`, 소개·개인정보처리방침·문의 |
| `scripts/collect.mjs` | 공공 API 수집 (`DATA_GO_KR_KEY` 필요) |
| `ci/collect.yml` | 새 저장소로 옮길 때 `.github/workflows/`에 넣을 수집 자동화 |

## 링크로 바로 걸러진 화면 열기 (스레드용)

- `/contest?q=숏폼` → '숏폼'으로 검색된 공모전
- `/travel?region=전남` → 전남 여행 지원금
- 계정별 유입 구분: `?utm_source=threads&utm_medium=social&utm_campaign=contest`

## 애드센스 켜기

승인 후 `src/site.config.ts`의 `adsenseClient`, `adsenseSlot`을 채우면 카드 6개마다 광고가 들어감.
값이 비어 있으면 광고 코드는 출력되지 않음.

## 운영 규칙

- 공고마다 글을 만들지 않는다. 공고는 카드로만, 글은 사람이 쓴 가이드만.
- 카드의 💡 한 줄(`hook`)과 `updated`는 사람이 원문을 확인하고 적는다.
- 금액·자격·일정은 원문 링크와 확인일을 항상 함께 보여준다.
