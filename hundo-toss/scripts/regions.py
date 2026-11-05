"""시군구 경계(GeoJSON) → 미니앱용 가벼운 지도 데이터(src/data/regions.json).

사용: python3 -I scripts/regions.py <skorea-municipalities-geo.json>
원본: 통계청 행정구역 경계(southkorea/southkorea-maps, kostat 2018). 좌표를 화면 좌표(가로 600)로 옮기고
1.6 단위보다 가까운 점은 버려 가볍게 만든다. 방향 계산용으로 각 시군구의 가장 큰 조각 중심(경위도)도 남긴다.
"""
import json, math, sys

SIDO = {"11": "서울", "21": "부산", "22": "대구", "23": "인천", "24": "광주", "25": "대전", "26": "울산", "29": "세종",
        "31": "경기", "32": "강원", "33": "충북", "34": "충남", "35": "전북", "36": "전남", "37": "경북", "38": "경남", "39": "제주"}
LON0, LON1, LAT0, LAT1 = 124.55, 131.0, 33.05, 38.65
W = 600
KX = math.cos(math.radians(36))
SX = W / ((LON1 - LON0) * KX)
H = round((LAT1 - LAT0) * SX)


def proj(lo, la):
    return ((lo - LON0) * KX * SX, (LAT1 - la) * SX)


def area(r):
    return sum(r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1] for i in range(len(r) - 1)) / 2


def tidy(name):
    # "안양시만안구" → "안양시 만안구"
    i = name.find("시")
    return name[: i + 1] + " " + name[i + 1 :] if 0 < i < len(name) - 1 and name.endswith("구") else name


src = json.load(open(sys.argv[1]))
out = []
for f in src["features"]:
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    d, best = [], None
    for poly in polys:
        ring = poly[0]
        pts = [proj(*c) for c in ring]
        a = abs(area(pts))
        if a < 1.5:
            continue
        keep = [pts[0]]
        for q in pts[1:]:
            if (q[0] - keep[-1][0]) ** 2 + (q[1] - keep[-1][1]) ** 2 > 1.6 ** 2:
                keep.append(q)
        if len(keep) < 4:
            continue
        d.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in keep) + "Z")
        if best is None or a > best[0]:
            best = (a, sum(c[0] for c in ring) / len(ring), sum(c[1] for c in ring) / len(ring))
    if not d:
        continue
    code = f["properties"]["code"]
    out.append({"code": code, "sido": SIDO.get(code[:2], ""), "name": tidy(f["properties"]["name"]), "lon": round(best[1], 4), "lat": round(best[2], 4), "d": "".join(d)})

out.sort(key=lambda r: r["code"])
json.dump({"w": W, "h": H, "regions": out}, open("src/data/regions.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), W, H)
