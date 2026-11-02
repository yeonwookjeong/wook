"""EP01 내레이션을 고른 목소리로 만들고, 영상이 읽는 타이밍 파일을 쓴다 (Kokoro).

사용: python make_ep01.py af_heart        ← 고른 목소리 이름 (make_samples.py 결과 참고)
결과: studio/public/ep01/vo/s0.wav … s5.wav, studio/src/ep01/vo.json
"""
import json
import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

HERE = Path(__file__).parent
STUDIO = HERE.parent / "studio"
OUT = STUDIO / "public" / "ep01" / "vo"

# 문장 번호는 Ep01.tsx 의 각 컷 sent 값과 맞춘다. 0번은 지도 오프닝 위.
SENTENCES = [
    (0, "In Korea,"),
    (1, "this elevator is hiding a floor."),
    (2, "Just an F."),
    (3, "The number four is read sa, the same sound as an old word for death."),
    (4, "So many buildings swap it for F, skip room numbers, even hospital floors."),
    (5, "Next time you see an F, you'll know what it's hiding."),
]


def main() -> None:
    voice = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
    speed = float(sys.argv[2]) if len(sys.argv) > 2 else 1.05
    lang = "en-gb" if voice.startswith("b") else "en-us"
    for f in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
        if not (HERE / f).exists():
            sys.exit(f"모델 파일이 없습니다: {f} (README의 curl 명령으로 먼저 받으세요)")
    OUT.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(HERE / "kokoro-v1.0.onnx"), str(HERE / "voices-v1.0.bin"))
    items = []
    for sid, text in SENTENCES:
        audio, sr = kokoro.create(text, voice=voice, speed=speed, lang=lang)
        name = f"s{sid}.wav"
        sf.write(OUT / name, audio, sr)
        sec = round(len(audio) / sr, 3)
        items.append({"id": sid, "file": f"ep01/vo/{name}", "sec": sec})
        print(f"s{sid} {sec:.2f}초  {text}")
    (STUDIO / "src" / "ep01" / "vo.json").write_text(json.dumps({"voice": voice, "sentences": items}, indent=2) + "\n")
    print("vo.json 저장. 이제 studio에서 렌더링하면 컷 길이가 음성에 맞춰집니다.")


if __name__ == "__main__":
    main()
