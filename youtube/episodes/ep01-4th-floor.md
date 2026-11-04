# EP01 · No 4th floor (요즘 한국 · 배너 오른쪽 그림풍)

- 형식: 쇼츠 약 20~25초(음성 기준), 영어 먼저. 스페인어판은 같은 그림에 자막·음성만 교체
- 문법: servokind 릴스 기준. 말 한 구절 = 그 말 그대로의 그림, 컷 1~2.5초, 자막 1~3단어, 핵심만 노란색
- 그림: 대표님이 ChatGPT에서 생성(그림 속 글자 F·4·死가 정확해야 해서 GPT 권장). 한 장을 멀리·가까이 두 번 쓴다
- 엔딩 카드 없음(2026-10-28 결정). 마지막 컷 "hiding."으로 끝낸다
- 사실 확인 전 초안: 단정하지 않는 표현(many, some) 유지

## 대본 v3 (영어 · 스페인어 · 한국어) — 2026-11-04 확정

근거: `youtube/research/refs-analysis-2026-11.md` (14편 분석). Zack D. Films 흐름: 현상 → 이유 → 결과 → 확대 → **But 전환** → 한 줄 결론. 목표 약 28초, 초당 약 3단어, 0초에 말 시작.
v2에서 바꾼 것: ② 시청자에게 묻는 문장 추가(한강 편 "~냐고요?" 방식), ⑥ "F도 사실 4층" 전환점 추가.
문장 번호 = `youtube/tts/make_ep01.py`, `Ep01.tsx`의 `sent`. 스페인어는 중남미 기준 초안, 원어민 확인 전. 음성은 死를 읽지 않는다(화면에만).

| # | 역할 | 영어 (EN) | 스페인어 (ES) | 한국어 (뜻) | 그림 |
|---|---|---|---|---|---|
| 0 | — | In Korea, | En Corea, | 한국에서는, | 지도 오프닝 |
| 1 | 현상 | this elevator is hiding a floor. | este ascensor esconde un piso. | 이 엘리베이터가 층 하나를 숨기고 있어요. | A 버튼판 |
| 2 | 묻기 | Look: one, two, three… F. Where's four? | Mira: uno, dos, tres… F. ¿Y el cuatro? | 보세요. 1, 2, 3… F. 4는 어디 갔죠? | A → F로 확대 + "?" |
| 3 | 이유 | In Korean, four is read "sa," the same sound as the Chinese character for **death**. | En coreano, el cuatro se lee «sa», igual que el carácter chino de la **muerte**. | 한국어로 4는 "사"라고 읽는데, 죽음을 뜻하는 한자 死와 소리가 같아요. | C 숫자 4 → "사" → D 死 |
| 4 | 결과 | So many buildings swap it for an **F**, for "four." | Por eso muchos edificios lo cambian por una **F**, de *four*, cuatro en inglés. | 그래서 많은 건물이 4 대신 F(four)를 써요. | E 아파트 → A "F = Four" |
| 5 | 확대 | **Hospitals** go further: many skip the fourth floor entirely. | Los **hospitales** van más lejos: muchos se saltan el cuarto piso. | 병원은 더해요. 4층을 아예 빼 버리는 곳이 많아요. | G 병원 안내판 + 취소선 4 |
| 6 | But | But here's the thing: the F is still the fourth floor. Nobody just says it. | Pero ojo: la F sigue siendo el cuarto piso. Solo que nadie lo dice. | 그런데 사실 F도 4층이에요. 아무도 그렇게 부르지 않을 뿐이죠. | H 손가락 → A "F = 4th floor" |
| 7 | 결론 | Next time you see an F, you'll know what it's **hiding**. | La próxima vez que veas una F, sabrás lo que **esconde**. | 다음에 F를 보면, 무엇을 숨기는지 알게 될 거예요. | A 어둡게 (첫 장면으로 루프) |

엔딩 카드 없음. 그림풍: 배너 오른쪽(노을·부드러운 일러스트), 네온 없음. 오프닝 지도 처리(0초 주제 노출)는 음성 넣은 뒤 다시 판단.

## 그림 목록 (v1, 폐기: 새 그림은 ep01-images-v2.md의 A·C·D·E·G·H 6장)

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
