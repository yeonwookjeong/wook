"""대표님 목소리 복제로 한국어(또는 다른 언어) 문장을 읽는다 — Chatterbox Multilingual (MIT, 무료, 맥에서 실행).

준비 (한 번만, youtube/tts 폴더):
  /opt/homebrew/bin/python3.12 -m venv .venv-clone && source .venv-clone/bin/activate
  pip install chatterbox-tts
  녹음 10~30초를 ko/ref.m4a 로 저장 (조용한 방, 자연스럽게)

사용:
  python clone_ko.py "사." sa            → ko/sa.wav
  python clone_ko.py "한국에서는 숫자 4를 사라고 읽어요." test
  python clone_ko.py "Hola, soy de Corea." hola es   ← 세 번째 값은 언어 코드(기본 ko)

결과 wav는 make_ep01.py 가 ko/ 폴더에서 이름으로 찾아 쓴다.
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).parent
KO = HERE / "ko"


def find_ref() -> Path:
    for ext in (".wav", ".m4a", ".mp3", ".aiff"):
        p = KO / f"ref{ext}"
        if p.exists():
            return p
    sys.exit("녹음이 없습니다: youtube/tts/ko/ref.m4a (10~30초) 를 먼저 넣어 주세요.")


def fix_watermarker() -> None:
    """Chatterbox의 워터마크 부품(perth)이 불러와지지 않으면 원인을 보여 주고, 워터마크 없이 진행한다.

    perth.PerthImplicitWatermarker 가 None 이면 모델 생성이 'NoneType is not callable'로 멈춘다(맥에서 알려진 문제).
    이 경우 워터마크만 빠지고 음성은 똑같이 만들어진다. YouTube 업로드 때 '합성 콘텐츠' 표시는 그대로 한다.
    """
    import perth

    if getattr(perth, "PerthImplicitWatermarker", None) is not None:
        return
    try:  # 진짜 원인 한 줄 보여 주기
        from perth.perth_net.perth_net_implicit.perth_watermarker import PerthImplicitWatermarker  # noqa: F401
    except Exception as e:
        print(f"(워터마크 부품을 불러오지 못함: {type(e).__name__}: {e})")

    class _NoWatermark:
        def apply_watermark(self, wav, sample_rate=None, **_):
            return wav

        def get_watermark(self, wav, sample_rate=None, **_):
            return 0.0

    perth.PerthImplicitWatermarker = getattr(perth, "DummyWatermarker", None) or _NoWatermark
    print("(워터마크 없이 진행합니다. 음성 품질에는 영향 없음)")


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit('사용: python clone_ko.py "읽을 문장" 저장이름 [언어코드=ko]')
    text, name = sys.argv[1], sys.argv[2]
    lang = sys.argv[3] if len(sys.argv) > 3 else "ko"
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg가 없습니다: brew install ffmpeg")
    try:
        import torch
        import torchaudio as ta
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    except ImportError as e:
        sys.exit(f"설치가 덜 됐습니다 ({e}). .venv-clone 을 켜고 pip install chatterbox-tts")

    fix_watermarker()
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    with tempfile.TemporaryDirectory() as td:
        ref = Path(td) / "ref.wav"  # 어떤 형식이든 모노 wav로 바꿔서 넘긴다
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(find_ref()), "-ac", "1", "-ar", "24000", str(ref)], check=True)
        print(f"모델 불러오는 중 ({device}). 처음엔 내려받느라 몇 분 걸립니다...", flush=True)
        model = ChatterboxMultilingualTTS.from_pretrained(device=device)
        wav = model.generate(text, language_id=lang, audio_prompt_path=str(ref))
    KO.mkdir(exist_ok=True)
    out = KO / f"{name}.wav"
    ta.save(str(out), wav.cpu(), model.sr)
    print(f"저장: {out}  ({wav.shape[-1] / model.sr:.2f}초)")


if __name__ == "__main__":
    main()
