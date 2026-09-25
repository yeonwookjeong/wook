# 나의 조정 — 사주 인사발령

생년월일을 넣으면 왕으로 즉위해 **내가 어떤 왕인지(왕 유형 10종 + 실록 속 같은 사주의 왕)**를 먼저 보고, 초대 링크로 들어온 친구들이 사주 궁합에 따라 영의정부터 간신·유배까지 관직을 받는 바이럴 웹.

## 실행

```bash
cd jojeong
npm install
npm run dev        # http://localhost:3000
```

로컬에서는 데이터가 `.data/db.json`에 저장됩니다(별도 DB 불필요).

## 배포 (Vercel)

1. Vercel에서 이 저장소를 Import → **Root Directory를 `jojeong`**으로 지정
2. Storage 탭 → Marketplace에서 **Upstash Redis**(무료 플랜) 추가 → 프로젝트에 연결
   - `KV_REST_API_URL` / `KV_REST_API_TOKEN` 또는 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`이 자동 주입됩니다. 둘 다 인식합니다.
3. 커스텀 도메인을 붙이면 환경변수 `NEXT_PUBLIC_SITE_URL=https://도메인` 추가 (카톡 미리보기 이미지 주소에 쓰임)

Redis 환경변수 없이 Vercel에 배포하면 즉위 시 오류가 나도록 되어 있습니다(서버리스는 파일 저장이 안 되기 때문).

## 구조

| 경로 | 내용 |
|---|---|
| `/` | 즉위 (왕 생성) |
| `/court/[id]` | 조정. 왕에게는 신하 목록·초대 버튼·파직(신하 삭제) 버튼, 처음 온 사람에게는 입궐 폼 |
| `/court/[id]/m/[mid]` | 신하 한 명의 교지 + 밀지(사주 풀이) |
| `/court/[id]/opengraph-image` | 카톡 초대 미리보기 (1200×630) |
| `/court/[id]/m/[mid]/opengraph-image` | 결과 링크 미리보기 (1200×630) |
| `/court/[id]/king` | 즉위 교서(왕 유형) 스토리 이미지 (1080×1920) |
| `/court/[id]/gyoji` | 조정도 스토리 이미지 (1080×1920) |
| `/court/[id]/m/[mid]/card` | 개인 교지 스토리 이미지 (1080×1920) |

- `lib/saju.ts`: 만세력 계산(`lunar-javascript`, 입춘 기준) → 일간 오행 생극 + 천간합·육합·반합·충·원진·띠·시지로 점수와 관직 결정
- `lib/roles.ts`: 관직별 카피(명과학 훈도 서운 말투). 문구 수정은 여기서
- `lib/pairs.ts`: 신하끼리 궁합(양방향 점수 평균). 조정 화면에 천생연분·앙숙 1쌍씩 무료 노출
- `lib/kingTypes.ts`: 일간별 왕 유형 10종 카피 (성격 해석, 실존 왕 이름은 넣지 않음)
- `lib/kings.ts`: 조선 27왕의 실록 음력 탄일 → 일주 계산. 사용자와 일주가 같으면 그 왕들, 없으면 같은 일간의 왕, 그것도 없으면(경금) "조선 최초의 경금 군주"
  - 탄일은 위키백과·우리역사넷 등에서 수집해 양력 환산일과 대조함. 1582년 이전 날짜는 출처별로 율리우스력/그레고리력 표기가 달라 8~10일 차이가 나는 것이 정상
  - 27왕 일간 분포: 신금 6, 정화 6, 기토 5, 계수 3, 갑목 2, 무토 2, 을목·병화·임수 각 1, 경금 0. 일주 기준으로는 60개 중 22개가 왕과 겹침
- `lib/court.ts`: 조정 서열 정렬, 영의정은 조정 내 최고점 신하에게 동적으로 부여(새 신하가 오면 뺏길 수 있음)
- 생년월일 원문은 저장하지 않고, 계산된 일주·띠·시지만 저장

랜덤 2만 쌍 기준 관직 분포: 예조·병조 각 17%, 간신 14%, 호조·좌의정 각 14%, 대제학 13%, 유배 6%, 대사헌 5%.

공유 이미지 폰트 `assets/fonts/NanumMyeongjo-*.ttf`는 SIL Open Font License 1.1 폰트(나눔명조, Google Fonts 배포본)입니다.

## 유료 상품 (결제 연동 예정)

| 상품 | 구매자 | 내용 |
|---|---|---|
| 관상감 밀계 | 왕 | 신하 한 명 상세 궁합 (우정·일·돈·연애, 2026년 흐름, 다루는 법) |
| 전하께 올라간 밀계 엿보기 | 신하 | 왕이 나에 대해 받은 보고 + 이 왕을 다루는 법 |
| 전하의 명과 | 왕 | 본인 사주팔자 전체 풀이, 2026 병오년 운세 |
| 어전회의 | 왕·신하 | 신하끼리 전체 조합표, 파벌, 조합별 풀이 |

가격: 전 상품 990원. **복채 단골 할인**으로 결제할 때마다 100원씩 내려가 990 → 890 → 790 → **690원(최저, 4회차부터 고정)**. 결제 횟수는 브라우저 쿠키로 추적(쿠키를 지우면 990원으로 돌아갈 뿐이라 악용 여지 없음). 결제 버튼에 실제 결제 금액과 할인액을 미리 표시.

## 캐릭터: 관상감 명과학 훈도 서운

- 관상감 명과학은 조선 왕실의 궁합 심사·택일·왕실 자녀 사주 기록을 맡은 실제 부서. 명과학 훈도는 경국대전상 정9품 관직
- 이름 "서운"은 관상감의 옛 이름 서운관(書雲觀)에서 따옴. "서운하다" 말장난에 활용
- 설정: 품계는 말단 정9품이지만 사주 보는 눈은 조선 제일. 왕에게도 할 말은 하는 젊은 관원. 관직은 서운이 "천거"하고 왕이 내리는 구조

지금은 `public/seoun.svg` 임시 캐릭터입니다. 아래 프롬프트로 이미지를 만든 뒤:

1. 배경 투명 PNG(정사각, 512px 이상)로 `public/seoun.png`에 저장
2. `lib/brand.ts`의 `CHARACTER_IMAGE`를 `"/seoun.png"`로 변경

**프롬프트 (Midjourney / ChatGPT 이미지 / Gemini 공용, 영어가 결과가 안정적)**

```
Cute chibi character of a young Joseon-dynasty royal astrologer official
(Gwansanggam fortune-reading scholar), upper body, confident sly smile with one eyebrow raised,
black traditional gauze hat (samo) with side wings, green low-rank official robe with white collar,
a small golden star emblem on the chest, holding a rolled star-chart scroll,
flat vector illustration, soft pastel shading, thick clean outlines, Korean webtoon style,
transparent background, centered, square composition --ar 1:1
```

변형 표정(선택): 간신 결과용 `sighing with a disappointed look, "I'm so let down" expression`, 영의정 결과용 `bowing with a proud grin`.
