# EP01 · No 4th floor (요즘 한국 · 배너 오른쪽 그림풍)

- 형식: 쇼츠 약 20~25초(음성 기준), 영어 먼저. 스페인어판은 같은 그림에 자막·음성만 교체
- 문법: servokind 릴스 기준. 말 한 구절 = 그 말 그대로의 그림, 컷 1~2.5초, 자막 1~3단어, 핵심만 노란색
- 그림: 대표님이 ChatGPT에서 생성(그림 속 글자 F·4·死가 정확해야 해서 GPT 권장). 한 장을 멀리·가까이 두 번 쓴다
- 엔딩 카드 없음(2026-10-28 결정). 마지막 컷 "hiding."으로 끝낸다
- 사실 확인 전 초안: 단정하지 않는 표현(many, some) 유지

## 대본 v2 (영어 · 스페인어 · 한국어) — 2026-11-04 확정

v1에서 바꾼 것: ① "an old word for death" → 死는 옛말이 아니라 지금도 쓰는 한자라서 "the Chinese character for death" ② 호실 번호는 근거가 약해서 뺌(그림 F 삭제) ③ 병원을 따로 한 문장으로 세워 마지막 반전으로.
문장 번호는 음성 파일과 영상 컷을 묶는 번호다(`youtube/tts/make_ep01.py`, `Ep01.tsx`의 `sent`). 스페인어는 중남미 기준 초안이며 원어민 확인 전. 음성에서는 死를 읽지 않는다(화면에만).

| # | 영어 (EN) | 스페인어 (ES) | 한국어 (뜻) | 그림 |
|---|---|---|---|---|
| 0 | In Korea, | En Corea, | 한국에서는, | 지도 오프닝(노을 톤) |
| 1 | this elevator is hiding a floor. | este ascensor esconde un piso. | 이 엘리베이터는 층 하나를 숨기고 있어요. | A 버튼판 (스냅 줌, 띵) |
| 2 | Just an "F." | Solo una "F". | 그냥 "F" 하나. | A 의 F로 확대 |
| 3 | The number four is read "sa," the same sound as the Chinese character for **death** (死). | El cuatro se lee «sa», igual que el carácter chino de la **muerte** (死). | 숫자 4는 "사"라고 읽는데, 죽음을 뜻하는 한자 死와 소리가 같아요. | C 숫자 4 → "사" 글자 → D 死 (쿵) |
| 4 | So many buildings write **F**, for "four," instead. | Por eso muchos edificios ponen una **F**, de *four*, cuatro en inglés. | 그래서 많은 건물이 4 대신 F(four)라고 써요. | E 아파트 → A 의 F에 동그라미 "F = Four" |
| 5 | And many **hospitals** skip the fourth floor entirely. | Y muchos **hospitales** se saltan el cuarto piso por completo. | 병원은 아예 4층을 빼 버리기도 해요. | G 병원 안내판 + 취소선 4 |
| 6 | Next time you see an F, you'll know what it's **hiding**. | La próxima vez que veas una F, sabrás lo que **esconde**. | 다음에 F를 보면, 무엇을 숨기는지 알게 될 거예요. | H 손가락이 F → A 어둡게 (첫 장면으로 루프) |

**스페인어에서 주의**: F는 영어 *four*의 첫 글자라 스페인어로는 바로 이해되지 않는다. 그래서 4번 문장에 "de *four*, cuatro en inglés"를 넣었다.

엔딩 카드 없음(2026-10-28). 그림풍: 배너 오른쪽(노을·부드러운 일러스트), 네온 없음.

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
