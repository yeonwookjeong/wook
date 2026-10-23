#!/usr/bin/env python3
"""Turn a cut list into a Final Cut Pro 7 XML timeline that Premiere Pro imports.

  python3 cutlist_to_xml.py CUTLIST.csv --footage FOLDER [--out rough.xml]

CUTLIST.csv columns: clip,in,out,note
  clip  file stem (GX010174), clip id from _index/clips.csv, or a path under FOLDER
  in    start time in the source, e.g. 12, 0:12, 0:12.5, 1:02:03
  out   end time in the source
  note  optional; becomes a sequence marker (narration line, caption idea)

Premiere: File > Import > the .xml. Originals are only referenced, never touched.
"""
import argparse
import csv
import json
import subprocess
import sys
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import quote

INDEX_CSV = Path("_index") / "clips.csv"


def parse_time(text):
    parts = [float(p) for p in text.strip().split(":")]
    seconds = 0.0
    for p in parts:
        seconds = seconds * 60 + p
    return seconds


def nfc(s):
    return unicodedata.normalize("NFC", s)


def on_disk(path):
    # macOS stores Korean names decomposed (NFD); match each component as the
    # filesystem spells it so the pathurl in the XML resolves in Premiere.
    path = Path(path).absolute()
    real = Path(path.anchor)
    for part in path.parts[1:]:
        if not real.is_dir():
            return None
        match = next((p for p in real.iterdir() if nfc(p.name) == nfc(part)), None)
        if match is None:
            return None
        real = match
    return real


def load_index(root):
    index = root / INDEX_CSV
    if not index.exists():
        return []
    with open(index, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def resolve(root, index, clip):
    direct = on_disk(root / clip)
    if direct and direct.is_file():
        return direct
    key = nfc(clip)
    hits = [r for r in index if nfc(r["clip"]) == key or nfc(Path(r["path"]).stem) == key]
    if len(hits) > 1:
        sys.exit(f"'{clip}' matches several files; use the path instead:\n  "
                 + "\n  ".join(h["path"] for h in hits))
    if hits:
        found = on_disk(root / hits[0]["path"])
        if found:
            return found
    sys.exit(f"Clip not found: '{clip}' (run footage.py index first, or give a path under {root})")


def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format",
                        "-show_streams", str(path)], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"ffprobe failed on {path}: {r.stderr.strip()}")
    data = json.loads(r.stdout)
    video = next((s for s in data["streams"] if s.get("codec_type") == "video"), None)
    if video is None:
        sys.exit(f"No video stream: {path}")
    num, den = video.get("r_frame_rate", "30/1").split("/")
    audio = [s for s in data["streams"] if s.get("codec_type") == "audio"]
    return {
        "fps": float(num) / float(den),
        "duration": float(data["format"].get("duration") or 0),
        "width": int(video.get("width", 0)),
        "height": int(video.get("height", 0)),
        "channels": min(int(audio[0].get("channels", 2)), 2) if audio else 0,
    }


def rate_of(fps):
    # NTSC rates (29.97, 59.94, 23.976) are written as timebase 30/60/24 with ntsc=TRUE.
    timebase = round(fps)
    ntsc = abs(fps - timebase) > 0.01
    return timebase, ntsc, (timebase * 1000 / 1001 if ntsc else float(timebase))


def sub(parent, tag, text=None, **attrs):
    el = ET.SubElement(parent, tag, attrs)
    if text is not None:
        el.text = str(text)
    return el


def add_rate(parent, timebase, ntsc):
    rate = sub(parent, "rate")
    sub(rate, "timebase", timebase)
    sub(rate, "ntsc", "TRUE" if ntsc else "FALSE")


def build(cuts, name, fps, width, height):
    timebase, ntsc, real_fps = rate_of(fps)
    frames = lambda seconds: int(round(seconds * real_fps))

    root = ET.Element("xmeml", version="4")
    seq = sub(root, "sequence", id="sequence-1")
    sub(seq, "name", name)
    total = sum(frames(c["out"]) - frames(c["in"]) for c in cuts)
    sub(seq, "duration", total)
    add_rate(seq, timebase, ntsc)
    media = sub(seq, "media")

    video = sub(media, "video")
    fmt = sub(sub(video, "format"), "samplecharacteristics")
    add_rate(fmt, timebase, ntsc)
    sub(fmt, "width", width)
    sub(fmt, "height", height)
    sub(fmt, "pixelaspectratio", "square")
    vtrack = sub(video, "track")

    audio = sub(media, "audio")
    atracks = [sub(audio, "track"), sub(audio, "track")]

    defined, file_ids, start = set(), {}, 0
    for n, c in enumerate(cuts, 1):
        length = frames(c["out"]) - frames(c["in"])
        info = c["info"]
        fid = file_ids.setdefault(str(c["path"]), f"file-{len(file_ids) + 1}")
        item_ids = [f"clipitem-v{n}"] + [f"clipitem-a{n}-{ch}" for ch in range(1, info["channels"] + 1)]

        def clipitem(track, item_id, mediatype=None, trackindex=None):
            item = sub(track, "clipitem", id=item_id)
            sub(item, "name", c["path"].name)
            sub(item, "duration", frames(info["duration"]))
            add_rate(item, timebase, ntsc)
            sub(item, "start", start)
            sub(item, "end", start + length)
            sub(item, "in", frames(c["in"]))
            sub(item, "out", frames(c["out"]))
            if fid in defined:
                sub(item, "file", id=fid)
            else:
                defined.add(fid)
                f = sub(item, "file", id=fid)
                sub(f, "name", c["path"].name)
                sub(f, "pathurl", "file://localhost" + quote(str(c["path"]), safe="/"))
                src_tb, src_ntsc, _ = rate_of(info["fps"])
                add_rate(f, src_tb, src_ntsc)
                sub(f, "duration", frames(info["duration"]))
                fmedia = sub(f, "media")
                vchar = sub(sub(fmedia, "video"), "samplecharacteristics")
                sub(vchar, "width", info["width"])
                sub(vchar, "height", info["height"])
                if info["channels"]:
                    sub(sub(fmedia, "audio"), "channelcount", info["channels"])
            if mediatype:
                src = sub(item, "sourcetrack")
                sub(src, "mediatype", mediatype)
                sub(src, "trackindex", trackindex)
            # Linking keeps picture and sound moving together when trimmed in Premiere.
            for k, other in enumerate(item_ids):
                link = sub(item, "link")
                sub(link, "linkclipref", other)
                sub(link, "mediatype", "video" if k == 0 else "audio")
                sub(link, "trackindex", 1 if k == 0 else k)
                sub(link, "clipindex", n)
            return item

        clipitem(vtrack, item_ids[0])
        for ch in range(1, info["channels"] + 1):
            clipitem(atracks[ch - 1], item_ids[ch], "audio", ch)

        if c["note"]:
            marker = sub(seq, "marker")
            sub(marker, "name", c["note"])
            sub(marker, "comment", f"{c['path'].name} {c['in_text']}-{c['out_text']}")
            sub(marker, "in", start)
            sub(marker, "out", -1)
        start += length

    ET.indent(root)
    return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n' + ET.tostring(root, encoding="unicode") + "\n"


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("cutlist", type=Path)
    p.add_argument("--footage", type=Path, required=True, help="trip folder that holds the originals")
    p.add_argument("--out", type=Path, help="default: next to the cut list, same name .xml")
    p.add_argument("--name", help="sequence name (default: cut list file name)")
    p.add_argument("--fps", type=float, default=29.97)
    p.add_argument("--size", default="1080x1920", help="sequence frame, e.g. 1080x1920 or 1920x1080")
    args = p.parse_args()

    root = args.footage.expanduser().resolve()
    if not root.is_dir():
        sys.exit(f"Not a folder: {root}")
    width, height = (int(v) for v in args.size.lower().split("x"))
    index = load_index(root)

    cuts, infos = [], {}
    with open(args.cutlist, newline="", encoding="utf-8-sig") as f:
        for line, row in enumerate(csv.DictReader(f), 2):
            if not (row.get("clip") or "").strip():
                continue
            path = resolve(root, index, row["clip"].strip())
            info = infos.get(path) or infos.setdefault(path, probe(path))
            t_in, t_out = parse_time(row["in"]), parse_time(row["out"])
            if not 0 <= t_in < t_out:
                sys.exit(f"Line {line}: 'in' must be before 'out' ({row['in']} → {row['out']})")
            if info["duration"] and t_out > info["duration"] + 0.05:
                sys.exit(f"Line {line}: out {row['out']} is past the end of {path.name} "
                         f"({info['duration']:.1f}s)")
            cuts.append({"path": path, "info": info, "in": t_in, "out": t_out,
                         "in_text": row["in"].strip(), "out_text": row["out"].strip(),
                         "note": (row.get("note") or "").strip()})
    if not cuts:
        sys.exit("Cut list is empty")

    out = args.out or args.cutlist.with_suffix(".xml")
    name = args.name or args.cutlist.stem
    out.write_text(build(cuts, name, args.fps, width, height), encoding="utf-8")
    total = sum(c["out"] - c["in"] for c in cuts)
    print(f"Wrote {out} ({len(cuts)} cuts, {total:.1f}s, {width}x{height} @ {args.fps})")


if __name__ == "__main__":
    main()
