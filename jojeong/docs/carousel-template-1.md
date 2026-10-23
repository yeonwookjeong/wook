# 도감 캐러셀 디자인 1호

인스타 '60일주 도감' 캐러셀의 첫 번째 확정 틀이다(2026-10-23 대표님 결재: "이걸 캐러셀 디자인 중 하나로 하면 될 듯"). 시안 D → E → F → G를 거쳐 G로 정했다. 장당 1080×1350(4:5), 한 편 3장.

## 지나온 길 (왜 이렇게 생겼나)

- D(10/22): 톤 확정. 남색 밤·한지·금·주홍 인장·세로 제목. "톤은 맞는데 왤케 별로냐."
- E: 사이트 글꼴(함렛·붓 한자), 장당 요소 4개 이하, 여백선 하나. "밀도가 없다."
- F: 공공누리 실물 그림, 고서 괘선·판심, 제목 1.3배. "일월오봉도 넣은 이유는?"
- G: **그림은 그날 일주 글자에서 고른다.** 1장은 지지의 띠 동물, 3장은 그날의 물상(해·물 등). 확정.

## 세 장의 구성

| 장 | 바탕 | 큰 것 하나 | 작은 정보 |
|---|---|---|---|
| 1 표지 | 남색 + 구름 문양 + 이중 금테·모서리 장식 | 그날 첫 줄(질문형 장면, 108px) | 도감 번호(한자), 날짜, 띠 동물 도판 + 인장 + "○는 ○이옵니다", 출처, 訓導 낙관 |
| 2 본문 | 한지 + 먹 번짐 + 고서 광곽(굵은 줄·가는 줄) + 판심 띠 | 일주 비유 제목(108px, 위에 "흔히 이렇게 빗대옵니다") | 두 글자(위 글자 붓, 아래 글자 주홍 인장)와 풀이, 아래 두 줄, 쪽번호 二 |
| 3 저장 카드 | 남색 + 그날 물상 그림(은은하게) | 한지 카드(일주 이름 + 성격·연애·내 사람·조심) | 비유 한 줄, "그대의 일주는 무엇이옵니까?", 정 훈도 그림(작게 한 번), 출처 |

규칙
- 여백: 좌우 96px, 위아래 120px.
- 글자 크기 세 단계: 제목 108 / 본문 38 / 작은 글 22. (카드 일주 이름 88, 끝 질문 52는 예외)
- 글꼴: 함렛(Hahmlet, 제목·본문), Yuji Syuku(붓 한자, 사이트 hanja-brush와 같은 글꼴), 본고딕(작은 글), 본명조(판심 한자). 모두 구글 폰트, 상업 이용 가능.
- 색: 남색 #141f31 계열, 금 #d9b465, 한지 #f3ead8, 먹 #211b17, 주홍 #b3261e.
- 카드 한 줄은 12자 안쪽(넘으면 두 줄로 밀려 겹친다).
- 일간 비유는 단정하지 않는다("흔히 이렇게 빗대옵니다").
- 3장 카드는 2장에 없는 항목만 쓴다(같은 말을 두 번 하지 않는다). 1장 질문과도 겹치지 않게.
- 작품명은 박물관 공식 이름으로 쓴다(별칭 금지). 인스타 캡션에도 한 줄: "그림: 국립중앙박물관 소장, 공공누리 제1유형(출처표시), emuseum.go.kr".

## 그림 고르는 법

1. 1장: 그날 일지(지지)의 띠 동물. 子쥐 丑소 寅호랑이 卯토끼 辰용 巳뱀 午말 未양 申원숭이 酉닭 戌개 亥돼지.
2. 3장: 그날 일주 비유(ILJU_IMAGE, `jojeong/lib/iljuRank.ts`)에 나오는 물상(해·물·바위·나무 등). 맞는 그림이 없으면 비워 둔다(지어 붙이지 않는다).
3. **공공누리 제1유형만** 쓴다(상업 이용·변경 가능, 출처 표시). 표시가 없거나 2~4유형이면 쓰지 않는다.
4. 장마다 출처를 작게 적는다: `작품명(부분) · 소장 기관 · 공공누리 제1유형`.
5. 왕실 상징(일월오봉도 전체 등)은 일주와 무관해 보이니 쓰지 않는다. '관상감 = 왕실 천문 관청' 소개 글에서만.

어디서 받나
- 국립중앙박물관 소장품 검색이 가장 잘 된다. 검색: `https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?searchId=search&schM=collectionList&query=<검색어>`. 상세 페이지의 이미지 주소에서 `/700/` 폴더를 빼면 원본(긴 변 3000px)이 나온다. 상세 페이지에 `opentype01`(공공누리 1유형) 표시가 있는지 확인.
- e뮤지엄(emuseum.go.kr)은 다운로드 버튼(사용 목적 '광고')으로 원본을 주지만, 2026-10-22에는 이미지 서버가 자주 500 오류를 냈다.

## 지금까지 쓴 그림

| 날짜 | 장 | 그림 | 고른 이유 | 소장 | 주소 |
|---|---|---|---|---|---|
| 10/23 경오 | 1장 | 전 윤두서 필 「마도」(부분) | 午 = 말 | 국립중앙박물관 덕수 | https://www.emuseum.go.kr/detail?relicId=PS0100100100500276200000 |
| 10/23 경오 | 3장 | 「일월오봉도」의 붉은 해만 | 午 = 한여름 한낮의 불(해). 병풍 전체는 왕실 상징이라 쓰지 않음 | 국립중앙박물관 본관11615 | https://www.emuseum.go.kr/detail?relicId=PS0100100100101161500000 |
| 10/24 신미 | 1장 | 「양」(羊圖, 부분) | 未 = 양 | 국립중앙박물관 덕수2174 | https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?schM=view&searchId=search&relicId=1125 |
| 10/24 신미 | 3장 | 없음 | 辛(보석)에 맞는 공공누리 그림을 아직 못 찾음 | - | - |
| 10/25 임신 | 1장 | 국보 「백자 철화 포도 원숭이무늬 항아리」(부분) | 申 = 원숭이 (포도 덩굴에 매달린 원숭이) | 국립중앙박물관 본관2029 | https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?schM=view&searchId=search&relicId=355 |
| 10/25 임신 | 3장 | 정선 필 「폭포를 바라보는 선비」(觀瀑圖, 부분) | 壬申 = 바위 사이로 쏟아지는 큰 물 | 국립중앙박물관 본관5074 | https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?schM=view&searchId=search&relicId=6022 |
| 10/26 계유 | 1장 | 전 변상벽 필 「영모도」 중 닭(부분) | 酉 = 닭 | 국립중앙박물관 본관256-2 | https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?schM=view&searchId=search&relicId=125460 |
| 10/26 계유 | 3장 | 강세황 필 「높은 곳에서 낙하하는 폭포」(飛瀑圖, 부분) | 癸 = 맑은 물, 酉 = 가을 바위 → 바위틈 물 | 국립중앙박물관 덕수5322 | https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?schM=view&searchId=search&relicId=8481 |

## 만드는 법

1. 그날 데이터를 JSON 한 칸으로 쓴다(아래 예시). 문구는 검수 통과한 같은 날 스레드 도감에서 가져오고, 새 문구는 강 어사 검수를 받는다.
2. 그림을 내려받아 잘라 `out1/` 폴더에 둔다(`horse.jpg` 같은 이름. HTML이 같은 폴더의 그림을 읽는다). 바탕 질감 `hanji.jpg`·`night.jpg`도 아래 스크립트로 만들어 `out1/`에 두고, 정 훈도 그림 `jojeong/public/hundo-bow.png`도 복사한다.
3. `python3 build-1.py days.json` → `out1/<key>.html`
4. `node render.cjs out1/<key>.html out1/<key>` → `<key>-1.png`~`-3.png` (Playwright, 구글 폰트를 받으므로 인터넷 필요)

### 하루치 데이터 예시 (10/23 경오, 검수 반영본)

```json
{
 "key": "1023-gyeongo",
 "noHan": "七",
 "dateNum": "2026. 10. 23. 金",
 "name": "경오일주",
 "s1": "庚",
 "b2": "午",
 "s1ko": "경",
 "b2ko": "오",
 "animal": "말",
 "question": "아닌 건 아니라고<br>해야 <span style=\"color:var(--gold)\">직성이<br>풀리는 사람</span>",
 "plateImg": "horse.jpg",
 "platePos": "50% 62%",
 "plateLine": "午는 말이옵니다",
 "plateCredit": "전 윤두서 「마도」(부분) · 국립중앙박물관 · 공공누리 제1유형",
 "headline": "불볕에<br>달궈져 날이 서는<br>무쇠",
 "s1word": "무쇠·바위",
 "b2word": "한여름 불볕",
 "body": "결단이 빠르고 원칙이 분명하옵니다.<br><b style=\"font-weight:800\">다만</b> 곧은 말이 오해를 사기도 하지요.",
 "cardBg": "<img src=\"sun.jpg\" class=\"abs\" style=\"left:560px;top:-40px;width:620px;filter:saturate(1.05) brightness(.9);-webkit-mask-image:radial-gradient(circle at 50% 50%,#000 38%,transparent 70%)\">",
 "r1": "아닌 건 아니라고 말함",
 "r2": "밀당 없이 직진",
 "r3": "겉은 단단, 속은 정 많음",
 "r4": "곧은 말이 부르는 오해",
 "image": "한여름 불볕에 달궈지는 무쇠",
 "cardCredit": "해: 일월오봉도(부분) · 국립중앙박물관 · 공공누리 제1유형"
}
```

### 틀 HTML (`template-1.html`)

`{{키}}` 자리에 위 데이터가 들어간다. `question`·`headline`·`body`는 `<br>`·`<span>`이 들어간 HTML이다.

```html
<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Hahmlet:wght@400;600;800;900&family=Noto+Sans+KR:wght@500;700&family=Noto+Serif+KR:wght@600&family=Yuji+Syuku&display=block" rel="stylesheet">
<style>
/* Grid: 96px sides, 120px top/bottom. Type: --t 108 title / --b 38 body / --s 22 small. */
*{margin:0;padding:0;box-sizing:border-box}
:root{--gold:#d9b465;--gold-dim:rgba(217,180,101,.6);--hanji:#f3ead8;--ink:#211b17;--ink-soft:#62564c;--seal:#b3261e;--t:108px;--b:38px;--s:22px}
body{background:#222;display:flex;flex-direction:column;gap:20px}
.slide{width:1080px;height:1350px;position:relative;overflow:hidden;font-family:"Hahmlet",serif;word-break:keep-all}
.night{background:#141f31 url(night.jpg);color:var(--hanji)}
.paper{background:url(hanji.jpg);color:var(--ink)}
.abs{position:absolute}
.small{font-family:"Noto Sans KR",sans-serif;font-size:var(--s);font-weight:700;letter-spacing:.12em}
.brush{font-family:"Yuji Syuku",serif;line-height:1}
.han{font-family:"Noto Serif KR",serif}
.v{writing-mode:vertical-rl}
.seal{background:var(--seal);color:#f6e9d6;display:grid;place-items:center;filter:url(#worn)}
.layer{position:absolute;inset:0;pointer-events:none}
</style></head><body>
<svg width="0" height="0" style="position:absolute"><defs>
<filter id="worn" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" result="d"/>
<feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="4" result="m"/><feColorMatrix in="m" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -10 7.4" result="mask"/><feComposite in="d" in2="mask" operator="in"/></filter>
<filter id="inkbleed"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.5"/></filter>
<filter id="stain"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="4" seed="21"/><feColorMatrix values="0 0 0 0 .13  0 0 0 0 .1  0 0 0 0 .08  0 0 0 -1.6 .95"/><feGaussianBlur stdDeviation="6"/></filter>
<!-- 구름문(운문): 낮은 대비로 까는 문양 -->
<pattern id="cloud" width="180" height="120" patternUnits="userSpaceOnUse"><g fill="none" stroke-width="1.6" stroke-linecap="round">
 <path d="M20 70c0-14 18-18 26-8 4-16 28-16 30 2 10-6 22 2 18 14-2 8-12 10-20 6H34c-10 0-14-6-14-14z"/><path d="M46 62c4 4 10 4 14 0M76 64c2 6 8 8 14 4"/>
 <path d="M110 30c0-10 13-13 19-6 3-11 20-11 21 1 7-4 16 1 13 10-1 6-8 7-14 4h-29c-7 0-10-4-10-9z"/></g></pattern>
<!-- 모서리 장식(회문 갈고리) -->
<g id="corner" fill="none" stroke-width="2"><path d="M0 46V0h46M10 46V10h36M20 30V20h10"/></g>
</defs></svg>

<!-- ───────── 1장 표지: {{b2}} = {{animal}} ───────── -->
<section class="slide night">
  <svg class="layer" width="1080" height="1350"><rect width="1080" height="1350" fill="url(#cloud)" stroke="rgba(217,180,101,.08)"/></svg>
  <svg class="layer" width="1080" height="1350"><g fill="none" stroke="var(--gold)"><rect x="40" y="40" width="1000" height="1270" stroke-width="3" opacity=".85"/><rect x="52" y="52" width="976" height="1246" stroke-width="1" opacity=".6"/></g>
    <g stroke="var(--gold)" opacity=".9"><use href="#corner" transform="translate(64 64)"/><use href="#corner" transform="translate(1016 64) scale(-1 1)"/><use href="#corner" transform="translate(64 1286) scale(1 -1)"/><use href="#corner" transform="translate(1016 1286) scale(-1 -1)"/></g></svg>
  <div class="abs small" style="left:96px;right:96px;top:120px;display:flex;justify-content:space-between;color:var(--gold)"><span>六十日柱 圖鑑 · 第{{noHan}}</span><span>{{dateNum}}</span></div>
  <div class="abs" style="left:96px;right:96px;top:190px">
    <p style="font-size:var(--b);font-weight:600;color:var(--gold)">{{name}} · 오늘 태어난 날의 글자</p>
    <p style="margin-top:20px;font-size:var(--t);font-weight:900;line-height:1.16;letter-spacing:-.03em">{{question}}</p>
  </div>
  <!-- 도판: {{b2}} = {{animal}} -->
  <figure class="abs" style="left:96px;right:96px;top:660px">
    <div style="height:440px;padding:10px;border:1.5px solid var(--gold-dim);background:rgba(243,234,216,.06)"><div style="height:100%;background:url({{plateImg}}) {{platePos}}/cover;box-shadow:inset 0 0 40px rgba(0,0,0,.35)"></div></div>
    <figcaption style="margin-top:16px;display:flex;justify-content:space-between;align-items:center">
      <span style="display:flex;align-items:center;gap:16px"><span class="seal" style="width:56px;height:56px"><span class="brush" style="font-size:40px">{{b2}}</span></span><span class="small" style="color:var(--hanji);letter-spacing:.06em;white-space:nowrap">{{plateLine}}</span></span>
      <span class="small" style="color:rgba(243,234,216,.6);letter-spacing:.02em;font-weight:500;text-align:right;line-height:1.5;margin-left:24px">{{plateCredit}}</span>
    </figcaption>
  </figure>
  <div class="abs" style="right:96px;bottom:120px;display:flex;align-items:center;gap:12px"><span class="small" style="color:rgba(243,234,216,.9)">훈도사주</span><span class="seal brush" style="width:52px;height:52px;font-size:21px;line-height:1.05;text-align:center">訓<br>導</span></div>
</section>

<!-- ───────── 2장 본문: 두 글자 ───────── -->
<section class="slide paper">
  <svg class="layer" width="1080" height="1350"><rect width="1080" height="1350" filter="url(#stain)" opacity=".1"/></svg>
  <!-- 광곽(사주쌍변) + 판심 -->
  <svg class="layer" width="1080" height="1350"><g fill="none" stroke="var(--ink)"><rect x="44" y="44" width="992" height="1262" stroke-width="5"/><rect x="58" y="58" width="964" height="1234" stroke-width="1.4"/><line x1="946" y1="58" x2="946" y2="1292" stroke-width="1.4"/></g>
    <path d="M960 250h52l-26 22z" fill="var(--ink)" opacity=".85"/><path d="M960 1100h52l-26-22z" fill="var(--ink)" opacity=".85"/></svg>
  <p class="abs v han" style="left:958px;top:300px;font-size:24px;letter-spacing:.3em;color:var(--ink)">六十日柱圖鑑 · {{noHan}}</p>
  <p class="abs han" style="left:968px;top:1180px;font-size:22px;color:var(--ink-soft)">二</p>
  <!-- 제목 -->
  <div class="abs" style="left:96px;right:170px;top:120px">
    <p class="small" style="color:var(--seal)">흔히 이렇게 빗대옵니다</p>
    <p style="margin-top:22px;font-size:var(--t);font-weight:900;line-height:1.14;letter-spacing:-.04em">{{headline}}</p>
  </div>
  <!-- 두 글자가 그림: 위 글자 먹 + 아래 글자 인장 -->
  <div class="abs" style="left:96px;right:170px;top:560px;display:flex;justify-content:center;gap:64px;align-items:flex-end">
    <figure style="text-align:center"><p class="brush" style="font-size:300px;filter:url(#inkbleed)">{{s1}}</p><figcaption style="margin-top:20px;font-size:var(--b);font-weight:800">{{s1ko}} <span style="font-weight:400">· {{s1word}}</span></figcaption></figure>
    <figure style="text-align:center"><div class="seal" style="width:290px;height:290px"><span class="brush" style="font-size:220px">{{b2}}</span></div><figcaption style="margin-top:20px;font-size:var(--b);font-weight:800;color:var(--seal)">{{b2ko}} <span style="font-weight:400">· {{b2word}}</span></figcaption></figure>
  </div>
  <p class="abs" style="left:96px;right:170px;bottom:120px;font-size:var(--b);line-height:1.55">{{body}}</p>
</section>

<!-- ───────── 3장 저장 카드 ───────── -->
<section class="slide night">
  {{cardBg}}
  <div class="layer" style="background:linear-gradient(180deg,rgba(16,25,40,0),rgba(16,25,40,0))"></div>
  <svg class="layer" width="1080" height="1350"><g fill="none" stroke="var(--gold)"><rect x="40" y="40" width="1000" height="1270" stroke-width="3" opacity=".85"/><rect x="52" y="52" width="976" height="1246" stroke-width="1" opacity=".6"/></g>
    <g stroke="var(--gold)" opacity=".9"><use href="#corner" transform="translate(64 64)"/><use href="#corner" transform="translate(1016 64) scale(-1 1)"/><use href="#corner" transform="translate(64 1286) scale(1 -1)"/><use href="#corner" transform="translate(1016 1286) scale(-1 -1)"/></g></svg>
  <p class="abs small" style="left:96px;right:96px;top:120px;text-align:center;color:var(--gold)">저장해 두는 일주 카드 · 三</p>
  <!-- 한지 카드 = 고서 한 면 -->
  <div class="abs" style="left:120px;right:120px;top:200px;height:720px;background:url(hanji.jpg) center/cover;color:var(--ink);box-shadow:0 26px 60px rgba(0,0,0,.55)">
    <svg class="layer" width="840" height="720"><g fill="none" stroke="var(--ink)"><rect x="18" y="18" width="804" height="684" stroke-width="4"/><rect x="30" y="30" width="780" height="660" stroke-width="1.2"/><line x1="740" y1="30" x2="740" y2="690" stroke-width="1.2"/></g>
      <path d="M752 150h46l-23 20z" fill="var(--ink)"/><path d="M752 600h46l-23-20z" fill="var(--ink)"/></svg>
    <p class="abs v han" style="left:752px;top:200px;font-size:22px;letter-spacing:.3em">六十日柱圖鑑 · 第{{noHan}}</p>
    <div class="abs" style="left:76px;right:130px;top:76px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <p style="font-size:88px;font-weight:900;letter-spacing:-.03em">{{name}}</p>
        <div class="seal" style="width:110px;height:110px"><span class="brush" style="font-size:46px;line-height:1.05;text-align:center">{{s1}}<br>{{b2}}</span></div>
      </div>
      <dl style="margin-top:30px;font-size:var(--b);line-height:1">
        <div style="display:flex;gap:30px;padding:27px 0;border-top:1.5px solid rgba(33,27,23,.3)"><dt style="width:140px;font-weight:800">성격</dt><dd>{{r1}}</dd></div>
        <div style="display:flex;gap:30px;padding:27px 0;border-top:1.5px solid rgba(33,27,23,.3)"><dt style="width:140px;font-weight:800">연애</dt><dd>{{r2}}</dd></div>
        <div style="display:flex;gap:30px;padding:27px 0;border-top:1.5px solid rgba(33,27,23,.3)"><dt style="width:140px;font-weight:800">내 사람</dt><dd>{{r3}}</dd></div>
        <div style="display:flex;gap:30px;padding:27px 0;border-top:1.5px solid rgba(33,27,23,.3);border-bottom:1.5px solid rgba(33,27,23,.3)"><dt style="width:140px;font-weight:800;color:var(--seal)">조심</dt><dd>{{r4}}</dd></div>
      </dl>
      <p style="margin-top:34px;font-size:var(--s);font-weight:600;letter-spacing:.3em;color:var(--ink-soft);text-align:center">{{image}}</p>
    </div>
  </div>
  <div class="abs" style="left:96px;right:96px;bottom:120px;display:flex;align-items:flex-end;justify-content:space-between">
    <div>
      <p style="font-size:52px;font-weight:900;letter-spacing:-.02em;line-height:1.2">그대의 일주는<br>무엇이옵니까?</p>
      <p class="small" style="margin-top:18px;color:var(--gold)">무료 · 가입 없이 · 프로필 링크</p>
      <p class="small" style="margin-top:14px;color:rgba(243,234,216,.55);font-weight:500;letter-spacing:.02em">{{cardCredit}}</p>
    </div>
    <div style="width:170px;height:170px;border-radius:50%;overflow:hidden;border:3px solid var(--gold-dim);background:#fff"><img src="hundo-bow.png" style="width:100%;height:100%;object-fit:cover;object-position:50% 20%"></div>
  </div>
</section>
</body></html>

```

### 채우기 (`build-1.py`)

```python
# Fill template-1.html with each day in days-1.json -> out1/<key>.html; fails on any unfilled {{key}}
import json, re, pathlib, sys
tpl = pathlib.Path("template-1.html").read_text()
out = pathlib.Path("out1"); out.mkdir(exist_ok=True)
for d in json.load(open(sys.argv[1] if len(sys.argv) > 1 else "days-1.json")):
    s = re.sub(r"\{\{(\w+)\}\}", lambda m: d[m.group(1)], tpl)
    (out / f"{d['key']}.html").write_text(s)
    print("wrote", d["key"])

```

### 이미지로 찍기 (`render.cjs`)

```js
const { chromium } = require("playwright");
const [,, file, prefix] = process.argv;
(async () => { const b = await chromium.launch();
 try { const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto("file://" + process.cwd() + "/" + file); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
  const s = await p.$$("section.slide"); for (let i = 0; i < s.length; i++) await s[i].screenshot({ path: `${prefix}-${i + 1}.png` });
  console.log(s.length); } finally { await b.close(); } })();

```

### 바탕 질감 만들기

```python
# hanji.jpg / night.jpg: 1080x1350 종이·밤 질감 (numpy + Pillow)
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
rng = np.random.default_rng(7); W, H = 1080, 1350
base = np.array([243, 234, 216], float)
cloud = Image.fromarray((rng.random((H//24, W//24))*255).astype('uint8')).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(30))
c = (np.asarray(cloud, float)/255-0.5)*14
grain = (rng.random((H, W))-0.5)*10
img = np.clip(base[None, None, :]+(c+grain)[..., None]*np.array([1, 0.95, 0.85]), 0, 255).astype('uint8')
im = Image.fromarray(img); d = ImageDraw.Draw(im, 'RGBA')
for _ in range(900):  # 한지 섬유
    x, y = rng.random()*W, rng.random()*H; L = 20+rng.random()*90; a = rng.random()*np.pi; pts = [(x, y)]
    for k in range(6):
        a += (rng.random()-.5)*.6; x += np.cos(a)*L/6; y += np.sin(a)*L/6; pts.append((x, y))
    tone = int(150+rng.random()*60)
    d.line(pts, fill=(tone, tone-12, tone-35, int(18+rng.random()*30)), width=1)
im.filter(ImageFilter.GaussianBlur(0.4)).save('hanji.jpg', quality=90)
cl = Image.fromarray((rng.random((H//40, W//40))*255).astype('uint8')).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(60))
c = (np.asarray(cl, float)/255-0.5); yy = np.linspace(0, 1, H)[:, None]
r = 16+c*10-yy*4; g = 33+c*12-yy*8; b = 56+c*16-yy*14; n = (rng.random((H, W))-.5)*4
Image.fromarray(np.clip(np.stack([r+n, g+n, b+n], -1), 0, 255).astype('uint8')).save('night.jpg', quality=92)

```
