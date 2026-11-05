"""EP01 내레이션을 고른 목소리로 만들고, 영상이 읽는 타이밍 파일을 쓴다 (Kokoro).

사용: python make_ep01.py af_bella [속도=1.15]
결과: studio/public/ep01/vo/s0.wav … s7.wav, studio/src/ep01/vo.json

한국어 단어는 대표님 녹음으로 끼운다:
  youtube/tts/ko/sa.m4a (또는 .wav) 가 있으면 3번 문장의 "sa" 자리에 그 녹음을 넣는다.
  없으면 TTS가 영어식으로 "sa"라고 읽는다. (변환에 ffmpeg 필요)
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = Path(__file__).parent
STUDIO = HERE.parent / "studio"
OUT = STUDIO / "public" / "ep01" / "vo"
KO = HERE / "ko"

# 문장 번호는 Ep01.tsx 의 각 컷 sent 값과 맞춘다. 0번은 지도 오프닝 위.
# 문자열 대신 [앞, "ko:파일이름", 뒤] 목록이면 가운데에 녹음을 끼운다.
SENTENCES = [
    (0, "In Korea,"),
    (1, "this elevator is hiding a floor."),
    (2, "Look: one, two, three... F. Where's four?"),
    (3, ["In Korean, four is read", "ko:sa", "the same sound as the Chinese character for death."]),
    (4, "So many buildings swap it for an F, for four."),
    (5, "Hospitals go further: many skip the fourth floor entirely."),
    (6, "But here's the thing: the F is still the fourth floor. Nobody just says it."),
    (7, "Next time you see an F, you'll know what it's hiding."),
]
GAP = 0.12  # 녹음 앞뒤 숨 (초)


def load_ko(name: str, sr: int):
    """ko/이름.m4a|.wav → 모노, sr로 변환, 앞뒤 무음 제거, 크기 맞춤. 없으면 None."""
    src = next((KO / f"{name}{ext}" for ext in (".wav", ".m4a", ".mp3", ".aiff") if (KO / f"{name}{ext}").exists()), None)
    if src is None:
        return None
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg가 없습니다: brew install ffmpeg")
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td) / "k.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ac", "1", "-ar", str(sr), str(tmp)], check=True)
        a, _ = sf.read(tmp, dtype="float32")
    thr = 0.04 * np.max(np.abs(a))
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return None
    pad = int(0.03 * sr)
    a = a[max(idx[0] - pad, 0): idx[-1] + pad]
    return a * (0.8 / max(np.max(np.abs(a)), 1e-6))


def main() -> None:
    voice = sys.argv[1] if len(sys.argv) > 1 else "af_bella"
    speed = float(sys.argv[2]) if len(sys.argv) > 2 else 1.15
    lang = "en-gb" if voice.startswith("b") else "en-us"
    for f in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
        if not (HERE / f).exists():
            sys.exit(f"모델 파일이 없습니다: {f} (README의 curl 명령으로 먼저 받으세요)")
    OUT.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(HERE / "kokoro-v1.0.onnx"), str(HERE / "voices-v1.0.bin"))
    items = []
    for sid, text in SENTENCES:
        parts = text if isinstance(text, list) else [text]
        ko_names = [p[3:] for p in parts if p.startswith("ko:")]
        ko_audio = {n: load_ko(n, 24000) for n in ko_names}
        if any(v is None for v in ko_audio.values()):  # 녹음이 없으면 영어 TTS로 대신
            parts = [" ".join(p[3:] if p.startswith("ko:") else p for p in parts)]
            if ko_names:
                print(f"  (ko/{ko_names[0]} 녹음 없음 → TTS로 읽음)")
        chunks, sr = [], 24000
        for p in parts:
            if p.startswith("ko:"):
                gap = np.zeros(int(GAP * sr), dtype=np.float32)
                chunks += [gap, ko_audio[p[3:]], gap]
            else:
                a, sr = kokoro.create(p, voice=voice, speed=speed, lang=lang)
                chunks.append(a.astype(np.float32))
        audio = np.concatenate(chunks)
        name = f"s{sid}.wav"
        sf.write(OUT / name, audio, sr)
        sec = round(len(audio) / sr, 3)
        items.append({"id": sid, "file": f"ep01/vo/{name}", "sec": sec})
        print(f"s{sid} {sec:.2f}초  {' / '.join(parts)}")
    (STUDIO / "src" / "ep01" / "vo.json").write_text(json.dumps({"voice": voice, "sentences": items}, indent=2) + "\n")
    print("vo.json 저장. 이제 studio에서 렌더링하면 컷 길이가 음성에 맞춰집니다.")


if __name__ == "__main__":
    main()
