"""어느 편이든 내레이션을 만든다 (Kokoro). 문장은 lines/epNN.json 의 en/es 목록에서 읽는다.

사용: python3 make_vo.py ep02 en   → studio/public/ep02/vo_en/s0.wav…, studio/src/ep02/vo_en.json
      python3 make_vo.py ep02 es
목소리: en = am_michael, es = em_alex, 속도 1.2 (EP01에서 확정한 값)
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = Path(__file__).parent
STUDIO = HERE.parent / "studio"
VOICE = {"en": ("am_michael", "en-us"), "es": ("em_alex", "es")}
SPEED = 1.2
# 1분 편처럼 길이를 늘려야 할 때: SPEED=1.05 python3 make_vo.py ep04 en
import os
SPEED = float(os.environ.get("SPEED", SPEED))


def main() -> None:
    if len(sys.argv) < 3 or sys.argv[2] not in VOICE:
        sys.exit("사용: python3 make_vo.py ep02 en|es")
    ep, lang = sys.argv[1], sys.argv[2]
    src = HERE / "lines" / f"{ep}.json"
    if not src.exists():
        sys.exit(f"대본 파일이 없습니다: {src}")
    lines = json.loads(src.read_text())[lang]
    voice, code = VOICE[lang]
    out = STUDIO / "public" / ep / f"vo_{lang}"
    out.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(HERE / "kokoro-v1.0.onnx"), str(HERE / "voices-v1.0.bin"))
    items = []
    for i, text in enumerate(lines):
        a, sr = kokoro.create(text, voice=voice, speed=SPEED, lang=code)
        a = np.asarray(a, dtype=np.float32)
        sf.write(out / f"s{i}.wav", a, sr)
        sec = round(len(a) / sr, 3)
        items.append({"id": i, "file": f"{ep}/vo_{lang}/s{i}.wav", "sec": sec})
        print(f"s{i} {sec:.2f}s  {text}")
    dst = STUDIO / "src" / ep / f"vo_{lang}.json"
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps({"voice": voice, "sentences": items}, indent=2) + "\n")
    print(f"총 {sum(x['sec'] for x in items):.1f}초 → {dst}")


if __name__ == "__main__":
    main()
