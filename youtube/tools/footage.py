#!/usr/bin/env python3
"""Index travel footage so it can be reviewed without watching every clip.

  python3 footage.py index <folder>       clip list sorted by shooting time
  python3 footage.py sheets <folder>      one contact-sheet image per clip
  python3 footage.py transcribe <folder>  speech-to-text per clip (mlx-whisper)

Originals are only read. Everything is written to <folder>/_index/, and
re-running skips work that already exists.
"""
import argparse
import csv
import json
import math
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".mts", ".m2ts", ".avi", ".mkv", ".3gp"}
INDEX_DIR = "_index"
SHEET_COLS = 6
SHEET_MAX_TILES = 60
SHEET_MIN_INTERVAL = 5
WHISPER_MODEL = "mlx-community/whisper-large-v3-turbo"


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def require(tool):
    if run(["which", tool]).returncode != 0:
        sys.exit(f"'{tool}' not found. Install it first: brew install ffmpeg")


def find_videos(root):
    for p in sorted(root.rglob("*")):
        # Skip macOS "._" sidecar files that external drives accumulate.
        if any(part.startswith(".") or part == INDEX_DIR for part in p.relative_to(root).parts):
            continue
        if p.is_file() and p.suffix.lower() in VIDEO_EXTS:
            yield p


def clip_id(root, path):
    return str(path.relative_to(root).with_suffix("")).replace("/", "__")


def parse_iso6709(value):
    m = re.match(r"([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)", value or "")
    return (float(m.group(1)), float(m.group(2))) if m else (None, None)


def parse_time(value):
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (AttributeError, ValueError):
        return None


def probe(path):
    r = run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)])
    if r.returncode != 0:
        return None
    data = json.loads(r.stdout)
    tags = {k.lower(): v for k, v in data.get("format", {}).get("tags", {}).items()}
    video = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), {})
    has_audio = any(s.get("codec_type") == "audio" for s in data.get("streams", []))

    # Apple's creationdate keeps the local timezone of the trip; prefer it.
    shot = parse_time(tags.get("com.apple.quicktime.creationdate")) or parse_time(tags.get("creation_time"))
    if shot is None:
        shot = datetime.fromtimestamp(path.stat().st_mtime).astimezone()
    elif shot.tzinfo is None:
        shot = shot.replace(tzinfo=timezone.utc)
    lat, lon = parse_iso6709(tags.get("com.apple.quicktime.location.iso6709") or tags.get("location"))

    return {
        "shot_at": shot.isoformat(timespec="seconds"),
        "duration_s": round(float(data.get("format", {}).get("duration") or 0), 1),
        "resolution": f"{video.get('width', '?')}x{video.get('height', '?')}",
        "has_audio": has_audio,
        "lat": lat,
        "lon": lon,
        "size_mb": round(path.stat().st_size / 1_000_000, 1),
    }


def load_index(root):
    path = root / INDEX_DIR / "clips.csv"
    if not path.exists():
        sys.exit(f"Run 'index' first: {path} not found")
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def cmd_index(root):
    require("ffprobe")
    out = root / INDEX_DIR
    out.mkdir(exist_ok=True)
    rows, failed = [], []
    for path in find_videos(root):
        info = probe(path)
        if info is None:
            failed.append(path)
            continue
        rows.append({"clip": clip_id(root, path), "path": str(path.relative_to(root)), **info})
        print(f"\r{len(rows)} clips", end="", flush=True)
    print()
    # Sort by the real instant; clips from a layover city carry a different UTC offset.
    rows.sort(key=lambda r: datetime.fromisoformat(r["shot_at"]))

    fields = ["clip", "path", "shot_at", "duration_s", "resolution", "has_audio", "lat", "lon", "size_mb"]
    with open(out / "clips.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    by_day = {}
    for r in rows:
        by_day.setdefault(r["shot_at"][:10], []).append(r)
    lines = [f"# {root.name}", "",
             f"{len(rows)} clips, {sum(r['duration_s'] for r in rows) / 60:.0f} min, "
             f"{sum(r['size_mb'] for r in rows) / 1000:.1f} GB", ""]
    for day, clips in by_day.items():
        lines += [f"## {day} ({len(clips)} clips, {sum(c['duration_s'] for c in clips) / 60:.0f} min)", "",
                  "| time | clip | length | audio | GPS |", "|---|---|---|---|---|"]
        for c in clips:
            gps = f"{c['lat']:.4f},{c['lon']:.4f}" if c["lat"] is not None else ""
            lines.append(f"| {c['shot_at'][11:19]} | {c['clip']} | {c['duration_s']:.0f}s | "
                         f"{'Y' if c['has_audio'] else ''} | {gps} |")
        lines.append("")
    if failed:
        lines += ["## Unreadable files", ""] + [f"- {p.relative_to(root)}" for p in failed]
    (out / "clips.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {out / 'clips.md'} ({len(failed)} unreadable)")


def cmd_sheets(root):
    require("ffmpeg")
    out = root / INDEX_DIR / "sheets"
    out.mkdir(parents=True, exist_ok=True)
    clips = load_index(root)
    hwaccel = ["-hwaccel", "videotoolbox"] if sys.platform == "darwin" else []
    for i, c in enumerate(clips, 1):
        dest = out / f"{c['clip']}.jpg"
        if dest.exists():
            continue
        duration = max(float(c["duration_s"]), 1)
        interval = max(SHEET_MIN_INTERVAL, math.ceil(duration / SHEET_MAX_TILES))
        tiles = max(1, math.ceil(duration / interval))
        rows = math.ceil(tiles / SHEET_COLS)
        # Keyframe-only decoding keeps hundreds of GB of 4K footage fast. select (not fps)
        # so clips shorter than one interval still yield their first frame.
        vf = (f"select='isnan(prev_selected_t)+gte(t-prev_selected_t\\,{interval})',"
              f"scale=320:-2,tile={SHEET_COLS}x{rows}")
        r = run(["ffmpeg", "-v", "error", *hwaccel, "-skip_frame", "nokey", "-i", str(root / c["path"]),
                 "-vf", vf, "-fps_mode", "vfr", "-frames:v", "1", "-q:v", "4", "-y", str(dest)])
        ok = r.returncode == 0 and dest.exists()
        status = "ok" if ok else f"FAILED: {r.stderr.strip()[-200:] or 'no frame decoded'}"
        print(f"[{i}/{len(clips)}] {c['clip']} ({interval}s per tile) {status}")
        if ok:
            (out / f"{c['clip']}.txt").write_text(
                f"{c['path']}\nshot_at {c['shot_at']}\nleft-to-right, top-to-bottom, {interval}s per tile\n",
                encoding="utf-8")


def fmt_ts(seconds):
    h, rem = divmod(int(seconds), 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def cmd_transcribe(root):
    require("ffmpeg")
    try:
        import mlx_whisper
    except ImportError:
        sys.exit("mlx-whisper not installed. See youtube/SETUP_MAC.md")
    out = root / INDEX_DIR / "transcripts"
    out.mkdir(parents=True, exist_ok=True)
    clips = [c for c in load_index(root) if c["has_audio"] == "True"]
    for i, c in enumerate(clips, 1):
        dest = out / f"{c['clip']}.txt"
        if dest.exists():
            continue
        with tempfile.TemporaryDirectory() as tmp:
            wav = Path(tmp) / "audio.wav"
            r = run(["ffmpeg", "-v", "error", "-i", str(root / c["path"]), "-vn", "-ac", "1", "-ar", "16000", str(wav)])
            if r.returncode != 0:
                print(f"[{i}/{len(clips)}] {c['clip']} audio extract FAILED")
                continue
            result = mlx_whisper.transcribe(str(wav), path_or_hf_repo=WHISPER_MODEL,
                                            condition_on_previous_text=False)
        # Whisper invents text over wind and street noise; drop low-confidence segments.
        kept = [s for s in result["segments"]
                if not (s.get("no_speech_prob", 0) > 0.6 and s.get("avg_logprob", 0) < -1.0)]
        lines = [f"[{fmt_ts(s['start'])}] {s['text'].strip()}" for s in kept if s["text"].strip()]
        dest.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"[{i}/{len(clips)}] {c['clip']} {len(lines)} lines ({result.get('language', '?')})")

    combined = [f"# Transcripts: {root.name}", ""]
    for c in clips:
        f = out / f"{c['clip']}.txt"
        text = f.read_text(encoding="utf-8").strip() if f.exists() else ""
        if text:
            combined += [f"## {c['clip']} ({c['shot_at']})", "", text, ""]
    (root / INDEX_DIR / "transcripts.md").write_text("\n".join(combined), encoding="utf-8")
    print(f"Wrote {root / INDEX_DIR / 'transcripts.md'}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=["index", "sheets", "transcribe"])
    parser.add_argument("folder", type=Path)
    args = parser.parse_args()
    root = args.folder.expanduser().resolve()
    if not root.is_dir():
        sys.exit(f"Not a folder: {root}")
    {"index": cmd_index, "sheets": cmd_sheets, "transcribe": cmd_transcribe}[args.command](root)


if __name__ == "__main__":
    main()
