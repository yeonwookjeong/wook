---
id: toryvel-shorts-01-tokyo-tower
channel: toryvel
format: shorts
status: draft-v2 (가설 기준으로 고친 초안)
title: 도쿄타워 윗부분은 원래 전차였다
length_sec: 40
---

# 토리블 쇼츠 #1 · 도쿄타워

화면 표기: [2.5D] 실사 사진 깊이 효과 / [지도] 라벨·화살표 / [플로우] 구글 플로우 생성 / 카드 = 큰 키워드

| # | 화면 | 자막 (한 줄씩 끊어서) | 카드·라벨 |
|---|---|---|---|
| 1 | [2.5D] 도쿄타워 야경, 밀고 들어감 | 도쿄의 상징, 도쿄타워. / 그 꼭대기에는 / 한국전쟁이 녹아 있습니다. | — |
| 2 | [플로우 T0] 1950년대 항구, 미군 물자 하역 | 1950년, 한반도에서 전쟁이 터지자 / 일본엔 미군 주문이 쏟아졌습니다. | — |
| 3 | [플로우 T2] 고철장에 늘어선 부서진 전차 | 전쟁이 끝나고 남은 건 / 부서진 미군 전차들. | — |
| 4 | [플로우 T1] 건설 중인 철탑 | 마침 일본은 333m 탑을 세우는데 / 철이 모자랐죠. | — |
| 5 | [플로우 T3] 쇳물 | 그래서 그 전차를 녹였습니다. | 카드: 90대 |
| 6 | [2.5D] 타워 윗부분 빨간 강조 | 그 철이 들어간 곳이 / 탑의 윗부분, 3분의 1. | 라벨: 메인데크 150m 위 |
| 7 | [2.5D] 타워 옆으로 흐름 | 한반도에서 싸우던 전차가 / 지금은 도쿄 야경 꼭대기에 서 있는 셈입니다. | — |
| 8 | [2.5D] 아래에서 올려다봄 | 다음에 도쿄타워를 보면 / 꼭대기를 한번 올려다보세요. | 카드: 도쿄타워 |

## 필수 요소 점검
- 반전: "윗부분은 원래 전차" (1)
- 인과관계: 철 부족 → 한국전쟁 고철 → 녹여서 상부에 (2~6)
- 한국 연결: 한국전쟁을 훅으로 (1, 7)
- 가서 볼 것: 꼭대기를 올려다보기 (8)
- '전해진다' 처리: 화면에선 빼고 캡션 한 줄로 (원칙 4)
- 숫자: 화면엔 90대 하나만 (원칙 1)

## 캡션
```
도쿄타워 메인데크보다 위쪽은 한국전쟁에서 부서진 미군 전차를 녹인 철로 지었다고 전해진다.

1958년 탑을 세우던 일본은 철이 부족했다. 민간업자가 손상되고 버려진 M4 셔먼과 M47 패튼 약 90대를 사들였고, 1,000~1,500톤의 고철이 녹아 탑의 윗부분이 됐다.

다만 도쿄타워를 완성시킨 마에다 히사키치의 1959년 책 『東京タワー物語』에는 이 이야기가 없다. 전차 강재 이야기는 해체를 맡았던 업체 쪽에서 전해진 것이다.

#토리블 #도쿄 #도쿄타워 #도쿄여행 #일본여행 #여행정보
```

## 구글 플로우 프롬프트 (v2 · 토리블 틀)
레퍼런스(신비한 건축사전)처럼 화면 전체를 플로우로 만든다. 순서는 이미지 생성 → 마음에 드는 것 고르기 → 그 이미지로 영상 생성.
토리블 틀: 장면마다 [첫 프레임부터 진행 중인 동작] + [시대·장소] + [카메라 1개] + [공통 스타일] + [고정할 것].
편집에서는 클립 앞부분만 쓰므로 핵심 동작은 0초부터 이미 일어나고 있어야 한다.

공통 스타일 (이미지·영상 프롬프트 끝에 항상 붙임):
`Photorealistic historical documentary footage, vertical 9:16, shot on 35mm film, muted desaturated 1950s color, natural soft light, subtle film grain, realistic scale and physics, one continuous shot, no text, no signs, no logos`
현재 장면(A, B)은 1950s 대신: `Photorealistic travel documentary footage, vertical 9:16, 35mm lens, natural night color, one continuous shot, no text, no logos`

| 클립 | 대사 줄 | 사용 길이 |
|---|---|---|
| A 지금의 도쿄타워 야경 | 1, 6 | 4.8초 + 3.5초 |
| T0 일본 항구 (조선 특수) | 2 | 4.5초 |
| T2 고철장 전차 | 3 | 2.9초 |
| T1 건설 중인 탑 | 4 | 4.0초 |
| T3 쇳물 | 5 | 2.3초 |
| B 아래에서 올려다본 탑 | 7, 8 | 4.5초 + 3.5초 |

### A · 지금의 도쿄타워 야경
- 이미지: `Tokyo Tower at night in 2020s Tokyo, the red-orange lattice tower fully lit, seen from a quiet street in Shiba, city lights below, clear dark sky, the main observation deck clearly visible as a ring two thirds up the tower.`
- 영상: `The camera is already gliding forward toward the tower and slowly tilting up toward its top. Light traffic moves on the street below. The tower stays perfectly still and its shape never changes.`

### T0 · 일본 항구, 미군 주문 (조선 특수)
대사 뜻: 일본이 미군 주문을 받아 만들고 실어 보냄 → 하역이 아니라 **선적**.
- 이미지: `A Japanese port in 1951, Japanese dockworkers loading wooden crates and olive drab military trucks onto a large gray cargo ship bound for Korea, a steel cargo crane holding a crate mid-air, stacks of crates on the pier, overcast morning.`
- 영상: `From the first frame the crane is already lifting a crate up toward the ship while workers guide it with ropes. The camera slowly pushes in along the pier. The ship and crane keep their shape.`

### T2 · 고철장의 부서진 전차
- 이미지: `A 1950s scrapyard in Japan, a long row of damaged, rusted olive drab M4 Sherman tanks lined up for dismantling, some missing tracks and hatches, piles of scrap metal, gray overcast sky, no people in focus.`
- 영상: `The camera is already tracking slowly sideways at low height along the row of tanks. Dust drifts across the ground. The tanks never move and keep the same shape and number.`

### T1 · 건설 중인 도쿄타워
- 이미지: `Tokyo Tower under construction in 1958 in Shiba, Tokyo, the lower half of the red and white steel lattice already built, the upper part an open bare steel framework, tiny workers on the beams, low wooden rooftops of postwar Tokyo below, hazy afternoon.`
- 영상: `The camera is already tilting slowly upward along the tower from the middle toward the unfinished top. Workers move carefully on the beams. The lattice structure stays geometrically consistent.`

### T3 · 쇳물
- 이미지: `Inside a 1950s Japanese steel mill, a large ladle pouring a bright stream of molten steel into a mold, sparks, dark industrial interior lit orange by the glow, a worker silhouette at a safe distance.`
- 영상: `From the first frame molten steel is already pouring in a steady stream with sparks. The camera slowly pushes in. The ladle stays attached to its overhead hook.`

### B · 아래에서 올려다본 도쿄타워
- 이미지: `Looking straight up at Tokyo Tower at night from its base, the lit red-orange steel lattice rising into the dark sky, strong upward perspective, people small at the bottom edge.`
- 영상: `The camera is already tilting slowly up the tower toward the top while drifting slightly sideways. The tower stays perfectly still.`

### 사진 넣는 클립 (플로우에 이미지 업로드)
업로드 사진 (2026-11-07 교체, 캡션에 출처 표기):
- 야경 (A, B, 6번 줄): "東京タワー - panoramio (6).jpg", 福原邦展, CC BY 3.0 — https://commons.wikimedia.org/wiki/File:東京タワー_-_panoramio_(6).jpg
- 낮 (T1 탑 모양 참고): "Tokyo Tower (11697018633).jpg", Guilhem Vellut, CC BY 2.0 — https://commons.wikimedia.org/wiki/File:Tokyo_Tower_(11697018633).jpg
- CC BY-SA 사진은 쓰지 않음 (결과물까지 같은 라이선스로 풀어야 할 수 있어서).
- **A**: 이미지 생성 단계 생략. 사진을 첫 프레임으로 넣고 영상 프롬프트만:
  `Animate this exact photo. The camera glides slowly forward toward Tokyo Tower and tilts up toward its top. People on the sidewalk walk naturally, light traffic on the road. The tower, buildings and signs keep their exact shape. Photorealistic, natural night color, one continuous shot.`
- **T1**: 낮 사진을 참고 이미지로 넣고 이미지 프롬프트:
  `Use the reference photo only for the exact shape and proportions of Tokyo Tower. Show the same tower in 1958, under construction in Shiba, Tokyo, in daylight: the lower half built, the upper part above the main observation deck still an open bare steel framework, tiny workers on the beams, low postwar wooden rooftops below.` + 공통 스타일
- **B**: 사진을 참고 이미지로 넣고 이미지 프롬프트:
  `Same Tokyo Tower and night lighting as the reference photo, but seen from directly below at its base, the lit red-orange lattice rising into the dark sky, strong upward perspective.` + 현재 장면 스타일
- T0, T2, T3: 권리 확인된 실제 사진을 찾기 전까지는 글 프롬프트만.

### 편집에서 처리할 것 (플로우에 맡기지 않음)
- 6번 줄 "윗부분 3분의 1" 강조: A 클립 위에 메인데크 위쪽 밝히기 + 라벨.
- 카드 "90대", "도쿄타워": 코드로 얹음.

### 확인 필요
- 플로우 영상 한 클립 길이 선택지 (8초로 알고 있음, 확인 전).
- 금지어 칸 유무. 있으면: `modern cranes, shipping containers, modern clothing, skyscrapers in 1950s scenes, distorted tank shapes, extra tower parts, cuts, text, watermark`

## 근거
- 조선 특수: 1950년 한국전쟁 발발 후 미군·유엔군의 물자·수리·수송 발주가 일본에 몰림: https://kotobank.jp/word/%E6%9C%9D%E9%AE%AE%E7%89%B9%E9%9C%80-328171
- 철 부족, M4·M47 약 90대 낙찰·해체, 1,000~1,500톤, 대전망대(현 메인데크) 위쪽 약 3분의 1, 1959년 책에 기술 없음: https://crd.ndl.go.jp/reference/entry/index.php?id=1000203656&page=ref_view , https://www.buzzfeed.com/jp/kenjiando/tokyo-tower-tank
- 메인데크 150m, 탑 높이 333m: https://ticket.tokyotower.co.jp/en/ , https://uniquevenues-jp.metro.tokyo.lg.jp/venues/private/21816/
- 1958년 완공: 널리 알려진 사실이나 이번에 공식 자료로 재확인하지 못함 (medium)
