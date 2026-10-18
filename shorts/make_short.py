"""
레시피(JSON) 한 장으로 쇼츠 영상을 만들어 주는 스크립트.

  원본 클립 → TTS 질문 → 원본 클립 … 순서로 이어 붙이고
  상단 제목 2줄, 하단 출처·링크 안내, 색깔 자막까지 넣은 9:16 mp4를 만듭니다.

사용법
  python3 make_short.py recipes/백진희_발뒤꿈치밤.json          # 영상 만들기
  python3 make_short.py recipes/백진희_발뒤꿈치밤.json --check  # 구간 시간만 미리 확인(빠름)

처음 한 번 설치
  python3 -m pip install -U "yt-dlp[default]" edge-tts pillow imageio-ffmpeg

레시피에서 구간은 시간("04:16") 또는 원본 자막 문구("이거 저희 꿀템인데요")로 지정합니다.
문구로 적으면 자막에서 그 말이 나오는 시간을 자동으로 찾아요.
"""

import argparse
import asyncio
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORK = HERE / "work"   # 원본 영상, TTS, 중간 파일 (지워도 다시 만들어짐)
OUT = HERE / "out"

# 화면 배치 (1080x1920)
W, H = 1080, 1920
TOP = 430            # 상단 제목 띠 높이
VH = 1080            # 가운데 영상 칸 높이 (TOP ~ TOP+VH)
SUB_Y = TOP + VH - 230  # 자막 세로 위치(영상 칸 아래쪽)
FPS = 30

THEMES = {
    "white": {"bg": (255, 255, 255), "t1": (232, 23, 58), "t2": (17, 17, 17), "small": (110, 110, 110)},
    "black": {"bg": (0, 0, 0), "t1": (255, 59, 92), "t2": (255, 255, 255), "small": (170, 170, 170)},
}
SUB_STYLES = {
    "celeb": {"fill": (255, 230, 0), "stroke": (0, 0, 0)},       # 셀럽 대사: 노랑
    "tts": {"fill": (180, 76, 255), "stroke": (255, 255, 255)},  # TTS: 보라 + 흰 테두리
    "react": {"fill": (57, 255, 20), "stroke": (0, 0, 0)},       # 리액션: 초록
}
# TTS 음질 보정: 무음 제거 → 저음 컷 → 선명도 → 컴프레서 → 치찰음 → 쇼츠 표준 음량
TTS_POLISH = ("silenceremove=start_periods=1:start_threshold=-50dB:stop_periods=-1:"
              "stop_duration=0.3:stop_threshold=-50dB,highpass=f=80,"
              "equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=-18dB:ratio=3:attack=5:release=100,"
              "deesser,loudnorm=I=-14:TP=-1.5:LRA=7")
BG_DUCK = 0.12  # TTS 나오는 동안 원본 소리 크기

INSTALL = 'python3 -m pip install -U "yt-dlp[default]" edge-tts pillow imageio-ffmpeg'


def die(msg: str):
    sys.exit(f"\n❌ {msg}")


try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    die(f"필요한 도구가 없어요. 먼저 실행하세요:\n   {INSTALL}")


# ---------------------------------------------------------------- 공통 도구

def ffmpeg_exe() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        found = shutil.which("ffmpeg")
        if found:
            return found
    die(f"ffmpeg를 찾지 못했어요. 먼저 실행하세요:\n   {INSTALL}")


def run(cmd: list[str], what: str):
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                       encoding="utf-8", errors="replace")
    if p.returncode != 0:
        tail = "\n".join(p.stderr.strip().splitlines()[-12:])
        die(f"{what} 중 오류가 났어요. 아래 내용을 복사해서 보내주세요.\n{tail}")
    return p


def duration_of(ff: str, path: Path) -> float:
    p = subprocess.run([ff, "-hide_banner", "-i", str(path)], stdout=subprocess.PIPE,
                       stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", p.stderr)
    if not m:
        die(f"길이를 읽지 못했어요: {path}")
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


TIME_RE = re.compile(r"^\d+(?::\d+){0,2}(?:\.\d+)?$")


def parse_time(v) -> float:
    if isinstance(v, (int, float)):
        return float(v)
    sec = 0.0
    for part in str(v).strip().split(":"):
        sec = sec * 60 + float(part)
    return sec


def fmt(sec: float) -> str:
    m, s = divmod(max(sec, 0), 60)
    return f"{int(m):02d}:{s:04.1f}"


def clean_text(text: str) -> str:
    text = re.sub(r"\[[^\]]*\]", " ", text)  # [음악] [비명] 같은 표시 제거
    return re.sub(r"\s+", " ", text).strip()


def norm(text: str) -> str:
    """띄어쓰기·문장부호를 지워서 자막 문구를 느슨하게 비교."""
    return re.sub(r"[\W_]+", "", clean_text(text))


# ---------------------------------------------------------------- 자막

def parse_json3(raw: str):
    out = []
    for ev in json.loads(raw).get("events", []):
        if "segs" not in ev:
            continue
        text = clean_text("".join(s.get("utf8", "") for s in ev["segs"]))
        if text:
            st = ev.get("tStartMs", 0) / 1000
            out.append((st, st + ev.get("dDurationMs", 2000) / 1000, text))
    return out


VTT_RE = re.compile(r"(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{3})\s+-->\s+(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{3})")


def parse_vtt(raw: str):
    out, cur, buf, seen = [], None, [], set()

    def flush():
        text = clean_text(re.sub(r"<[^>]+>", "", " ".join(buf)))
        if cur and text and text not in seen:
            seen.add(text)
            out.append((cur[0], cur[1], text))

    for line in raw.splitlines():
        m = VTT_RE.search(line)
        if m:
            flush()
            g = [int(x or 0) for x in m.groups()]
            cur = (g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000, g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000)
            buf = []
        elif line.strip() and cur and not line.strip().isdigit():
            buf.append(line.strip())
    flush()
    return out


class Subs:
    """자막 줄 목록 + 문구로 시간 찾기."""

    def __init__(self, lines):
        self.lines = sorted(lines)
        self.joined, self.owner = "", []
        for i, (_, _, text) in enumerate(self.lines):
            n = norm(text)
            self.joined += n
            self.owner += [i] * len(n)

    def find(self, phrase: str, after: float = 0.0):
        """문구가 나오는 (시작, 끝) 시간. after 이후에서 먼저 찾고, 없으면 처음부터."""
        key = norm(phrase)
        if not key:
            die(f"빈 문구예요: '{phrase}'")
        hits, pos = [], self.joined.find(key)
        while pos != -1:
            hits.append(pos)
            pos = self.joined.find(key, pos + 1)
        if not hits:
            die(f"자막에서 '{phrase}' 문구를 못 찾았어요.\n"
                f"   리포트(out/리포트_*.md)의 자막에서 몇 글자만 그대로 복사해 넣어보세요.")
        later = [p for p in hits if self.lines[self.owner[p]][0] >= after - 0.5]
        p = (later or hits)[0]
        first, last = self.lines[self.owner[p]], self.lines[self.owner[p + len(key) - 1]]
        return first[0], last[1]

    def between(self, a: float, b: float):
        return [(max(s, a), min(e, b), t) for s, e, t in self.lines if e > a and s < b]


# ---------------------------------------------------------------- 원본 영상

def fetch_source(url: str, ff: str):
    try:
        import yt_dlp
    except ImportError:
        die(f"yt-dlp가 없어요. 먼저 실행하세요:\n   {INSTALL}")
    sys.path.insert(0, str(HERE))
    from scan import pick_subtitle  # 스캐너와 같은 자막 선택 규칙 사용

    WORK.mkdir(exist_ok=True)
    opts = {
        "quiet": True, "no_warnings": True,
        "format": "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080][ext=mp4]/bv*[height<=1080]+ba/b",
        "merge_output_format": "mp4",
        "outtmpl": str(WORK / "%(id)s.%(ext)s"),
        "ffmpeg_location": ff,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
        video = WORK / f"{info['id']}.mp4"
        if video.exists():
            print("   원본 영상: 이미 받아둔 파일 사용")
        else:
            print("   원본 영상 다운로드 중… (처음 한 번만, 몇 분 걸릴 수 있어요)")
            ydl.download([url])
            if not video.exists():
                cand = sorted(WORK.glob(f"{info['id']}.*"))
                if not cand:
                    die("원본 영상 다운로드에 실패했어요. 'python3 -m pip install -U \"yt-dlp[default]\"' 후 다시 해보세요.")
                video = cand[0]
        sub, kind = pick_subtitle(info)
        lines = []
        if sub:
            raw = ydl.urlopen(sub["url"]).read().decode("utf-8", "replace")
            lines = parse_json3(raw) if sub["ext"] == "json3" else parse_vtt(raw)
            print(f"   자막: {kind} {len(lines)}줄")
        else:
            print("   자막: 없음 (구간은 시간으로 적어야 해요)")
    return video, Subs(lines), info.get("channel") or info.get("uploader") or ""


# ---------------------------------------------------------------- TTS

def make_tts(text: str, voice: str, rate: str, ff: str) -> Path:
    WORK.mkdir(exist_ok=True)
    key = hashlib.md5(f"{voice}|{rate}|{text}".encode()).hexdigest()[:10]
    raw, clean = WORK / f"tts_{key}.mp3", WORK / f"tts_{key}.wav"
    if clean.exists():
        return clean
    try:
        import edge_tts
    except ImportError:
        die(f"edge-tts가 없어요. 먼저 실행하세요:\n   {INSTALL}")

    async def go():
        await edge_tts.Communicate(text, voice, rate=rate).save(str(raw))

    try:
        asyncio.run(go())
    except Exception as e:
        die(f"TTS 만들기 실패: {e}\n   인터넷 연결을 확인하고 'python3 -m pip install -U edge-tts' 후 다시 해보세요.")
    run([ff, "-y", "-i", str(raw), "-af", TTS_POLISH, "-ar", "44100", "-ac", "2", str(clean)], "TTS 음질 보정")
    return clean


# ---------------------------------------------------------------- 글자 그림

_FONT = None


def _pick_font():
    """굵은 한글 폰트를 찾는다. shorts/fonts 폴더에 넣은 폰트가 있으면 그걸 우선 사용."""
    cands = sorted((HERE / "fonts").glob("*.[ot]t[fc]")) if (HERE / "fonts").exists() else []
    cands += [Path(p) for p in (
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
        "C:/Windows/Fonts/malgunbd.ttf",
        "C:/Windows/Fonts/malgun.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    )]
    rank = ["Heavy", "Black", "ExtraBold", "Bold", "SemiBold"]
    for path in cands:
        if not path.exists():
            continue
        best = (len(rank), 0)
        for idx in range(20 if path.suffix.lower() == ".ttc" else 1):
            try:
                style = ImageFont.truetype(str(path), 20, index=idx).getname()[1]
            except OSError:
                break
            for r, word in enumerate(rank):
                if word.lower() in style.lower().replace(" ", "") and r < best[0]:
                    best = (r, idx)
        return str(path), best[1]
    die("한글 폰트를 찾지 못했어요. shorts/fonts 폴더에 .ttf/.otf 폰트를 하나 넣어주세요.")


def font(size: int):
    global _FONT
    if _FONT is None:
        _FONT = _pick_font()
    return ImageFont.truetype(_FONT[0], size, index=_FONT[1])


def wrap(draw, text: str, f, max_w: int):
    """한글은 글자 단위로도 줄바꿈. 가능하면 띄어쓰기에서 끊는다."""
    lines, cur = [], ""
    for word in text.split(" "):
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=f) <= max_w:
            cur = trial
            continue
        if cur:
            lines.append(cur)
        cur = ""
        for ch in word:
            if draw.textlength(cur + ch, font=f) > max_w and cur:
                lines.append(cur)
                cur = ""
            cur += ch
    if cur:
        lines.append(cur)
    return lines


def fit(draw, text: str, max_w: int, size: int, min_size: int = 36):
    while size > min_size and draw.textlength(text, font=font(size)) > max_w:
        size -= 2
    return font(size)


def centered(draw, y: int, text: str, f, fill, stroke=None, stroke_w=0):
    w = draw.textlength(text, font=f)
    draw.text(((W - w) / 2, y), text, font=f, fill=fill,
              stroke_width=stroke_w, stroke_fill=stroke)


def layout_png(recipe: dict, path: Path):
    th = THEMES.get(recipe.get("theme", "white"), THEMES["white"])
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, TOP], fill=th["bg"])
    d.rectangle([0, TOP + VH, W, H], fill=th["bg"])
    f1 = fit(d, recipe["title1"], W - 80, 92)
    f2 = fit(d, recipe["title2"], W - 80, 92)
    centered(d, 110, recipe["title1"], f1, th["t1"])
    centered(d, 110 + f1.size + 34, recipe["title2"], f2, th["t2"])
    y = TOP + VH + 60
    if recipe.get("link_text"):
        f = fit(d, recipe["link_text"], W - 120, 56)
        centered(d, y, recipe["link_text"], f, th["t2"])
        y += f.size + 30
    if recipe.get("credit"):
        centered(d, y, recipe["credit"], fit(d, recipe["credit"], W - 120, 36), th["small"])
    img.save(path)


def sub_png(text: str, style: str, path: Path):
    st = SUB_STYLES.get(style, SUB_STYLES["celeb"])
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    size = 76
    while True:
        f = font(size)
        lines = wrap(d, text, f, W - 100)
        if len(lines) <= 2 or size <= 50:
            break
        size -= 4
    lines = lines[:3]
    lh = f.size + 18
    y = SUB_Y - (len(lines) - 1) * lh
    for line in lines:
        centered(d, y, line, f, st["fill"], st["stroke"], 9)
        y += lh
    img.save(path)


# ---------------------------------------------------------------- 렌더링

def render(ff: str, src: Path, t0: float, dur: float, layout: Path, subs: list, tts: Path | None, out: Path):
    """subs: [(png, 시작, 끝)] (구간 기준 상대 시간)"""
    cmd = [ff, "-y", "-ss", f"{t0:.3f}", "-t", f"{dur:.3f}", "-i", str(src), "-i", str(layout)]
    for png, _, _ in subs:
        cmd += ["-i", str(png)]
    if tts:
        cmd += ["-i", str(tts)]

    fg = [f"[0:v]scale={W}:{VH}:force_original_aspect_ratio=increase,crop={W}:{VH},setsar=1,fps={FPS},"
          f"pad={W}:{H}:0:{TOP}:black[b0]",
          "[b0][1:v]overlay=0:0[b1]"]
    last = "b1"
    for i, (_, a, b) in enumerate(subs):
        fg.append(f"[{last}][{i + 2}:v]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'[s{i}]")
        last = f"s{i}"
    fg.append(f"[{last}]format=yuv420p[vout]")
    if tts:
        ti = len(subs) + 2
        fg.append(f"[0:a]aresample=44100,volume={BG_DUCK}[bg]")
        fg.append(f"[{ti}:a]aresample=44100,adelay=150|150[t]")
        fg.append(f"[bg][t]amix=inputs=2:duration=first:normalize=0,apad,atrim=0:{dur:.3f}[aout]")
    else:
        fg.append(f"[0:a]aresample=44100,loudnorm=I=-14:TP=-1.5:LRA=11,apad,atrim=0:{dur:.3f}[aout]")

    cmd += ["-filter_complex", ";".join(fg), "-map", "[vout]", "-map", "[aout]",
            "-t", f"{dur:.3f}", "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2", str(out)]
    run(cmd, f"구간 렌더링({out.name})")


def resolve(v, subs: Subs, after: float, edge: str) -> float:
    """시간 문자열이면 그대로, 문구면 자막에서 찾아 시작(edge=start) 또는 끝(edge=end)."""
    if isinstance(v, (int, float)) or TIME_RE.match(str(v).strip()):
        return parse_time(v)
    s, e = subs.find(str(v), after)
    return s if edge == "start" else e


def plan_parts(recipe, subs: Subs, ff: str, check: bool):
    """레시피를 실제 시간표로 바꾼다."""
    plan, cursor = [], 0.0
    for n, part in enumerate(recipe["parts"], 1):
        kind = part.get("type")
        if kind == "clip":
            a = resolve(part["from"], subs, cursor, "start") - 0.15
            b = resolve(part["to"], subs, a, "end") + 0.25
            if b <= a:
                die(f"{n}번 구간: 끝이 시작보다 빨라요 ({fmt(a)} ~ {fmt(b)})")
            plan.append({"type": "clip", "start": max(a, 0), "end": b, "part": part})
            cursor = b
        elif kind == "tts":
            at = resolve(part.get("over", cursor), subs, cursor, "start")
            if check:
                tts, dur = None, 2.0 + len(part["text"]) * 0.12  # 대략치
            else:
                tts = make_tts(part["text"], recipe.get("voice", "ko-KR-SunHiNeural"),
                               recipe.get("rate", "+10%"), ff)
                dur = duration_of(ff, tts) + 0.45
            plan.append({"type": "tts", "start": at, "end": at + dur, "tts": tts, "part": part})
        else:
            die(f"{n}번 구간: type은 clip 또는 tts 여야 해요.")
    return plan


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description="레시피로 쇼츠 만들기")
    ap.add_argument("recipe", help="레시피 JSON 파일")
    ap.add_argument("--check", action="store_true", help="영상은 만들지 않고 구간 시간만 확인")
    ap.add_argument("--video", help="(선택) 이미 받아둔 원본 영상 파일")
    ap.add_argument("--subs", help="(선택) --video와 함께 쓸 자막 파일(.vtt/.json3)")
    args = ap.parse_args()

    rpath = Path(args.recipe)
    try:
        recipe = json.loads(rpath.read_text(encoding="utf-8"))
    except FileNotFoundError:
        die(f"레시피 파일이 없어요: {rpath}")
    except json.JSONDecodeError as e:
        die(f"레시피 JSON 형식 오류 ({e.lineno}번째 줄): 쉼표나 따옴표를 확인하세요.")
    for k in ("title1", "title2", "parts"):
        if k not in recipe:
            die(f"레시피에 '{k}' 항목이 없어요.")

    ff = ffmpeg_exe()
    print(f"🎬 {rpath.stem}")
    if args.video:
        src = Path(args.video)
        lines = []
        if args.subs:
            raw = Path(args.subs).read_text(encoding="utf-8")
            lines = parse_json3(raw) if args.subs.endswith(".json3") else parse_vtt(raw)
        subs, channel = Subs(lines), ""
    else:
        src, subs, channel = fetch_source(recipe["source"], ff)
    recipe.setdefault("credit", f"출처: 유튜브 {channel}" if channel else "")

    plan = plan_parts(recipe, subs, ff, args.check)
    total = sum(p["end"] - p["start"] for p in plan)
    print("\n   구간 시간표")
    for i, p in enumerate(plan, 1):
        label = "원본" if p["type"] == "clip" else "TTS "
        extra = p["part"].get("text", "") if p["type"] == "tts" else ""
        print(f"   {i}. {label} {fmt(p['start'])} ~ {fmt(p['end'])} ({p['end'] - p['start']:.1f}초) {extra}")
    print(f"   총 길이 약 {total:.0f}초" + ("  ⚠️ 60초가 넘어요" if total > 60 else ""))
    if args.check:
        print("\n✅ 확인만 했어요. 영상을 만들려면 --check 없이 다시 실행하세요.")
        return

    tmp = WORK / f"build_{rpath.stem}"
    tmp.mkdir(parents=True, exist_ok=True)
    layout = tmp / "layout.png"
    layout_png(recipe, layout)

    seg_files = []
    for i, p in enumerate(plan, 1):
        print(f"   [{i}/{len(plan)}] 렌더링 중…")
        overlays = []
        if p["type"] == "tts":
            png = tmp / f"sub_{i}.png"
            sub_png(p["part"]["text"], p["part"].get("style", "tts"), png)
            overlays.append((png, 0, p["end"] - p["start"]))
        else:
            mode = p["part"].get("sub", "auto")
            style = p["part"].get("style", "celeb")
            if mode == "auto":
                for j, (s, e, text) in enumerate(subs.between(p["start"], p["end"])):
                    png = tmp / f"sub_{i}_{j}.png"
                    sub_png(text, style, png)
                    overlays.append((png, s - p["start"], e - p["start"]))
            elif mode and mode != "none":
                png = tmp / f"sub_{i}.png"
                sub_png(mode, style, png)
                overlays.append((png, 0, p["end"] - p["start"]))
        seg = tmp / f"seg_{i:02d}.mp4"
        render(ff, src, p["start"], p["end"] - p["start"], layout, overlays, p.get("tts"), seg)
        seg_files.append(seg)

    OUT.mkdir(exist_ok=True)
    lst = tmp / "list.txt"
    lst.write_text("".join(f"file '{s.resolve().as_posix()}'\n" for s in seg_files), encoding="utf-8")
    final = OUT / f"쇼츠_{rpath.stem}.mp4"
    run([ff, "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy",
         "-movflags", "+faststart", str(final)], "이어 붙이기")
    print(f"\n✅ 완성: {final}")


if __name__ == "__main__":
    main()
