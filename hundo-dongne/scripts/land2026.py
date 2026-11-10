"""시군구마다 땅의 모양(산, 평지, 바다, 큰 강, 호수) → src/data/land.json.

사용: python3 -I scripts/land2026.py <HangJeongDong_ver20261001.geojson> <타일 폴더> <ne_10m_rivers_lake_centerlines_scale_rank.geojson> [출력]
(numpy, numba, pillow, shapely 필요)

- 행정구역: vuski/admdongkor ver20261001 (scripts/regions2026.py와 같은 원본, 같은 시군구 코드).
- 고도: AWS 공개 지형 타일(terrarium, 줌 10, 한 칸 약 150m). 타일은 x 866~884, y 392~412,
  https://elevation-tiles-prod.s3.amazonaws.com/terrarium/10/{x}/{y}.png 를 받아 10_{x}_{y}.png 로 둔다.
  고도 = R*256 + G + B/256 - 32768 (m, 바다는 음수).
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

adm, tiles, rivers_path = sys.argv[1:4]

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
for f in src["features"]:
    groups[f["properties"]["sgg"]].append(shape(f["geometry"]).buffer(0))

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
        "lat": round(c.y, 3),
    }

json.dump({"asOf": "2026-10-01", "regions": out}, open(sys.argv[4] if len(sys.argv) > 4 else "src/data/land.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "시군구")
