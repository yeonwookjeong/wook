"""EP01 대본 전체를 세 가지 무료 TTS로 만들어 비교한다: Kokoro(로컬) · Google Cloud Chirp 3 HD · Gemini TTS.

사용 (youtube/tts 폴더, .venv-tts 켠 상태):
  python compare_voices.py          → compare/ 폴더에 목소리별 wav
  python compare_voices.py --play   → 만든 뒤 이름을 띄우며 차례로 재생

키 (화면에 출력하지 않는다. 저장소에도 올리지 않는다):
  Google Cloud TTS : 환경변수 GOOGLE_TTS_KEY 또는 google_tts_key.txt (이 폴더 / ~/Downloads/keep/)
  Gemini (AI Studio): 환경변수 GEMINI_API_KEY 또는 gemini_key.txt (이 폴더 / ~/Downloads/keep/)
  키가 없는 엔진은 건너뛴다.

비용: Chirp 3 HD는 매달 약 100만 자 무료(대본 1회 약 450자). Gemini는 AI Studio 무료 등급(입력이 모델 개선에 쓰일 수 있음).
"""
import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).parent
OUT = HERE / "compare"
sys.path.insert(0, str(HERE))
from make_ep01 import SENTENCES  # noqa: E402  같은 대본을 쓴다

# 한국어 녹음 자리("ko:sa")는 비교용으로 영어 "sa"로 읽힌다
SCRIPT = " ".join(
    " ".join(p[3:] if p.startswith("ko:") else p for p in t) if isinstance(t, list) else t for _, t in SENTENCES
)

KOKORO = [("af_bella", "en-us"), ("af_heart", "en-us"), ("am_michael", "en-us"), ("bf_emma", "en-gb")]
CHIRP = ["en-US-Chirp3-HD-Kore", "en-US-Chirp3-HD-Aoede", "en-US-Chirp3-HD-Leda", "en-US-Chirp3-HD-Charon", "en-US-Chirp3-HD-Puck"]
GEMINI = ["Kore", "Aoede", "Charon", "Puck"]
GEMINI_MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts", "gemini-2.5-flash-tts"]
GEMINI_STYLE = (
    "Read this as the narrator of a fast-paced YouTube Short that explains Korean culture: "
    "curious, warm and confident, slightly faster than normal conversation, no long pauses:"
)


def find_key(env: str, filename: str):
    if os.environ.get(env, "").strip():
        return os.environ[env].strip()
    for d in (HERE, Path.home() / "Downloads" / "keep"):
        f = d / filename
        if f.exists() and f.read_text(encoding="utf-8").strip():
            return f.read_text(encoding="utf-8").strip()
    return None


def post(url: str, body: dict, key: str) -> dict:
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "x-goog-api-key": key})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def run_kokoro(made: list) -> None:
    try:
        from kokoro_onnx import Kokoro
    except ImportError:
        print("  Kokoro 건너뜀 (.venv-tts 를 켜세요)")
        return
    kk = Kokoro(str(HERE / "kokoro-v1.0.onnx"), str(HERE / "voices-v1.0.bin"))
    for voice, lang in KOKORO:
        a, sr = kk.create(SCRIPT, voice=voice, speed=1.15, lang=lang)
        p = OUT / f"kokoro_{voice}.wav"
        sf.write(p, a, sr)
        made.append(p)
        print(f"  Kokoro {voice}: {len(a) / sr:.1f}초")


def run_chirp(made: list) -> None:
    key = find_key("GOOGLE_TTS_KEY", "google_tts_key.txt")
    if not key:
        print("  Google Chirp 3 HD 건너뜀 (google_tts_key.txt 없음)")
        return
    for voice in CHIRP:
        try:
            d = post("https://texttospeech.googleapis.com/v1/text:synthesize", {
                "input": {"text": SCRIPT},
                "voice": {"languageCode": "en-US", "name": voice},
                "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": 24000, "speakingRate": 1.1},
            }, key)
        except urllib.error.HTTPError as e:
            print(f"  Chirp {voice}: 실패 HTTP {e.code} {e.read().decode('utf-8', 'replace')[:160]}")
            continue
        p = OUT / f"chirp_{voice.split('-')[-1]}.wav"
        p.write_bytes(base64.b64decode(d["audioContent"]))  # LINEAR16 = wav 헤더 포함
        made.append(p)
        print(f"  Chirp {voice}: 완료")


def run_gemini(made: list) -> None:
    key = find_key("GEMINI_API_KEY", "gemini_key.txt")
    if not key:
        print("  Gemini TTS 건너뜀 (gemini_key.txt 없음)")
        return
    for voice in GEMINI:
        body = {
            "contents": [{"parts": [{"text": f"{GEMINI_STYLE}\n{SCRIPT}"}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}},
        }
        pcm, last = None, ""
        for model in GEMINI_MODELS:
            try:
                d = post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", body, key)
                pcm = base64.b64decode(d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
                break
            except urllib.error.HTTPError as e:
                last = f"{model}: HTTP {e.code}"
                if e.code == 429:
                    print("  Gemini 무료 사용량 초과 — 잠시 후 다시")
                    return
            except (KeyError, IndexError):
                last = f"{model}: 음성이 안 옴"
        if pcm is None:
            print(f"  Gemini {voice}: 실패 ({last})")
            continue
        a = np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768.0  # 24 kHz 16-bit 모노
        p = OUT / f"gemini_{voice}.wav"
        sf.write(p, a, 24000)
        made.append(p)
        print(f"  Gemini {voice}: {len(a) / 24000:.1f}초 ({model})")


def main() -> None:
    OUT.mkdir(exist_ok=True)
    print(f"대본 {len(SCRIPT)}자로 비교합니다.")
    made: list = []
    run_kokoro(made)
    run_chirp(made)
    run_gemini(made)
    print(f"완료: {OUT} ({len(made)}개)")
    if "--play" in sys.argv:
        for p in made:
            print(f"== {p.stem}", flush=True)
            subprocess.run(["afplay", str(p)])


if __name__ == "__main__":
    main()
