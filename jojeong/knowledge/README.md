# 훈도사주 사주 지식 DB

훈도 답변, AI 보고서, 칼럼과 스레드가 같은 근거를 쓰게 하는 지식 저장소다. 손님 화면에는 출처를 쓰지 않는다(대표님 11/5). 근거는 안에서만 쓴다.

## 지금 있는 것 (2026-11-07)

| 파일 | 책 | 원문 출처 | 읽은 범위 |
|---|---|---|---|
| sources/smth.txt | 삼명통회 (명 만민영) | zh.wikisource | 신살 부분 정독 |
| sources/dts.txt, dts_b.txt | 적천수 집요 | zh.wikisource | 42편 완독 |
| sources/dtscw.txt | 적천수천미 (청 임철초) | zh.wikisource | 통신론 일부 |
| sources/qtbj.txt | 궁통보감 | zh.wikisource | 오행총론, 갑을병 정독, 월별 용신 전수 추출 |
| sources/yhzp.txt | 연해자평 (명 양종 편) | zh.wikisource | 앞부분 |
| sources/sftk.txt | 신봉통고 명리정종 (명 장남) | zh.wikisource | 서문, 병약설 등 |
| sources/lxz.txt | 이허중명서 | zh.wikisource | 받기만 함 |
| sources/mlzz.txt | 명리정종 목차 | zh.wikisource | 받기만 함 |
| notes.md | 책별 읽기 노트 | 직접 | |

원문은 모두 저작권이 끝난 옛 책이다. 현대 번역서와 해설서는 저작권이 있어 사서 읽은 내용을 요약해 노트로만 남기고, 본문을 통째로 넣지 않는다. ctext.org는 자동 수집을 막아 두었으므로 쓰지 않는다.

## 만들 구조

| 묶음 | 한 줄에 담는 것 | 쓰는 곳 |
|---|---|---|
| 원문 (passages) | 책, 권, 편, 원문, 한글 풀이, 주제 꼬리표 | 훈도 답변과 보고서의 근거, 칼럼 사실 확인 |
| 개념 (concepts) | 신살, 십성, 격국, 합충 하나마다: 정의, 책마다 다른 기준, 우리 엔진이 고른 기준과 이유 | 엔진 규칙 점검, 1단 설명문 |
| 명조 사례 (cases) | 옛 책에 실린 실제 사주와 그 책의 풀이 (적천수천미, 궁통보감 등) | 해석 연습, 보고서 문장 검수 |
| 손님 물음 (questions) | 실제 질문 유형 (이름과 생일 빼고) | 칼럼 주제, Q&A |
| 숫자 (stats) | 엔진 전수 계산 값 (lib/sinsalRarity.json 등) | 스레드 숫자, 칼럼 |
