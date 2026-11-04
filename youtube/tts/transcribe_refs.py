"""레퍼런스 쇼츠 대사를 단어별 시간과 함께 뽑는다 (맥 전용, mlx-whisper, 무료).

사용 (youtube/tts 폴더, 가상환경 켠 상태):
  pip install mlx-whisper          ← 처음 한 번만
  python transcribe_refs.py        ← ~/Downloads/refs 안의 mp4 전부
결과: ~/Downloads/refs/all_words.json  ← 이 파일 하나를 대화에 첨부
"""
import json
import sys
from pathlib import Path

try:
    import mlx_whisper
except ImportError:
    sys.exit("mlx-whisper가 없습니다. 먼저: pip install mlx-whisper")

REFS = Path.home() / "Downloads" / "refs"
MODEL = "mlx-community/whisper-large-v3-turbo"  # 처음 실행 때 약 1.6GB 내려받음


def main() -> None:
    files = sorted(REFS.glob("*.mp4"))
    if not files:
        sys.exit(f"mp4가 없습니다: {REFS}")
    out = {}
    for i, f in enumerate(files, 1):
        print(f"[{i}/{len(files)}] {f.name}", flush=True)
        try:
            r = mlx_whisper.transcribe(str(f), path_or_hf_repo=MODEL, word_timestamps=True)
        except Exception as e:  # 한 편이 실패해도 나머지는 계속
            print(f"  실패: {e}")
            continue
        out[f.stem] = {
            "language": r.get("language"),
            "segments": [
                {
                    "start": round(s["start"], 2),
                    "end": round(s["end"], 2),
                    "text": s["text"].strip(),
                    "words": [
                        {"w": w["word"].strip(), "s": round(w["start"], 2), "e": round(w["end"], 2)}
                        for w in s.get("words", [])
                    ],
                }
                for s in r["segments"]
            ],
        }
    dest = REFS / "all_words.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"완료: {dest} ({len(out)}편)")


if __name__ == "__main__":
    main()
