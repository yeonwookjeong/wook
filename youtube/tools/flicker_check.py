"""영상에서 깜빡이는 곳을 찾는다.

깜빡임 = 앞뒤 프레임은 서로 비슷한데 가운데 프레임만 혼자 튀는 픽셀.
카메라가 천천히 움직이는 장면에서는 앞뒤 평균과 가운데가 거의 같아야 한다.

사용: python3 flicker_check.py 영상.mp4 [기준=40]
결과: 깜빡임 픽셀이 많은 시각(초)과 화면 위치(위/가운데/아래)
"""
import subprocess
import sys

import numpy as np

W, H = 270, 480


def frames(path):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.uint8).reshape(-1, H, W).astype(np.int16)


def main():
    path = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 40
    a = frames(path)
    fps = 30
    hits = []
    for n in range(1, len(a) - 1):
        prev, cur, nxt = a[n - 1], a[n], a[n + 1]
        steady = np.abs(prev - nxt) < 8  # 앞뒤가 거의 같은 곳
        spike = np.abs(cur - (prev + nxt) // 2) > 25  # 가운데만 튐
        m = steady & spike
        c = int(m.sum())
        if c > limit:
            ys = np.where(m)[0]
            zone = ["위", "가운데", "아래"][min(2, int(ys.mean() / (H / 3)))]
            hits.append((n / fps, c, zone))
    # 초 단위로 묶어 많이 튄 구간부터 보여 준다 (움직임도 조금 잡히므로 두 영상을 비교해서 본다)
    per = {}
    for t, c, z in hits:
        k = int(t)
        per.setdefault(k, [0, {}])
        per[k][0] += c
        per[k][1][z] = per[k][1].get(z, 0) + c
    print(f"검사 {len(a)}프레임, 총 {sum(v[0] for v in per.values())}픽셀")
    for k, (c, zs) in sorted(per.items(), key=lambda x: -x[1][0])[:12]:
        print(f"  {k:3d}~{k + 1}초  {c:6d}  {max(zs, key=zs.get)}")


if __name__ == "__main__":
    main()
