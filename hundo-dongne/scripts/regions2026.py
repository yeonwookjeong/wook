"""행정동 경계(2026-10-01) → 미니앱용 시군구 지도 데이터(src/data/regions.json).

사용: python3 -I scripts/regions2026.py <HangJeongDong_ver20261001.geojson>
원본: vuski/admdongkor ver20261001 (행정안전부 행정동 기준). 2026년 바뀐 곳이 들어 있다:
인천 제물포구, 영종구, 검단구, 서해구(7/1), 전남광주통합특별시(7/1), 화성시 4개 구(2/1).
행정동을 시군구 코드로 합치고, 좌표를 화면 좌표(가로 600)로 옮겨 가볍게 만든다.
방향 계산에는 시군구에서 가장 큰 조각의 무게중심(경위도)을 쓴다.
"""
import json, math, sys
from collections import defaultdict
from shapely.geometry import shape
from shapely.ops import unary_union

# 시도 짧은 이름. 광주의 구는 같은 이름(동구, 서구, 남구, 북구)이 다른 시도에도 있어, 이름 앞에 '광주'를 붙인다.
SIDO = {"서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천", "대전광역시": "대전",
        "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기", "강원특별자치도": "강원", "충청북도": "충북",
        "충청남도": "충남", "전북특별자치도": "전북", "전남광주통합특별시": "전남광주", "경상북도": "경북",
        "경상남도": "경남", "제주특별자치도": "제주"}
GWANGJU_GU = {"동구", "서구", "남구", "북구", "광산구"}
LON0, LON1, LAT0, LAT1 = 124.55, 131.0, 33.05, 38.65
W = 600
KX = math.cos(math.radians(36))
SX = W / ((LON1 - LON0) * KX)
H = round((LAT1 - LAT0) * SX)


def proj(lo, la):
    return ((lo - LON0) * KX * SX, (LAT1 - la) * SX)


def tidy(name):
    # "화성시동탄구" → "화성시 동탄구"
    i = name.find("시")
    return name[: i + 1] + " " + name[i + 1 :] if 0 < i < len(name) - 1 and name.endswith("구") else name


src = json.load(open(sys.argv[1]))
groups = defaultdict(list)
meta = {}
for f in src["features"]:
    p = f["properties"]
    groups[p["sgg"]].append(shape(f["geometry"]).buffer(0))
    meta[p["sgg"]] = (p["sidonm"], p["sggnm"])

out = []
for code, geoms in groups.items():
    g = unary_union(geoms).buffer(0.0004).buffer(-0.0004)  # close slivers between 행정동
    polys = list(g.geoms) if g.geom_type == "MultiPolygon" else [g]
    d, best = [], None
    for poly in polys:
        pts = [proj(*c) for c in poly.exterior.coords]
        a = poly.area
        if abs(shape({"type": "Polygon", "coordinates": [pts]}).area) < 1.5:
            continue
        keep = [pts[0]]
        for q in pts[1:]:
            if (q[0] - keep[-1][0]) ** 2 + (q[1] - keep[-1][1]) ** 2 > 1.6 ** 2:
                keep.append(q)
        if len(keep) < 4:
            continue
        d.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in keep) + "Z")
        if best is None or a > best[0]:
            c = poly.centroid
            best = (a, c.x, c.y)
    if not d:
        print("dropped", code, meta[code], file=sys.stderr)
        continue
    sidonm, sggnm = meta[code]
    sido = SIDO[sidonm]
    name = tidy(sggnm)
    if sido == "전남광주" and name in GWANGJU_GU:
        name = f"광주 {name}"
    out.append({"code": code, "sido": sido, "name": name, "lon": round(best[1], 4), "lat": round(best[2], 4), "d": "".join(d)})

out.sort(key=lambda r: r["code"])
json.dump({"w": W, "h": H, "asOf": "2026-10-01", "regions": out}, open("src/data/regions.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), W, H)
