# 나의 조정 — 사주 인사발령

생년월일을 넣으면 왕으로 즉위하고, 초대 링크로 들어온 친구들이 사주 궁합에 따라 영의정부터 간신·유배까지 관직을 받는 바이럴 웹.

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
| `/court/[id]` | 조정. 왕에게는 신하 목록·초대 버튼, 처음 온 사람에게는 입궐 폼 |
| `/court/[id]/m/[mid]` | 신하 한 명의 교지 + 밀지(사주 풀이) |
| `/court/[id]/opengraph-image` | 카톡 초대 미리보기 (1200×630) |
| `/court/[id]/m/[mid]/opengraph-image` | 결과 링크 미리보기 (1200×630) |
| `/court/[id]/gyoji` | 조정도 스토리 이미지 (1080×1920) |
| `/court/[id]/m/[mid]/card` | 개인 교지 스토리 이미지 (1080×1920) |

- `lib/saju.ts`: 만세력 계산(`lunar-javascript`, 입춘 기준) → 일간 오행 생극 + 천간합·육합·반합·충·원진·띠·시지로 점수와 관직 결정
- `lib/roles.ts`: 관직별 카피(상선 복길 말투). 문구 수정은 여기서
- `lib/court.ts`: 조정 서열 정렬, 영의정은 조정 내 최고점 신하에게 동적으로 부여(새 신하가 오면 뺏길 수 있음)
- 생년월일 원문은 저장하지 않고, 계산된 일주·띠·시지만 저장

랜덤 2만 쌍 기준 관직 분포: 예조·병조 각 17%, 간신 14%, 호조·좌의정 각 14%, 대제학 13%, 유배 6%, 대사헌 5%.

공유 이미지 폰트 `assets/fonts/NanumMyeongjo-*.ttf`는 SIL Open Font License 1.1 폰트(나눔명조, Google Fonts 배포본)입니다.

## 캐릭터(상선 복길) AI 이미지로 교체

지금은 `public/naegwan.svg` 임시 캐릭터입니다. 아래 프롬프트로 이미지를 만든 뒤:

1. 배경 투명 PNG(정사각, 512px 이상)로 `public/naegwan.png`에 저장
2. `lib/brand.ts`의 `CHARACTER_IMAGE`를 `"/naegwan.png"`로 변경

**프롬프트 (Midjourney / ChatGPT 이미지 / Gemini 공용, 영어가 결과가 안정적)**

```
Cute chibi character of a Joseon-dynasty royal eunuch (sangseon naegwan), upper body,
round face with sly half-closed smiling eyes and rosy cheeks, black traditional gauze hat
(samo) with side wings, deep red official robe with white collar, holding a small scroll,
flat vector illustration, soft pastel shading, thick clean outlines, Korean webtoon style,
transparent background, centered, square composition --ar 1:1
```

변형 표정(선택): 간신 결과용 `shocked face, sweating, whispering behind hand`, 영의정 결과용 `bowing deeply, proud smile`.
