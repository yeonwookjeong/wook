"""시군구마다 땅의 모양(산, 평지, 바다, 큰 강, 호수) → src/data/land.json.

사용: python3 -I scripts/land2026.py <HangJeongDong_ver20261001.geojson> <타일 폴더> <ne_10m_rivers_lake_centerlines_scale_rank.geojson> <저수지.csv> <지적통계.csv> <온천업소.csv> <평년값.csv> [출력]
(numpy, numba, pillow, shapely 필요)

- 행정구역: vuski/admdongkor ver20261001 (scripts/regions2026.py와 같은 원본, 같은 시군구 코드).
- 고도: AWS 공개 지형 타일(terrarium, 줌 10, 한 칸 약 150m). 타일은 x 866~884, y 392~412,
  https://elevation-tiles-prod.s3.amazonaws.com/terrarium/10/{x}/{y}.png 를 받아 10_{x}_{y}.png 로 둔다.
  고도 = R*256 + G + B/256 - 32768 (m, 바다는 음수).
- 저수지: 공공데이터포털 "한국농어촌공사_농업기반시설 시설제원_저수지"(15044339, 3,402곳, UTF-8로 바꾼 CSV). 소재지의
  시군구로 모아 만수면적(ha)을 더한다. 큰 댐 호수는 이 목록에 없어 아래 DAM_LAKES에 시군구로 적었다.
- 땅의 쓰임: 공공데이터포털 "국토교통부_지적기본통계집계"(15063997, 2025-12-31, UTF-8로 바꾼 CSV). 시군구마다 지목별 면적을
  더해 임야, 논밭(전 답 과수원 목장용지), 물(하천 유지 구거 양어장), 집터와 길(대 도로 주차장 학교용지 등), 공장(공장용지
  창고용지)의 비율(%)을 낸다. 화성시는 2026-02-01 4개 구로 나뉘기 전 기준이라 네 구에 같은 비율을 쓴다.
- 온천: 공공데이터포털 "행정안전부_전국 온천이용업소 현황"(15086533, UTF-8). 주소의 시군구로 업소 수를 센다.
- 기후: 기상자료개방포털 우리나라 기후평년값(1991~2020 연별, 218지점: 지점, 기온, 강수량, 일조시간 CSV). 지점 이름을
  시군구에 잇고(STATION_AT), 그 시군구 중심을 지점 자리로 본다. 각 시군구는 가장 가까운 지점의 값을 쓴다. 높은 산
  지점(성판악, 진부령)은 동네를 대표하지 않아 뺀다. 일조시간이 비어 있는 지점은 기온, 강수량만 쓴다.
- 물길: 고도에서 직접 계산한다(우선순위 채우기로 웅덩이를 메운 뒤 각 칸이 흘러가는 곳을 정하고, 위에서 모여드는
  넓이를 더한다). 그 시군구를 지나는 가장 큰 물길이 위쪽에서 모으는 넓이(km²)가 "물길 크기"다. 지도 범위 밖(북쪽
  38.7도 위)은 빠져 임진강, 북한강 상류는 실제보다 작게 나온다. 호수는 고도로 가릴 수 없어 넣지 않는다.
- Natural Earth 10m 강(nvkelso/natural-earth-vector)은 고도에 15m 새겨 넣어 물길이 평탄한 하류에서 새지 않게 잡는다
  (stream burning). 국내 강이 많이 빠져 있어 그 밖의 물길은 고도만으로 찾는다.
정의(한 칸 약 150m라 실제 경사보다 완만하게 나온다):
  산지 = 경사 8도 이상인 칸의 비율, 험한 산 = 경사 16도 이상, 평지 = 경사 2도 미만이고 고도 80m 미만.
  바다 = 경계 밖 2km 띠 안에서 바다(고도 -2m 미만)인 칸의 비율.
"""
import json, math, os, sys
from collections import defaultdict

import numpy as np
from numba import njit
from PIL import Image
from shapely import contains_xy
from shapely.geometry import shape
from shapely.ops import unary_union

Z, X0, X1, Y0, Y1 = 10, 866, 884, 392, 412
N = 256 * 2**Z

adm, tiles, rivers_path, reservoirs_path, jijeok_path, spa_path, normals_path = sys.argv[1:8]

# 고도 모자이크
rows = []
for y in range(Y0, Y1 + 1):
    row = []
    for x in range(X0, X1 + 1):
        a = np.asarray(Image.open(os.path.join(tiles, f"{Z}_{x}_{y}.png")).convert("RGB"), dtype=np.float64)
        row.append(a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768)
    rows.append(np.hstack(row))
elev = np.vstack(rows).astype(np.float32)
H, W = elev.shape

px = (np.arange(W) + X0 * 256 + 0.5)
py = (np.arange(H) + Y0 * 256 + 0.5)
lon = px / N * 360 - 180
lat = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * py / N))))
res = 40075016.686 * np.cos(np.radians(lat)) / N  # 한 칸의 길이(m), 줄마다
gy, gx = np.gradient(elev)
slope = np.degrees(np.arctan(np.hypot(gx / res[:, None], gy / res[:, None])))
LON, LAT = np.meshgrid(lon, lat)


@njit(cache=True)
def drainage(z, outlet, cell_km2):
    """Priority-flood (Barnes 2014): every cell drains to the neighbour that reached it first; returns upstream area."""
    h, w = z.shape
    n = h * w
    keyz = np.empty(n, np.float64)
    heap = np.empty(n, np.int64)
    size = 0
    seen = np.zeros(n, np.bool_)
    parent = np.full(n, -1, np.int64)
    order = np.empty(n, np.int64)
    k = 0

    def push(heap, keyz, size, i, v):
        j = size
        heap[j] = i
        keyz[j] = v
        while j > 0:
            q = (j - 1) // 2
            if keyz[q] <= keyz[j]:
                break
            heap[q], heap[j] = heap[j], heap[q]
            keyz[q], keyz[j] = keyz[j], keyz[q]
            j = q
        return size + 1

    for i in range(h):
        for j in range(w):
            if outlet[i, j] or i == 0 or j == 0 or i == h - 1 or j == w - 1:
                c = i * w + j
                seen[c] = True
                size = push(heap, keyz, size, c, z[i, j])
    while size > 0:
        c = heap[0]
        cz = keyz[0]
        size -= 1
        heap[0] = heap[size]
        keyz[0] = keyz[size]
        j = 0
        while True:
            l = 2 * j + 1
            if l >= size:
                break
            m = l
            if l + 1 < size and keyz[l + 1] < keyz[l]:
                m = l + 1
            if keyz[j] <= keyz[m]:
                break
            heap[j], heap[m] = heap[m], heap[j]
            keyz[j], keyz[m] = keyz[m], keyz[j]
            j = m
        order[k] = c
        k += 1
        ci, cj = c // w, c % w
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                if di == 0 and dj == 0:
                    continue
                ni, nj = ci + di, cj + dj
                if ni < 0 or nj < 0 or ni >= h or nj >= w:
                    continue
                nc = ni * w + nj
                if seen[nc]:
                    continue
                seen[nc] = True
                parent[nc] = c
                # a pit is raised just above its outlet, so flats keep draining
                v = z[ni, nj] if z[ni, nj] > cz else cz + 1e-4
                size = push(heap, keyz, size, nc, v)
    area = np.empty(n, np.float64)
    for c in range(n):
        area[c] = cell_km2[c // w]
    for t in range(k - 1, -1, -1):
        c = order[t]
        p = parent[c]
        if p >= 0:
            area[p] += area[c]
    return area.reshape(h, w)




def window(geom, pad=0.0):
    a, b, c, d = geom.bounds
    i0 = max(0, int(np.searchsorted(-lat, -(d + pad))) - 1)
    i1 = min(H, int(np.searchsorted(-lat, -(b - pad))) + 1)
    j0 = max(0, int(np.searchsorted(lon, a - pad)) - 1)
    j1 = min(W, int(np.searchsorted(lon, c + pad)) + 1)
    return slice(i0, i1), slice(j0, j1)


def inside(geom, pad=0.0):
    si, sj = window(geom, pad)
    m = contains_xy(geom, LON[si, sj], LAT[si, sj])
    return si, sj, m


rivers = [shape(f["geometry"]) for f in json.load(open(rivers_path))["features"]]
KR = (124.0, 32.5, 131.5, 39.0)
inkr = lambda g: not (g.bounds[2] < KR[0] or g.bounds[0] > KR[2] or g.bounds[3] < KR[1] or g.bounds[1] > KR[3])
rivers = [g for g in rivers if inkr(g)]

# The lower Han falls under 10m from 팔당 to 김포, less than the DEM's noise, so its water would wander off. The big
# rivers Natural Earth does know are burnt 15m into the DEM (standard stream burning), then the rest is found from the
# ground. Outlets are open sea only.
z = elev.astype(np.float64).copy()
for r in rivers:
    for line in getattr(r, "geoms", [r]):
        L = line.length
        for t in np.linspace(0, L, max(2, int(L / 0.0008))):
            q = line.interpolate(t)
            j = int(np.searchsorted(lon, q.x))
            i = int(np.searchsorted(-lat, -q.y))
            if 0 <= i < H and 0 <= j < W and z[i, j] > -7:
                z[i, j] = max(z[i, j] - 15, -7)
cell_km2 = (res / 1000.0) ** 2
upstream = drainage(z, elev < -8, cell_km2)

src = json.load(open(adm))
groups = defaultdict(list)
names = {}
for f in src["features"]:
    p = f["properties"]
    groups[p["sgg"]].append(shape(f["geometry"]).buffer(0))
    names[p["sgg"]] = (p["sidonm"], p["sggnm"])

# 시도 이름 맞추기: 옛 이름과 2026년 통합 이름을 같은 열쇠로.
SIDO_KEY = {"서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천", "광주광역시": "전남광주",
            "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기", "강원도": "강원",
            "강원특별자치도": "강원", "충청북도": "충북", "충청남도": "충남", "전라북도": "전북", "전북특별자치도": "전북",
            "전라남도": "전남광주", "전남광주통합특별시": "전남광주", "경상북도": "경북", "경상남도": "경남",
            "제주특별자치도": "제주", "제주도": "제주"}
by_name = {(SIDO_KEY.get(sd, sd), sg): code for code, (sd, sg) in names.items()}


def code_of(addr):
    t = addr.split()
    if len(t) < 2:
        return None
    sd = SIDO_KEY.get(t[0], t[0])
    if len(t) > 2 and (sd, t[1] + t[2]) in by_name:
        return by_name[(sd, t[1] + t[2])]
    return by_name.get((sd, t[1]))


import csv
reservoir_ha = defaultdict(float)
unmatched = 0
for row in csv.DictReader(open(reservoirs_path, encoding="utf-8")):
    c = code_of(row["소재지"])
    try:
        ha = float(row["만수면적"] or 0)
    except ValueError:
        ha = 0.0
    if c:
        reservoir_ha[c] += ha
    else:
        unmatched += 1
print("저수지 시군구를 못 찾은 곳", unmatched)

# 큰 댐 호수(다목적댐, 발전댐)가 걸친 시군구. 농어촌공사 저수지 목록에 없는 것만.
DAM_LAKES = {
    "소양호": [("강원", "춘천시"), ("강원", "양구군"), ("강원", "인제군")],
    "파로호": [("강원", "화천군"), ("강원", "양구군")],
    "춘천호, 의암호": [("강원", "춘천시")],
    "청평호": [("경기", "가평군")],
    "팔당호": [("경기", "남양주시"), ("경기", "하남시"), ("경기", "양평군"), ("경기", "광주시")],
    "충주호": [("충북", "충주시"), ("충북", "제천시"), ("충북", "단양군")],
    "대청호": [("대전", "대덕구"), ("대전", "동구"), ("충북", "청주시상당구"), ("충북", "보은군"), ("충북", "옥천군")],
    "안동호": [("경북", "안동시")],
    "임하호": [("경북", "안동시"), ("경북", "청송군")],
    "횡성호": [("강원", "횡성군")],
    "영주호": [("경북", "영주시")],
    "합천호": [("경남", "합천군")],
    "진양호": [("경남", "진주시")],
    "밀양호": [("경남", "밀양시")],
    "주암호": [("전남광주", "순천시"), ("전남광주", "보성군"), ("전남광주", "화순군")],
    "탐진호": [("전남광주", "장흥군")],
    "옥정호": [("전북", "임실군"), ("전북", "정읍시")],
    "용담호": [("전북", "진안군")],
    "부안호": [("전북", "부안군")],
    "보령호": [("충남", "보령시")],
}
# 땅의 쓰임(지적통계)
USE = {
    "forest": {"임야"},
    "farm": {"전", "답", "과수원", "목장용지"},
    "water": {"하천", "유지", "구거", "양어장"},
    "town": {"대", "도로", "주차장", "학교용지", "주유소용지", "체육용지", "종교용지", "철도용지", "수도용지", "공원", "유원지"},
    "factory": {"공장용지", "창고용지"},
}
area = defaultdict(lambda: defaultdict(float))
for row in csv.DictReader(open(jijeok_path, encoding="utf-8")):
    a = float(row["면적"] or 0)
    key = row["행정구역"].strip()
    area[key]["all"] += a
    for k, kinds in USE.items():
        if row["지목"] in kinds:
            area[key][k] += a
use_of = {}
for key, v in area.items():
    t = key.split()
    sd = SIDO_KEY.get(t[0], t[0])
    shares = {k: round(v[k] / v["all"] * 100, 1) for k in USE} if v["all"] else None
    # "세종특별자치시" has no 시군구 word: the whole 시도 is one place.
    targets = [c for (s_, g), c in by_name.items() if s_ == sd and (len(t) == 1 or g == "".join(t[1:]) or (len(t) == 2 and g.startswith(t[1]) and g != t[1]))]
    for c in targets:
        use_of[c] = shares
print("땅의 쓰임이 없는 시군구", [names[c] for c in groups if c not in use_of])

# 온천업소: 주소 "경북 경주시 …"의 시군구
SHORT = {"서울": "서울", "부산": "부산", "대구": "대구", "인천": "인천", "광주": "전남광주", "대전": "대전", "울산": "울산", "세종": "세종",
         "경기": "경기", "강원": "강원", "충북": "충북", "충남": "충남", "전북": "전북", "전남": "전남광주", "경북": "경북", "경남": "경남", "제주": "제주"}
spa = defaultdict(int)
for row in csv.DictReader(open(spa_path, encoding="utf-8")):
    t = row["주소"].split()
    if len(t) < 2:
        continue
    sd = SIDO_KEY.get(t[0], SHORT.get(t[0], t[0]))
    c = by_name.get((sd, t[1] + (t[2] if len(t) > 2 and t[2].endswith("구") and t[1].endswith("시") else ""))) or by_name.get((sd, t[1]))
    if c:
        spa[c] += 1

# 기후 평년값: 지점 → 시군구
STATION_AT = {
    "서울": ("서울", "종로구"), "기상청": ("서울", "동작구"), "남현": ("서울", "관악구"), "인천": ("인천", "제물포구"), "인천연수": ("인천", "연수구"),
    "부평": ("인천", "부평구"), "백령도": ("인천", "옹진군"), "부산": ("부산", "중구"), "영도": ("부산", "영도구"), "대구서구": ("대구", "서구"),
    "신암": ("대구", "동구"), "대전": ("대전", "유성구"), "오월드": ("대전", "중구"), "세천": ("대전", "동구"), "장동": ("대전", "대덕구"),
    "울산": ("울산", "중구"), "울기": ("울산", "동구"), "광산": ("전남광주", "광산구"), "조선대": ("전남광주", "동구"),
    "풍암": ("전남광주", "서구"), "중구": ("서울", "중구"), "북구": ("부산", "북구"), "부산남구": ("부산", "남구"),
    "해운대": ("부산", "해운대구"), "부산진": ("부산", "부산진구"), "동래": ("부산", "동래구"), "가덕도": ("부산", "강서구"),
    "간절곶": ("울산", "울주군"), "정자": ("울산", "북구"), "광양읍": ("전남광주", "광양시"), "거문도": ("전남광주", "여수시"), "흑산도": ("전남광주", "신안군"),
    "압해도": ("전남광주", "신안군"), "세종연서": ("세종", "세종시"), "대관령": ("강원", "평창군"), "울릉도": ("경북", "울릉군"),
    "추풍령": ("경북", "김천시"), "고산": ("제주", "제주시"), "추자도": ("제주", "제주시"), "성산": ("제주", "서귀포시"),
    "가평조종": ("경기", "가평군"), "경기광주": ("경기", "광주시"), "금곡": ("경기", "남양주시"), "연천청산": ("경기", "연천군"),
    "간성": ("강원", "고성군"), "사북": ("강원", "정선군"), "삼천포": ("경남", "사천시"), "완산": ("전북", "전주시완산구"),
}
SKIP_STATIONS = {"성판악", "진부령"}
centre = {c: unary_union(g).representative_point() for c, g in groups.items()}
stations = []
for row in csv.DictReader(open(normals_path, encoding="utf-8")):
    nm = row["지점"]
    if nm in SKIP_STATIONS:
        continue
    code = by_name.get(STATION_AT[nm]) if nm in STATION_AT else None
    if code is None:
        hits = [c for (sd, g), c in by_name.items() if g in (nm, nm + "시", nm + "군") or (sd == "서울" and g == nm + "구")]
        hits += [c for (sd, g), c in by_name.items() if not hits and g.startswith(nm + "시")]
        code = hits[0] if hits else None
    if code is None:
        print("기후 지점을 시군구에 못 이음", nm)
        continue
    num = lambda k: float(row[k]) if row[k] not in ("", "-") else None
    stations.append((centre[code], num("기온"), num("강수량"), num("일조시간")))


def climate_of(code):
    p = centre[code]
    near = sorted(stations, key=lambda st: (st[0].x - p.x) ** 2 + (st[0].y - p.y) ** 2)
    t = next((st[1] for st in near if st[1] is not None), None)
    r = next((st[2] for st in near if st[2] is not None), None)
    sun = next((st[3] for st in near if st[3] is not None), None)
    return {"temp": t, "rain": r, "sun": sun}


dam = defaultdict(list)
for lake, places in DAM_LAKES.items():
    for key in places:
        if key in by_name:
            dam[by_name[key]].append(lake)
        else:
            print("댐 호수 시군구를 못 찾음", lake, key)

out = {}
for code, geoms in sorted(groups.items()):
    g = unary_union(geoms).buffer(0.0004).buffer(-0.0004)
    si, sj, m = inside(g)
    e, s = elev[si, sj][m], slope[si, sj][m]
    if e.size < 4:  # 아주 작은 곳: 무게중심 한 칸
        c = g.representative_point()
        i = int(np.argmin(abs(lat - c.y)))
        j = int(np.argmin(abs(lon - c.x)))
        e, s = elev[i : i + 1, j], slope[i : i + 1, j]
    land = e > -2
    e, s = e[land] if land.any() else e, s[land] if land.any() else s
    ring = g.buffer(0.02).difference(g)
    ri, rj, rm = inside(ring)
    re = elev[ri, rj][rm]
    sea = float((re < -2).mean()) if re.size else 0.0
    river_km = sum(g.intersection(r).length for r in rivers if g.intersects(r)) * 111 * math.cos(math.radians(g.centroid.y))
    up = upstream[si, sj][m]
    flow = float(up.max()) if up.size else 0.0
    c = g.centroid
    out[code] = {
        "el": round(float(e.mean())),  # 평균 고도(m)
        "top": round(float(np.percentile(e, 95))),  # 높은 곳(상위 5%) 고도(m)
        "mt": round(float((s >= 8).mean()) * 100),  # 산지 비율(%)
        "rock": round(float((s >= 16).mean()) * 100),  # 험한 산 비율(%)
        "flat": round(float(((s < 2) & (e < 80)).mean()) * 100),  # 평지 비율(%)
        "sea": round(sea * 100),  # 경계 밖 2km 띠의 바다 비율(%)
        "flow": round(flow),  # 지나는 가장 큰 물길이 모으는 넓이(km²)
        "ne": round(river_km),  # Natural Earth 강 길이(km), 확인용
        "res": round(reservoir_ha.get(code, 0)),  # 농업용 저수지 만수면적 합(ha)
        "dam": dam.get(code, []),  # 걸친 큰 댐 호수
        "use": use_of.get(code),  # 땅의 쓰임 비율(%): forest 임야, farm 논밭, water 물, town 집터와 길, factory 공장
        "spa": spa.get(code, 0),  # 온천업소 수
        "climate": climate_of(code),  # 가장 가까운 지점의 연평균 기온(°C), 연강수량(mm), 연일조시간(시간)
        "lat": round(c.y, 3),
    }

json.dump({"asOf": "2026-10-01", "regions": out}, open(sys.argv[8] if len(sys.argv) > 8 else "src/data/land.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "시군구")
