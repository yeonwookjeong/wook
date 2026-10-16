# 나만아직? — 데이터 파이프라인

과거 발매 가요(2005년~)를 **지금 유튜브·유튜브 뮤직 재생수**로 다시 줄 세웁니다.
집계 기준은 하나: **공식 영상(MV + Topic 오디오) 조회수의 7일 증가분.**

```
① data/songs/<연도>.csv   그해 연간 차트 100곡 (사람이 입력)
② npm run map <연도>      곡 → 유튜브 영상 ID 매핑 (하루 95곡, 1회성)
③ npm run snapshot        매일 조회수 저장 → data/snapshots/YYYY-MM-DD.json
④ npm run rank            7일 증가분 순위 → data/charts/<연도>/latest.md
⑤ npm run race-data 2012  레이스 영상용 데이터 → render/data.json
⑥ npm run render          프레임 렌더 → ffmpeg로 mp4
```
③④는 GitHub Actions(`.github/workflows/namanajik-daily.yml`)가 매일 03:30 KST에 자동 실행하고 결과를 커밋합니다.

## 0. 준비물 (한 번만)
1. **유튜브 Data API 키**: Google Cloud 콘솔 → 새 프로젝트 → `YouTube Data API v3` 사용 설정 → 사용자 인증 정보 → API 키. 키 제한은 "YouTube Data API v3만".
2. 저장소 **Settings → Secrets and variables → Actions** 에 `YOUTUBE_API_KEY` 등록.
3. 로컬에서 돌릴 땐 `namanajik/.env` 에 같은 키 (`.env.example` 참고). `.env`는 커밋되지 않습니다.
4. Node 20 이상. 외부 패키지 설치 없음 (렌더만 playwright 필요).

## 1. 곡 목록 만들기
`data/songs/2012.csv` 처럼 **연도별 파일 하나**. 헤더는 TEMPLATE.csv 그대로.

| 컬럼 | 내용 |
|---|---|
| year | 발매연도 (= 파일명) |
| then_rank | 그해 연간 차트 순위 (멜론 시대별 차트 등) |
| title, artist | 곡명, 가수. 쉼표가 들어가면 큰따옴표로 감싸기 |
| mv_id, topic_id | 비워두면 ②가 채움. 직접 넣어도 됨 (유튜브 URL의 `v=` 뒤 11자) |
| search_done | ②가 처리한 날짜. 비우면 다시 검색함 |
| note | 메모 (리마스터 버전 등) |

원칙: **원곡 발매연도**로 넣습니다. 재발매·리마스터는 원곡 연도 파일에.

## 2. 영상 매핑
```bash
npm run map 2012          # 로컬
# 또는 GitHub Actions → namanajik-daily → Run workflow → map_year 에 2012
```
- 검색 1회 = 100유닛, 하루 무료 쿼터 10,000유닛 → **하루 95곡**. 100곡 연도 하나는 이틀.
- 자동으로 못 고른 곡은 `data/mapping/review-<연도>.csv` 에 후보 5개와 링크가 남습니다. 맞는 ID를 `data/songs/<연도>.csv`에 직접 넣으세요.
- Topic 영상이 없는 곡(음원 유통 안 된 곡)은 MV만으로 집계되거나, 둘 다 없으면 집계에서 빠집니다.

## 3. 매일 수집 & 순위
```bash
npm run daily             # snapshot + rank
```
- 스냅샷은 **절대 덮어쓰지 않고** 날짜별로 쌓입니다. 영상 50개당 1유닛이라 비용은 사실상 0.
- 순위는 7일 전 스냅샷과의 차이. 첫 주는 누적 조회수로 임시 순위.
- **공식 순위는 Top 30**까지만 (`rank.js`의 `RANKED`). 그 아래는 증가분이 작아 노이즈.
- 보류 처리: 조회수가 **감소**했거나(영상 교체/삭제 의심), 지난 주 대비 **8배 넘게 급등**한 곡은 순위에서 빼고 `on_hold`에 넣습니다. 사람이 확인 후 CSV의 ID를 고치면 다음 날 복귀합니다.
- 결과: `data/charts/<연도>/latest.md` (사람용 표), `latest.json` + 날짜별 json (기계용).

## 4. 레이스 영상
```bash
npm run race-data 2012        # 주 1회 간격으로 솎은 차트 → render/data.json
npm i -D playwright && npx playwright install chromium   # 로컬 1회
npm run render                # 18초 24fps 1080x1920 프레임
ffmpeg -framerate 24 -i render/frames/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 20 render/race.mp4
```
디자인은 `render/index.html` 의 CSS 변수(`--acc` 등)만 바꾸면 됩니다.

## 쿼터 요약
| 작업 | 비용 |
|---|---|
| 매일 스냅샷 (영상 4,000개) | 80유닛 |
| 매핑 검색 | 곡당 100유닛, 하루 95곡 |
| 일일 무료 한도 | 10,000유닛 |

프로젝트를 여러 개 만들어 쿼터를 늘리는 건 약관 위반이라 하지 않습니다.
