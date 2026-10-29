"""EP01 내레이션을 여러 목소리로 읽혀 비교용 샘플을 만든다 (Kokoro, Apache-2.0, 무료·상업 사용 가능).

실행: README의 명령을 따른다. 결과는 samples/ 폴더의 wav 파일.
"""
import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

HERE = Path(__file__).parent
MODEL = HERE / "kokoro-v1.0.onnx"
VOICES = HERE / "voices-v1.0.bin"
OUT = HERE / "samples"

EN = (
    "No fourth floor? Just an F. In Korea, the number four is read sa, "
    "the same sound as an old word for death. So many buildings swap it for F, "
    "skip room numbers, even hospital floors. Next time you see an F, "
    "you'll know what it's hiding."
)
ES = (
    "¿No hay cuarto piso? Solo una F. En Corea, el número cuatro se lee sa, "
    "el mismo sonido que una antigua palabra para la muerte. Por eso muchos edificios "
    "lo cambian por una F, se saltan números de habitación, incluso pisos de hospital. "
    "La próxima vez que veas una F, sabrás lo que esconde."
)

# (파일 이름, 목소리, 언어, 문장) — 요즘 편은 밝은 여자 목소리가 기본, 비교용으로 남자 목소리도
CANDIDATES = [
    ("en_female_heart", "af_heart", "en-us", EN),
    ("en_female_bella", "af_bella", "en-us", EN),
    ("en_female_nicole", "af_nicole", "en-us", EN),
    ("en_female_emma_uk", "bf_emma", "en-gb", EN),
    ("en_male_michael", "am_michael", "en-us", EN),
    ("en_male_puck", "am_puck", "en-us", EN),
    ("es_female_dora", "ef_dora", "es", ES),
    ("es_male_alex", "em_alex", "es", ES),
]


def main() -> None:
    for f in (MODEL, VOICES):
        if not f.exists():
            sys.exit(f"모델 파일이 없습니다: {f.name} (README의 curl 명령으로 먼저 받으세요)")
    OUT.mkdir(exist_ok=True)
    kokoro = Kokoro(str(MODEL), str(VOICES))
    for name, voice, lang, text in CANDIDATES:
        try:
            audio, sr = kokoro.create(text, voice=voice, speed=1.05, lang=lang)
        except Exception as e:  # 목소리 이름이 바뀌었거나 언어 미지원이면 건너뛴다
            print(f"건너뜀 {name}: {e}")
            continue
        sf.write(OUT / f"{name}.wav", audio, sr)
        print(f"만듦 {name}.wav ({len(audio) / sr:.1f}초)")


if __name__ == "__main__":
    main()
