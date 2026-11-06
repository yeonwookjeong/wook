"""대표님 목소리 복제로 한국어(또는 다른 언어) 문장을 읽는다 — Chatterbox Multilingual (MIT, 무료, 맥에서 실행).

준비 (한 번만, youtube/tts 폴더):
  /opt/homebrew/bin/python3.12 -m venv .venv-clone && source .venv-clone/bin/activate
  pip install chatterbox-tts
  녹음 10~30초를 ko/ref.m4a 로 저장 (조용한 방, 자연스럽게)

사용:
  python clone_ko.py "사." sa            → ko/sa_1.wav, sa_2.wav, sa_3.wav (골라서 ko/sa.wav 로 복사)
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
    import argparse

    ap = argparse.ArgumentParser(description="대표님 목소리 복제로 문장 읽기")
    ap.add_argument("text", help="읽을 문장")
    ap.add_argument("name", help="저장 이름 (ko/이름.wav)")
    ap.add_argument("lang", nargs="?", default="ko", help="언어 코드 (ko, en, es …)")
    ap.add_argument("--takes", type=int, default=3, help="여러 번 만들어 고르기 (기본 3)")
    ap.add_argument("--exag", type=float, default=0.5, help="감정 세기 0.25~1.0 (기본 0.5, 높을수록 과장)")
    ap.add_argument("--cfg", type=float, default=0.5, help="원본 목소리 따라가기 0~1 (기본 0.5, 낮추면 느긋하고 자연스러움)")
    args = ap.parse_args()

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
    KO.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        ref = Path(td) / "ref.wav"  # 어떤 형식이든 모노 wav로 바꿔서 넘긴다
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(find_ref()), "-ac", "1", "-ar", "24000", str(ref)], check=True)
        ref_sec = ta.info(str(ref)).num_frames / 24000
        print(f"원본 녹음 {ref_sec:.1f}초 (모델은 앞쪽 약 10초를 참고합니다)", flush=True)
        print(f"모델 불러오는 중 ({device})...", flush=True)
        model = ChatterboxMultilingualTTS.from_pretrained(device=device)
        for k in range(1, args.takes + 1):
            torch.manual_seed(k)
            try:
                wav = model.generate(args.text, language_id=args.lang, audio_prompt_path=str(ref),
                                     exaggeration=args.exag, cfg_weight=args.cfg)
            except TypeError:  # 옛 버전은 설정값을 받지 않는다
                wav = model.generate(args.text, language_id=args.lang, audio_prompt_path=str(ref))
            out = KO / f"{args.name}_{k}.wav"
            ta.save(str(out), wav.cpu(), model.sr)
            print(f"저장: {out}  ({wav.shape[-1] / model.sr:.2f}초)", flush=True)
    print(f"들어 보고 마음에 드는 번호를 {args.name}.wav 로 복사하세요. 예: cp ko/{args.name}_2.wav ko/{args.name}.wav")


if __name__ == "__main__":
    main()
