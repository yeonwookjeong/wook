# 작명 데이터 출처

| 파일 | 만드는 법 | 원천 |
|---|---|---|
| `hanja.tsv` | `npx tsx scripts/namingHanja.mts <data-gov.csv> <moji.db>` | 아래 1·2 |
| `romanize-avoid.tsv` | 직접 정리 (검수 필요) | — |
| `pure-korean.tsv` | 직접 정리 (검수 필요) | — |

1. **인명용 한자 목록**: [rutopio/Korean-Name-Hanja-Charset](https://github.com/rutopio/Korean-Name-Hanja-Charset) `data-gov.csv`
   (대법원 전자가족관계등록시스템 인명용 한자 조회, 2024-06 확대 기준). MIT License, 아래 고지 포함.
2. **Unicode Unihan** (kRSUnicode, kTotalStrokes, kDefinition, kKoreanEducationHanja): npm `@mandel59/mojidata`의 `moji.db`에서 읽음.
   Unicode License v3 — © Unicode, Inc. https://www.unicode.org/license.txt

## hanja.tsv 칸
| 칸 | 뜻 |
|---|---|
| ch | 한자 |
| ko | 한글 음 (여럿이면 /) |
| rad | 강희 부수 번호 |
| won | 원획 (부수를 본래 획수로: 氵4 · 扌4 · 艹6 · 阝7·8 · 辶7, 글자 자체가 부수면 보이는 획수) |
| pil | 필획 (Unihan 총획) |
| el | 자원오행 (木火土金水, 모르면 -) |
| sure | 1이면 부수만으로 사전들이 같은 말을 하는 오행, 0이면 日→火·玉→金처럼 흔하지만 갈리는 기준 |
| edu | 교육용 한자 (Unihan kKoreanEducationHanja) |
| neg | 영어 첫 뜻이 부정적 (1차 자동 거르기, 사람 검수 필요) |
| num | 숫자 글자 (획수 셈이 학파마다 다름) |
| pool | 1 먼저 쓰는 후보(교육용·오행 있음·뜻 무난) · 2 검수 뒤 후보(필획 17 이하) · 0 안 씀 |
| def | 영어 뜻 (Unihan) |

빠진 글자: 대법원 목록 고유 9,460자 중 405자는 유니코드에 없는 개인용 영역 글자(U+A0000·U+F0000대)라 표에서 뺐다. 글꼴로 보여 줄 수 없다.
검증: 성씨·자주 쓰는 글자 74자의 원획을 작명 관용 획수와 대조해 모두 일치 (2026-10-19).

---

### rutopio/Korean-Name-Hanja-Charset LICENSE
Copyright (c) 2024 ChingRu (rutopio@github)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
