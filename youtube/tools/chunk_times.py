#!/usr/bin/env python3
"""자막 덩어리(chunk)가 음성에서 실제로 시작하는 프레임을 구한다.

자막을 덩어리 개수로 똑같이 나누면 짧은 덩어리("is ours.")와 긴 덩어리가 같은 시간을 받아
화면(자막·장면 사건·효과음)이 목소리와 어긋난다. 여기서는
 1) 글자 수 비율로 경계를 어림잡고
 2) 그 근처(±0.45초)에서 실제 숨 쉬는 틈(소리가 작은 구간)에 맞춘다.
사용: python3 chunk_times.py <caps.json> <public 폴더> <출력 json>
출력: {"ep06": {"en": [[0, b1, ..., 마지막 프레임], ...]}}  (각 컷 시작 기준 프레임)
"""
import json
import sys
import wave

import numpy as np

FPS = 30


def env(path):
    w = wave.open(path)
    sr, ch = w.getframerate(), w.getnchannels()
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32)
    if ch > 1:
        a = a.reshape(-1, ch).mean(1)
    hop = sr // 100  # 10ms
    e = np.array([np.sqrt((a[i * hop:(i + 1) * hop] ** 2).mean() + 1e-9) for i in range(len(a) // hop)])
    return e / (e.max() + 1e-9)


def main():
    caps = json.load(open(sys.argv[1]))
    pub = sys.argv[2]
    out = {}
    for ep, langs in caps.items():
        out[ep] = {}
        for lang, d in langs.items():
            rows = []
            for i, (f, chunks) in enumerate(zip(d["files"], d["caps"])):
                total = d["frames"][i]
                e = env(f"{pub}/{f}")
                voiced = np.nonzero(e > 0.06)[0]
                s0, s1 = (voiced[0], voiced[-1]) if len(voiced) else (0, len(e) - 1)
                # 소리 작은 칸(틈) 표시: 30ms 이상 이어지는 저음량
                quiet = e < 0.05
                lens = [max(1, len(c)) for c in chunks]
                cum = np.cumsum(lens) / sum(lens)
                b = [0]
                for k in range(1, len(chunks)):
                    guess = s0 + (s1 - s0) * cum[k - 1]
                    lo, hi = int(max(s0, guess - 45)), int(min(s1, guess + 45))
                    best, bd = None, 1e9
                    j = lo
                    while j <= hi:
                        if quiet[j]:
                            k2 = j
                            while k2 + 1 < len(quiet) and quiet[k2 + 1]:
                                k2 += 1
                            if k2 - j >= 2:
                                mid = (j + k2) / 2
                                if abs(mid - guess) < bd:
                                    best, bd = k2, abs(mid - guess)  # 틈이 끝나는 곳 = 다음 말 시작
                            j = k2 + 1
                        else:
                            j += 1
                    t = best if best is not None else guess
                    fr = int(round(t / 100 * FPS))
                    b.append(max(b[-1] + 6, min(total - 6, fr)))
                b.append(total)
                rows.append(b)
            out[ep][lang] = rows
    json.dump(out, open(sys.argv[3], "w"))
    print("ok", {k: len(v["en"]) for k, v in out.items()})


if __name__ == "__main__":
    main()
