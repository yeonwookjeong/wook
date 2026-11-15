#!/usr/bin/env python3
"""캐릭터 시트(단색 크림 바탕)에서 포즈를 하나씩 잘라 투명 PNG로 저장.

사용: python3 cutout.py <시트 이미지> <출력 폴더> <이름> [--thresh 42]
- 바탕색은 가장자리 픽셀의 중앙값으로 잡는다.
- 바탕과 색 차이가 큰 곳 = 그림. 윤곽선 안쪽(바탕과 비슷한 크림색 옷)은 구멍 메우기로 살린다.
- 발밑 옅은 그림자와 Gemini 반짝이 표시(바탕보다 살짝 밝거나 어두운 것)는 문턱값 아래라 빠진다.
- 그림 위에 겹친 반짝이 표시는 오른쪽 아래 모서리에서만 주변 색으로 덮는다.
- 결과: <출력>/<이름>_01.png ... (위 줄 왼쪽부터 오른쪽, 다음 줄 순서)
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("name")
    ap.add_argument("--thresh", type=float, default=42.0)
    ap.add_argument("--star", default="", help="반짝이 표시 위치 x,y (그림 위에 겹쳤을 때만)")
    ap.add_argument("--gap", type=int, default=14, help="이 거리 안의 조각은 같은 포즈로 묶음(px)")
    a = ap.parse_args()

    try:
        im = Image.open(a.src).convert("RGB")
    except Exception as e:  # 파일이 없거나 깨짐
        print(f"이미지를 열 수 없어요: {e}", file=sys.stderr)
        return 1
    rgb = np.asarray(im).astype(np.float32)
    H, W, _ = rgb.shape
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((rgb - bg) ** 2).sum(-1))

    # 바깥 = 가장자리에서 출발해 '바탕 비슷한 색'(바탕·발밑 그림자·반짝이 표시)만 밟고 닿는 곳.
    # 윤곽선으로 둘러싸인 안쪽(크림색 티셔츠, 베이지 바지)은 닿지 못하므로 그림으로 남는다.
    passable = dist < a.thresh * 2.4  # 발밑 그림자(바탕과 거리 약 80)까지 바깥으로
    lab, _ = ndi.label(passable)
    edge_labels = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    exterior = np.isin(lab, edge_labels[edge_labels > 0])
    core = ~exterior
    core = ndi.binary_closing(core, iterations=2)
    core = ndi.binary_fill_holes(core)
    core = ndi.binary_opening(core, iterations=1)

    # 가까운 조각끼리 한 포즈로 묶기
    groups, n = ndi.label(ndi.binary_dilation(core, iterations=a.gap))
    boxes = ndi.find_objects(groups)
    items = []
    for i, sl in enumerate(boxes, start=1):
        if sl is None:
            continue
        m = (groups == i) & core
        if m.sum() < H * W * 0.002:  # 티끌
            continue
        ys, xs = np.nonzero(m)
        items.append((ys.min(), ys.max(), xs.min(), xs.max(), m))
    if not items:
        print("그림을 못 찾았어요. --thresh 를 낮춰 보세요.", file=sys.stderr)
        return 1

    # 줄 나누기: 세로 중심이 비슷하면 같은 줄
    items.sort(key=lambda t: (t[0] + t[1]) / 2)
    rows, cur = [], [items[0]]
    for it in items[1:]:
        prev = cur[-1]
        if (it[0] + it[1]) / 2 - (prev[0] + prev[1]) / 2 > (prev[1] - prev[0]) * 0.5:
            rows.append(cur)
            cur = [it]
        else:
            cur.append(it)
    rows.append(cur)
    ordered = [it for r in rows for it in sorted(r, key=lambda t: t[2])]

    # 부드러운 가장자리: 문턱 근처를 반투명으로
    soft = np.clip((dist - (a.thresh - 18)) / 18, 0, 1)
    os.makedirs(a.out, exist_ok=True)
    pad = 6
    for k, (y0, y1, x0, x1, m) in enumerate(ordered, start=1):
        body = ndi.binary_erosion(m, iterations=1)
        near = ndi.binary_dilation(m, iterations=2)
        alpha = np.where(body, 1.0, np.where(near, soft, 0.0))
        px = rgb.copy()
        # --star x,y: 그림 위에 겹친 Gemini 반짝이 표시를 지정 위치 반경 20px 안에서만 덮는다
        if a.star:
            sx, sy = (int(v) for v in a.star.split(","))
            yy, xx = np.ogrid[:H, :W]
            disk = ((yy - sy) ** 2 + (xx - sx) ** 2 < 22 ** 2) & m
            ring = ((yy - sy) ** 2 + (xx - sx) ** 2 < 36 ** 2) & ~disk & m
            if disk.any() and ring.any():
                base = np.median(px[ring & (px.mean(-1) > 110)], axis=0)
                light = disk & (px.mean(-1) > base.mean() + 6)
                px[light] = base
        Y0, Y1 = max(0, y0 - pad), min(H, y1 + pad + 1)
        X0, X1 = max(0, x0 - pad), min(W, x1 + pad + 1)
        rgba = np.dstack([px[Y0:Y1, X0:X1], alpha[Y0:Y1, X0:X1] * 255]).astype(np.uint8)
        path = os.path.join(a.out, f"{a.name}_{k:02d}.png")
        Image.fromarray(rgba, "RGBA").save(path)
        print(f"{path}  {X1 - X0}x{Y1 - Y0}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
