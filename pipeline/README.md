# 콘텐츠 파이프라인

6개 채널을 1인이 돌리기 위한 운영 시스템.

## 지금 켜져 있는 범위

**리서치(소재 발굴)만 자동으로 돈다.** 글쓰기는 네이버 블로그 하나만 대상이고,
여행 메모가 입력이라 수동으로 실행한다.

| 단계 | 상태 | 대상 |
|---|---|---|
| 리서치 · 소재 뱅크 | **켜짐** — 주 1회 자동 | Toryvel · 할거없나 |
| 글쓰기 (초안 생성) | 수동 실행 | 네이버 블로그만 |
| 이미지 렌더 · 발행 | **보류** — 코드는 있고 스케줄만 꺼둠 | 인스타 · 스레드 |
| 성과 수집 | **보류** — 발행분이 쌓이면 켠다 | 전 채널 |

보류 중인 워크플로는 지운 게 아니라 `schedule` 만 주석 처리했다.
발행을 시작할 때 주석을 풀면 된다.

## 채널 트랙

| 트랙 | 채널 | 파이프라인이 하는 일 |
|---|---|---|
| **auto** | Toryvel · 할거없나 · 네이버 블로그 | 리서치 기반이라 전 구간 자동화가 가능한 채널 |
| **assist** | 만타 · Woogi Jeong · 일본어 스레드 | 촬영본이 있어야 하므로 소재·기획까지만 |

일본어 스레드는 `automation: none`. 실시간성이 이 채널의 신뢰도라서 자동 발행 대상이 아니고,
파이프라인은 다른 채널에서 나온 일본 관련 소재를 교차 공유 후보로 표시만 한다.

---

## 빠른 시작

```bash
cd pipeline
npm install
cp .env.example .env          # ANTHROPIC_API_KEY 만 있으면 초안까지 가능
npx playwright install chromium

npm run pipe -- status                          # 현황
npm run pipe -- ideas:list                      # 소재 뱅크 보기
npm run pipe -- ideas --channel toryvel -n 6    # 소재 뱅크 채우기 (웹 검색 사용)

# 네이버 블로그 글쓰기 — 여행 메모가 입력이다
cp notes/TEMPLATE.md notes/2026-09-14-강릉.md
npm run pipe -- draft --channel naver --notes notes/2026-09-14-강릉.md
npm run pipe -- naver:login                     # 최초 1회
npm run pipe -- naver:draft --id <content-id>   # 네이버에 임시저장
```

발행(인스타/스레드)을 켤 때는 `render → approve → publish` 가 이어진다. README 아래쪽 참고.

## 흐름

```
ideas ─→ data/ideas.json (소재 뱅크)
  │
  └─ draft ─→ content/<채널>/<id>.md   frontmatter = 메타, 본문 = 캡션
                │
                ├─ render ─→ rendered/<id>/01.png …
                │
                └─ publish ─→ 인스타 / 스레드 / (네이버는 로컬 브라우저)
                                │
                                └─ insights ─→ data/insights.json
                                                 │
                                                 └─ 다음 ideas·draft 프롬프트에 주입
```

마지막 화살표가 핵심이다. 성과 데이터가 다음 생성의 입력으로 돌아가므로,
"서사형이 정보형보다 4배 먹혔다" 같은 사실을 시스템이 기억한다.

## 승인 = PR 머지

`pipeline · 리서치` 워크플로가 주 1회 소재를 뽑아 PR 을 연다.
발행 단계를 켜면 같은 방식으로 초안과 이미지도 PR 로 올라온다.
폰에서 PR 을 읽고 머지하면 끝이다. 머지된 콘텐츠는 각자의 `publishAt` 에 자동으로 올라간다.
내리고 싶으면 파일을 지우거나 `publishAt` 을 비우고 머지한다.

발행 워크플로가 `--include-drafts` 로 도는 이유가 이것이다. 기본 브랜치에 있는 초안은
PR 을 통과한 것이므로 승인된 것과 같다. 로컬에서는 `approve` 로 명시적으로 올린다.

## 채널 설정

`channels/<id>.yaml` 이 그 채널의 전부다 — 톤, 금지 표현, 포맷 구조, 발행 슬롯, 테마 색.
`prompts/<id>.md` 는 그 위에 얹는 시스템 프롬프트다. 둘 다 Git 에 있으므로
"지난주 프롬프트가 더 나았는데" 를 `git diff` 로 되돌릴 수 있다.

톤을 고치고 싶으면 코드가 아니라 이 두 파일을 고친다.

## 채널별 자동화 한계 (2026-09 확인)

| 채널 | 발행 | 근거 |
|---|---|---|
| 인스타 | 완전 자동 | Content Publishing API. 본인 계정만 쓰면 앱 심사 불필요 — Meta 앱을 development 모드에 두고 계정을 Instagram Tester 로 추가. 24시간 100건, **캐러셀 API 상한 10장**(앱 내 20장과 다름) |
| Threads | 조건부 | 24시간 250건. 프로덕션 접근에 Tech Provider 검증이 걸릴 수 있어 본인 계정 dev 모드로 먼저 검증 필요 |
| 네이버 블로그 | 반자동 | 글쓰기 오픈API 종료됨. 브라우저 자동화로 **임시저장까지만** 하고 발행 버튼은 사람이 누른다. `local_only: true` — CI 에서 실행하면 거부한다 |
| 일본어 스레드 | 없음 | 의도적 제외 |

### 인스타 이미지가 공개 URL 이어야 하는 문제

Meta 서버가 `image_url` 을 직접 내려받기 때문에 로컬 파일로는 안 된다.
`rendered/` 폴더를 공개된 곳에 올리고 `PUBLIC_ASSET_BASE_URL` 을 그 주소로 맞춘다.
레포가 공개면 GitHub Pages 나 raw URL 로 충분하다. 비공개라면 R2/S3 같은 별도 호스팅이 필요하다.

### 네이버 자동화 주의

`src/publish/naver.ts` 상단의 `SELECTORS` 가 네이버 에디터 DOM 에 의존한다.
에디터가 바뀌면 여기만 고치면 된다. 셀렉터가 맞는지 확인할 때는:

```bash
npm run pipe -- naver:login          # 최초 1회, 로그인 세션 저장
npm run pipe -- naver:draft --id <id> --dry   # 저장 직전에 멈춤
```

## GitHub Actions

| 워크플로 | 주기 | 하는 일 |
|---|---|---|
| `pipeline-research` | 월 09:00 KST | 소재 뱅크 보충 → PR |
| `pipeline-report` | 월 09:00 KST | 주간 리포트 이슈 (소재 잔량 경고 포함) |
| `pipeline-publish` | *보류* | 발행 시각 지난 건 업로드 |
| `pipeline-insights` | *보류* | 성과 수집 |

필요한 Secrets 는 `.env.example` 과 같은 이름이다.
`PUBLIC_ASSET_BASE_URL` 과 `GRAPH_API_VERSION` 은 Secrets 가 아니라 Variables 로 넣는다.

## 개발

```bash
npm run typecheck
npx tsx src/__smoke__/smoke.ts      # API 키 없이 스케줄러·렌더러 확인
```
