# EP01 · No 4th floor (요즘 한국 · K-팝풍 한 가지)

- 형식: 쇼츠 약 20~25초(음성 기준), 영어 먼저. 스페인어판은 같은 그림에 자막·음성만 교체
- 문법: servokind 릴스 기준. 말 한 구절 = 그 말 그대로의 그림, 컷 1~2.5초, 자막 1~3단어, 핵심만 노란색
- 그림: 대표님이 ChatGPT에서 생성(그림 속 글자 F·4·死가 정확해야 해서 GPT 권장). 한 장을 멀리·가까이 두 번 쓴다
- 엔딩 카드 없음(2026-10-28 결정). 마지막 컷 "hiding."으로 끝낸다
- 사실 확인 전 초안: 단정하지 않는 표현(many, some) 유지

## 대본 (영어 · 스페인어 · 한국어)

문장 번호는 음성 파일과 영상 컷을 묶는 번호다(`youtube/tts/make_ep01.py`, `Ep01.tsx`의 `sent`). 스페인어는 중남미 기준 초안이며 원어민 확인 전.

| # | 영어 (EN) | 스페인어 (ES) | 한국어 (뜻) | 화면 |
|---|---|---|---|---|
| 0 | In Korea, | En Corea, | 한국에서는, | 지도 오프닝 → 서울로 쑥 |
| 1 | this elevator is hiding a floor. | este ascensor esconde un piso. | 이 엘리베이터는 층 하나를 숨기고 있어요. | A 버튼판 (스냅 줌, 띵) |
| 2 | Just an "F." | Solo una "F". | 그냥 "F" 하나. | A 의 F로 달리 인 |
| 3 | The number four is read "sa," the same sound as an old word for **death**. | El número cuatro se lee «sa», igual que una antigua palabra para la **muerte**. | 숫자 4는 "사"라고 읽는데, 죽음을 뜻하는 옛말 "사(死)"와 소리가 같아요. | C 네온 4 → "사" 글자 → D 死 (쿵, 글리치) |
| 4 | So many buildings swap it for **F**, skip room numbers, even **hospital** floors. | Por eso muchos edificios lo cambian por una **F** (de *four*, cuatro en inglés), se saltan números de habitación, incluso pisos de **hospital**. | 그래서 많은 건물이 4 대신 F를 쓰고, 호실 번호를 건너뛰고, 병원은 4층을 빼기도 해요. | E 아파트 → A F 동그라미 → F 304호 → G 병원 안내판 |
| 5 | Next time you see an F, you'll know what it's **hiding**. | La próxima vez que veas una F, sabrás lo que **esconde**. | 다음에 F를 보면, 무엇을 숨기고 있는지 알게 될 거예요. | H 손가락이 F → A 의 F 어둡게 |

**스페인어에서 주의**: F는 영어 *four*의 첫 글자라 스페인어로는 바로 이해되지 않는다. 그래서 4번 문장에 "(de *four*, cuatro en inglés)"를 넣었다. 화면의 "F = Four" 표시는 그대로 둔다.

## 컷 (요즘 편 · 엔딩 없음)

| 컷 | 그림 | 코드로 얹는 것 | 움직임 | 효과음 |
|---|---|---|---|---|
| 0 | 지도 오프닝(요즘) | "In Korea," | 확대 → 쑥 | 상승음, 팅, 쑥 |
| 1 | A | — | 스냅 줌 | 띵 |
| 2 | A 의 F | — | 달리 인 | — |
| 3 | C | — | 줌 | 지직 |
| 4 | C | "사" + "sa · 4" | 줌 | 톡 |
| 5 | D | — | 크로스 디졸브 | — |
| 6 | D 의 死 | 노란 강조 | 스냅 줌 + 흔들림 | 쿵, 글리치 |
| 7 | E | — | 틸트 업 | — |
| 8 | A 의 F | 붉은 동그라미 "F = Four" | 오버슈트 | 톡 |
| 9 | F | 304 점선 상자 | 팬 | 톡 |
| 10 | G | 취소선 4 + "no 4th" | 줌 | 톡 |
| 11 | H | — | 달리 인 | 작은 띵 |
| 12 | A 의 F (어둡게) | 비네팅 | 슬로 줌 | 낮은 쿵 |

## 그림 목록 (8장 + 화풍 기준 1장)

먼저 **0번(화풍 기준)**을 뽑아 고른 뒤, 같은 대화창에서 그 그림을 기준으로 A~H를 뽑는다.

### 0. 화풍 기준
```
Create a style frame for a YouTube Shorts series about modern Korea. Style: Korean K-pop music video anime — clean cel shading, bold dark outlines, glossy highlights, neon magenta (#ff3d8b), cyan (#2de2e6) and violet lighting against deep navy night (#141f31). Scene: a modern Seoul apartment complex at night, glowing windows. Vertical 9:16, cinematic composition, no people, no text, no watermark.
```

### A~H (같은 대화창에서, 각각 따로 요청)
공통으로 끝에 붙일 문장: `Same style as the style frame. Vertical 9:16. No other text, no watermark.`

- **A. 엘리베이터 버튼판**: `Close-up of a Korean apartment elevator button panel, buttons labeled 1, 2, 3, F, 5, 6 in a vertical column; the F button glows softly.`
- **B. 서울 야경**: `Wide shot of Seoul at night from a hill, dense apartment towers and a neon-lit street, Namsan tower small in the distance.`
- **C. 숫자 4 네온**: `A large neon sign of the number 4 buzzing on a dark wall, rain-wet street reflecting the light.`
- **D. 한자 死**: `The Chinese character 死 painted in glowing red brush strokes on a dark concrete wall, ominous mood, thin smoke.`
- **E. 아파트 층 표시**: `Low-angle shot of a tall Korean apartment building facade with large floor numbers on the side, the number 4 replaced by F.`
- **F. 복도 호실**: `A long hotel corridor with door number plates 301, 302, 303, 305, 306 — no 304 — moody neon light.`
- **G. 병원 안내판**: `A Korean hospital elevator floor directory sign listing floors 1, 2, 3, 5, 6 — no 4th floor — clean modern hospital lobby.`
- **H. 버튼 누르는 손**: `A hand with a phone pressing the F button in an elevator, point-of-view shot, neon reflections on the metal.`

## 저장
생성한 그림은 `youtube/studio/public/ep01/`에 `0.png`, `A.png` … `H.png` 이름으로 저장 후 push (또는 이 대화에 첨부).
