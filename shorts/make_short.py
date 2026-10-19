"""
레시피(JSON) 한 장으로 쇼츠 영상을 만들어 주는 스크립트.

  원본 클립 → TTS 질문 → 원본 클립 … 순서로 이어 붙이고
  상단 제목 2줄, 하단 링크 안내·출처, 짧게 끊은 자막, 줌 연출까지 넣은 9:16 mp4를 만듭니다.

사용법
  python3 make_short.py recipes/백진희_발뒤꿈치밤.json          # 영상 만들기
  python3 make_short.py recipes/백진희_발뒤꿈치밤.json --check  # 구간 시간만 미리 확인(빠름)
  python3 make_short.py --voice-test                            # TTS 목소리 샘플 비교

처음 한 번 설치
  python3 -m pip install -U "yt-dlp[default]" edge-tts pillow imageio-ffmpeg

TTS
  gemini_key.txt 파일(또는 GEMINI_API_KEY 환경변수)에 구글 AI Studio 키가 있으면
  Gemini TTS(자연스러운 최신 음성)를 쓰고, 없으면 edge-tts(무료, 구형 음성)로 만듭니다.
"""

import argparse
import asyncio
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORK = HERE / "work"   # 원본 영상, TTS, 중간 파일 (지워도 다시 만들어짐)
OUT = HERE / "out"

# 화면 배치 (1080x1920)
W, H = 1080, 1920
# 기본 배치는 celeb_pick 계정 기존 쇼츠를 실측한 값
TOP = 504               # 상단 제목 영역 높이
VH = 912                # 가운데 영상 칸 높이 (TOP ~ TOP+VH)
SUB_Y = TOP + VH - 150  # 자막 세로 위치(영상 칸 아래쪽)
FPS = 30
CHUNK_CHARS = 13        # 자막 한 덩어리 최대 글자 수(띄어쓰기 포함)

THEMES = {
    # celeb_pick 기존 스타일: 검정 배경, 흰 굵은 기울임 제목, [[이름]] 초록 강조, 하단 출처·링크
    "celebpick": {"bg": (0, 0, 0), "title": (255, 255, 255), "hi": (0, 214, 0),
                  "credit": (150, 150, 150), "text": (255, 255, 255)},
    "white": {"bg": (255, 255, 255), "title": (17, 17, 17), "hi": (232, 23, 58),
              "credit": (110, 110, 110), "text": (17, 17, 17)},
}
# 자막 디자인 세트: 레시피 "sub_theme"으로 고름. 각 세트는 셀럽 대사(celeb)와 TTS(tts) 모양을 짝으로 가짐.
# 키: fill 글자색, stroke 테두리색, sw 테두리 두께, box 배경 박스(RGBA), shadow 그림자, size 글자 크기, tail 말풍선 꼬리
SUB_THEMES = {
    "premium": {  # 기본: Pretendard Black 흰 글씨 + 얇은 테두리 + 부드러운 그림자, 핵심 단어는 초록 강조
                  # TTS는 노란 글씨로 구분. 등장할 때 살짝 커지며 '팝' 하고 나타남
        "celeb": {"fill": (255, 255, 255), "stroke": (0, 0, 0), "sw": 6, "shadow": True, "size": 70,
                  "hi": (0, 214, 0)},
        "tts": {"fill": (255, 226, 0), "stroke": (0, 0, 0), "sw": 7, "shadow": True, "size": 74},
    },
    "clean": {   # 반투명 검정 바 + 흰 글씨 / TTS는 채널 초록 바
        "celeb": {"fill": (255, 255, 255), "box": (0, 0, 0, 170), "size": 60},
        "tts": {"fill": (0, 0, 0), "box": (0, 214, 0, 255), "size": 62},
    },
    "variety": {  # 예능 자막: 노란 굵은 글씨 + 두꺼운 테두리 + 그림자 / TTS는 빨간 박스
        "celeb": {"fill": (255, 230, 0), "stroke": (0, 0, 0), "sw": 11, "shadow": True, "size": 74},
        "tts": {"fill": (255, 255, 255), "box": (232, 23, 58, 255), "size": 64},
    },
    "bubble": {   # 말풍선: 흰 풍선 + 검정 글씨 / TTS는 검정 풍선 + 흰 글씨
        "celeb": {"fill": (17, 17, 17), "box": (255, 255, 255, 245), "tail": True, "size": 58},
        "tts": {"fill": (255, 255, 255), "box": (20, 20, 20, 240), "tail": True, "size": 58},
    },
    "minimal": {  # 흰 글씨 + 얇은 테두리 + 부드러운 그림자 / TTS는 초록 글씨
        "celeb": {"fill": (255, 255, 255), "stroke": (0, 0, 0), "sw": 5, "shadow": True, "size": 62},
        "tts": {"fill": (0, 230, 0), "stroke": (0, 0, 0), "sw": 6, "shadow": True, "size": 66},
    },
    "pop": {      # v2 기본: 흰 글씨 + 굵은 검정 테두리 / TTS 노란 박스
        "celeb": {"fill": (255, 255, 255), "stroke": (0, 0, 0), "sw": 10, "size": 72},
        "tts": {"fill": (17, 17, 17), "box": (255, 225, 77, 255), "size": 66},
    },
}
# TTS 음질 보정: 무음 제거 → 저음 컷 → 선명도 → 컴프레서 → 치찰음 → 쇼츠 표준 음량
TTS_POLISH = ("silenceremove=start_periods=1:start_threshold=-50dB:stop_periods=-1:"
              "stop_duration=0.25:stop_threshold=-50dB,highpass=f=80,"
              "equalizer=f=3000:t=q:w=1:g=2,acompressor=threshold=-18dB:ratio=3:attack=5:release=100,"
              "deesser,loudnorm=I=-14:TP=-1.5:LRA=7")
BG_DUCK = 0.07  # TTS 나오는 동안 원본 소리 크기 (1 = 원래 크기)
XFADE = 0.22    # 구간 사이 전환 효과 길이(초)
# 돌아가며 쓰는 전환 효과 (ffmpeg xfade 이름)
TRANSITIONS = ["zoomin", "slideleft", "fadewhite", "smoothup", "circleopen", "slideright"]
PUNCH = 0.10    # 각 구간 시작 0.3초 동안 '툭' 당겼다 풀리는 줌 세기

# Gemini TTS: 위에서부터 차례로 시도 (모델 이름이 바뀌어도 동작하도록)
GEMINI_MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts", "gemini-2.5-flash-tts"]
GEMINI_VOICES = ["Zephyr", "Leda", "Aoede", "Kore", "Autonoe"]  # 여성 음성 후보
GEMINI_STYLE = ("Read the Korean line below aloud as a bright, upbeat, friendly Korean woman in her 20s "
                "who runs a shopping YouTube channel. Natural and slightly fast, curious tone. "
                "Read ONLY the Korean line:")

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
    """줄 단위 (시작, 끝, 글자)."""
    out = []
    for ev in json.loads(raw).get("events", []):
        if "segs" not in ev:
            continue
        text = clean_text("".join(s.get("utf8", "") for s in ev["segs"]))
        if text:
            st = ev.get("tStartMs", 0) / 1000
            out.append((st, st + ev.get("dDurationMs", 2000) / 1000, text))
    return out


def parse_json3_words(raw: str):
    """자동 자막(json3)의 단어 단위 (시작, 끝, 글자). 컷 위치를 정밀하게 잡는 데 사용."""
    words = []
    for ev in json.loads(raw).get("events", []):
        st = ev.get("tStartMs", 0)
        end = st + ev.get("dDurationMs", 0)
        segs = [s for s in ev.get("segs", []) if s.get("utf8", "").strip()]
        for i, s in enumerate(segs):
            ws = st + s.get("tOffsetMs", 0)
            we = st + segs[i + 1].get("tOffsetMs", 0) if i + 1 < len(segs) else max(end, ws + 300)
            words.append((ws / 1000, we / 1000, s["utf8"].strip()))
    return words


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


class Timeline:
    """자막 조각들을 글자 하나하나의 시간표로 펼친다. 조각 안에서는 글자 수 비례로 시간 배분."""

    def __init__(self, items):
        self.text, self.times = "", []
        for s, e, t in sorted(items):
            n = norm(t)
            for i in range(len(n)):
                self.times.append((s + (e - s) * i / len(n), s + (e - s) * (i + 1) / len(n)))
            self.text += n

    def find(self, phrase: str, after: float):
        key = norm(phrase)
        hits, pos = [], self.text.find(key) if key else -1
        while pos != -1:
            hits.append(pos)
            pos = self.text.find(key, pos + 1)
        if not hits:
            return None
        later = [p for p in hits if self.times[p][0] >= after - 0.5]
        p = (later or hits)[0]
        return self.times[p][0], self.times[p + len(key) - 1][1]


class Subs:
    def __init__(self, lines, words=None):
        self.lines = sorted(lines)
        self.by_line = Timeline(self.lines)
        self.by_word = Timeline(words) if words else None

    def find(self, phrase: str, after: float = 0.0):
        """문구가 나오는 (시작, 끝). 단어 단위 자동자막이 있으면 그걸로 더 정밀하게."""
        if not norm(phrase):
            die(f"빈 문구예요: '{phrase}'")
        for tl in (self.by_word, self.by_line):
            if tl:
                hit = tl.find(phrase, after)
                if hit:
                    return hit
        die(f"자막에서 '{phrase}' 문구를 못 찾았어요.\n"
            f"   리포트(out/리포트_*.md)의 자막에서 몇 글자만 그대로 복사해 넣어보세요.")

    def chunks(self, a: float, b: float):
        """[a, b] 구간의 자막을 짧은 덩어리(한 줄)로 쪼개 시간 배분."""
        out = []
        for s, e, text in self.lines:
            if e <= a or s >= b:
                continue
            pieces, cur = [], ""
            for word in text.split(" "):
                if cur and len(cur) + 1 + len(word) > CHUNK_CHARS:
                    pieces.append(cur)
                    cur = word
                else:
                    cur = f"{cur} {word}".strip()
                if re.search(r"[.?!]$", cur):  # 문장 끝에서 끊기
                    pieces.append(cur)
                    cur = ""
            if cur:
                pieces.append(cur)
            total = sum(len(norm(p)) or 1 for p in pieces)
            t = s
            for p in pieces:
                d = (e - s) * (len(norm(p)) or 1) / total
                mid = t + d / 2
                if a <= mid <= b:
                    shown = re.sub(r"[.,]+$", "", p).strip()
                    if shown:
                        out.append((max(t, a), min(t + d, b), shown))
                t += d
        return out


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

        def get(url_):
            return ydl.urlopen(url_).read().decode("utf-8", "replace")

        sub, kind = pick_subtitle(info)
        lines = []
        if sub:
            raw = get(sub["url"])
            lines = parse_json3(raw) if sub["ext"] == "json3" else parse_vtt(raw)
        words = []
        for f in (info.get("automatic_captions") or {}).get("ko", []):
            if f.get("ext") == "json3":
                try:
                    words = parse_json3_words(get(f["url"]))
                except Exception:
                    words = []
                break
        print(f"   자막: {kind or '없음'} {len(lines)}줄, 컷 정밀용 자동자막 단어 {len(words)}개")
    return video, Subs(lines, words), info.get("channel") or info.get("uploader") or ""


def snap(ff: str, src: Path, t: float, edge: str, win: float = 0.6) -> float:
    """컷 위치를 가장 가까운 말 사이 쉼(무음)에 맞춘다. 못 찾으면 그대로."""
    a = max(t - win, 0)
    p = subprocess.run([ff, "-hide_banner", "-ss", f"{a:.3f}", "-t", f"{2 * win:.3f}", "-i", str(src),
                        "-vn", "-af", "silencedetect=n=-30dB:d=0.12", "-f", "null", "-"],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                       encoding="utf-8", errors="replace")
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", p.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", p.stderr)]
    if edge == "start":   # 말이 시작되는 지점(쉼이 끝나는 곳) 직전
        cands = [a + e - 0.06 for e in ends]
    else:                 # 말이 끝나는 지점(쉼이 시작되는 곳) 직후
        cands = [a + s + 0.10 for s in starts]
    cands = [c for c in cands if abs(c - t) <= win]
    return min(cands, key=lambda c: abs(c - t)) if cands else t


# ---------------------------------------------------------------- TTS

def gemini_key():
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    f = HERE / "gemini_key.txt"
    if not key and f.exists():
        key = f.read_text(encoding="utf-8").strip()
    return key or None


def gemini_tts(text: str, voice: str, key: str, pcm_out: Path):
    body = json.dumps({
        "contents": [{"parts": [{"text": f"{GEMINI_STYLE}\n{text}"}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }).encode()
    last = ""
    for model in GEMINI_MODELS:
        req = urllib.request.Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            data=body, headers={"Content-Type": "application/json", "x-goog-api-key": key})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = json.loads(r.read())
            b64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
            pcm_out.write_bytes(base64.b64decode(b64))
            return model
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:300]
            if e.code in (400, 404) and ("not found" in msg.lower() or "not supported" in msg.lower()):
                last = f"{model}: 모델 없음"
                continue  # 다음 모델 이름으로 재시도
            if e.code == 429:
                die("Gemini 무료 사용량을 다 썼어요(잠시 후 다시). 급하면 레시피에 \"tts_engine\": \"edge\"를 넣으세요.")
            if e.code in (401, 403):
                die("Gemini 키가 맞지 않아요. gemini_key.txt 내용을 확인하세요.")
            last = f"{model}: HTTP {e.code} {msg}"
        except (KeyError, IndexError):
            last = f"{model}: 음성이 안 왔어요"
    die(f"Gemini TTS 실패 → {last}\n   레시피에 \"tts_engine\": \"edge\"를 넣으면 무료 구형 음성으로 만들 수 있어요.")


def edge_tts_make(text: str, voice: str, rate: str, mp3_out: Path):
    try:
        import edge_tts
    except ImportError:
        die(f"edge-tts가 없어요. 먼저 실행하세요:\n   {INSTALL}")

    async def go():
        await edge_tts.Communicate(text, voice, rate=rate).save(str(mp3_out))

    try:
        asyncio.run(go())
    except Exception as e:
        die(f"TTS 만들기 실패: {e}")


def make_tts(text: str, recipe: dict, ff: str) -> Path:
    WORK.mkdir(exist_ok=True)
    key = gemini_key()
    engine = recipe.get("tts_engine") or ("gemini" if key else "edge")
    if engine == "gemini" and not key:
        die("Gemini 키가 없어요. shorts 폴더에 gemini_key.txt를 만들고 키를 붙여넣으세요.")
    voice = recipe.get("gemini_voice", GEMINI_VOICES[0]) if engine == "gemini" \
        else recipe.get("voice", "ko-KR-SunHiNeural")
    tag = hashlib.md5(f"{engine}|{voice}|{recipe.get('rate')}|{GEMINI_STYLE}|{text}".encode()).hexdigest()[:10]
    clean = WORK / f"tts_{tag}.wav"
    if clean.exists():
        return clean
    if engine == "gemini":
        raw = WORK / f"tts_{tag}.pcm"
        gemini_tts(text, voice, key, raw)
        src = ["-f", "s16le", "-ar", "24000", "-ac", "1", "-i", str(raw)]
    else:
        raw = WORK / f"tts_{tag}.mp3"
        edge_tts_make(text, voice, recipe.get("rate", "+10%"), raw)
        src = ["-i", str(raw)]
    speed = float(recipe.get("tts_speed", 1.08 if engine == "gemini" else 1.0))
    af = (f"atempo={speed}," if abs(speed - 1) > 0.01 else "") + TTS_POLISH
    run([ff, "-y", *src, "-af", af, "-ar", "44100", "-ac", "2", str(clean)], "TTS 음질 보정")
    return clean


# ---------------------------------------------------------------- 글자 그림

_FONTS = None


def _faces(path: Path):
    """폰트 파일 안의 (굵은 면, 보통 면) 번호."""
    rank = ["Heavy", "Black", "ExtraBold", "Bold", "SemiBold"]
    bold, regular = (len(rank), 0), 0
    for idx in range(20 if path.suffix.lower() == ".ttc" else 1):
        try:
            style = ImageFont.truetype(str(path), 20, index=idx).getname()[1].replace(" ", "").lower()
        except OSError:
            break
        if style in ("regular", "medium", "book"):
            regular = idx
        for r, word in enumerate(rank):
            if word.lower() in style and r < bold[0]:
                bold = (r, idx)
    return bold[1], regular


def _pick_fonts():
    """(본문 굵게, 본문 보통, 제목) 폰트.
    우선순위: shorts/fonts 폴더(직접 넣은 폰트) → 함께 들어있는 Pretendard → 시스템 폰트.
    제목 전용은 fonts/title.ttf(또는 .otf)로 넣으면 됩니다."""
    fdir = HERE / "fonts"
    mine = sorted(fdir.glob("*.[ot]t[fc]")) if fdir.exists() else []
    title = next((p for p in mine if p.stem.lower() == "title"), None)
    body = [p for p in mine if p.stem.lower() != "title"]
    if body:
        b, r = _faces(body[0])
        bold, regular = (str(body[0]), b), (str(body[0]), r)
    else:
        bundled = HERE / "assets" / "fonts"
        black, reg = bundled / "Pretendard-Black.otf", bundled / "Pretendard-Regular.otf"
        if black.exists() and reg.exists():
            bold, regular = (str(black), 0), (str(reg), 0)
        else:
            for path in [Path(p) for p in (
                "/System/Library/Fonts/AppleSDGothicNeo.ttc",
                "C:/Windows/Fonts/malgunbd.ttf",
                "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
            )]:
                if path.exists():
                    b, r = _faces(path)
                    bold, regular = (str(path), b), (str(path), r)
                    break
            else:
                die("한글 폰트를 찾지 못했어요. shorts/fonts 폴더에 .ttf/.otf 폰트를 하나 넣어주세요.")
    return bold, regular, ((str(title), 0) if title else bold)


def font(size: int, kind: str = "bold"):
    global _FONTS
    if _FONTS is None:
        _FONTS = _pick_fonts()
    path, idx = _FONTS[{"bold": 0, "regular": 1, "title": 2}[kind]]
    return ImageFont.truetype(path, size, index=idx)


def fit(draw, text: str, max_w: int, size: int, min_size: int = 36, kind: str = "bold"):
    while size > min_size and draw.textlength(text, font=font(size, kind)) > max_w:
        size -= 2
    return font(size, kind)


def centered(draw, y: int, text: str, f, fill, stroke=None, stroke_w=0):
    w = draw.textlength(text, font=f)
    draw.text(((W - w) / 2, y), text, font=f, fill=fill, stroke_width=stroke_w, stroke_fill=stroke)


def title_line(img, text: str, cy: int, th: dict, size: int, italic: float):
    """제목 한 줄. [[이름]]은 강조색. italic>0이면 기울임(기존 계정 제목처럼)."""
    parts = [(p[2:-2], th["hi"]) if p.startswith("[[") else (p, th["title"])
             for p in re.split(r"(\[\[.*?\]\])", text) if p]
    plain = "".join(t for t, _ in parts)
    probe = ImageDraw.Draw(img)
    while size > 50 and probe.textlength(plain, font=font(size, "title")) > W - 90:
        size -= 2
    f = font(size, "title")
    lh = int(size * 1.5)
    layer = Image.new("RGBA", (W, lh), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x = (W - d.textlength(plain, font=f)) / 2
    for t, color in parts:
        d.text((x, lh / 2), t, font=f, fill=color, anchor="lm")
        x += d.textlength(t, font=f)
    if italic:
        layer = layer.transform(layer.size, Image.AFFINE, (1, italic, -italic * lh / 2, 0, 1, 0),
                                resample=Image.BICUBIC)
    img.alpha_composite(layer, (0, int(cy - lh / 2)))


def layout_png(recipe: dict, path: Path):
    th = THEMES.get(recipe.get("theme", "celebpick"), THEMES["celebpick"])
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, TOP], fill=th["bg"])
    d.rectangle([0, TOP + VH, W, H], fill=th["bg"])
    italic = float(recipe.get("title_italic", 0.2))
    if recipe.get("title2"):
        title_line(img, recipe["title1"], 301, th, 104, italic)
        title_line(img, recipe["title2"], 420, th, 104, italic)
    else:
        title_line(img, recipe["title1"], 360, th, 104, italic)
    # 하단: 출처(회색) → (선택) DM 안내 → 프로필 링크
    y = TOP + VH + 52
    if recipe.get("credit"):
        d.text((W / 2, y), recipe["credit"], font=fit(d, recipe["credit"], W - 120, 30, kind="regular"),
               fill=th["credit"], anchor="mm")
        y += 46
    if recipe.get("dm_text"):
        d.text((W / 2, y), recipe["dm_text"], font=fit(d, recipe["dm_text"], W - 100, 34, kind="regular"),
               fill=th["text"], anchor="mm")
        y += 56
    if recipe.get("link_text"):
        d.text((W / 2, y), recipe["link_text"], font=fit(d, recipe["link_text"], W - 120, 38),
               fill=th["text"], anchor="mm")
    img.save(path)


_HI_WORDS = None


def hi_words():
    """강조할 단어: keywords.txt의 키워드(2글자 이상)."""
    global _HI_WORDS
    if _HI_WORDS is None:
        _HI_WORDS = []
        kw = HERE / "keywords.txt"
        if kw.exists():
            for line in kw.read_text(encoding="utf-8").splitlines():
                line = line.split("#", 1)[0]
                _HI_WORDS += [w.strip() for w in line.split(",")
                              if len(w.strip()) >= 2 and not w.strip().startswith("!")]
    return _HI_WORDS


def is_hi(word: str) -> bool:
    n = norm(word)
    return bool(re.search(r"\d", n)) or any(norm(k) in n for k in hi_words() if norm(k))


def sub_png(text: str, role: str, path: Path, theme: str = "premium", scale: float = 1.0):
    """자막 한 장(투명 PNG). role: celeb / tts. scale<1이면 '팝' 등장용 작은 버전."""
    st = SUB_THEMES.get(theme, SUB_THEMES["premium"]).get(role) or SUB_THEMES["premium"]["celeb"]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    max_w = W - 160
    size = int(st["size"] * scale)
    lines = [text]
    f = fit(d, text, max_w, size, int(size * 0.85))
    if d.textlength(text, font=f) > max_w:  # 너무 길면 줄이기 대신 두 줄로 고르게 나눔
        words = text.split(" ")
        best = min(range(1, len(words)) or [1],
                   key=lambda k: max(d.textlength(" ".join(words[:k]), font=f),
                                     d.textlength(" ".join(words[k:]), font=f)))
        lines = [" ".join(words[:best]), " ".join(words[best:])]
        f = font(size)
        while f.size > 40 and max(d.textlength(l, font=f) for l in lines) > max_w:
            f = font(f.size - 2)
    lh = int(f.size * 1.32)
    y0 = SUB_Y - (len(lines) - 1) * lh
    cy = [y0 + i * lh + f.size / 2 for i in range(len(lines))]
    sw = max(int(st.get("sw", 0) * scale), 0)

    if st.get("box"):
        tw = max(d.textlength(l, font=f) for l in lines)
        px, py = int(f.size * 0.55), int(f.size * 0.38)
        box = [(W - tw) / 2 - px, cy[0] - f.size / 2 - py, (W + tw) / 2 + px, cy[-1] + f.size / 2 + py]
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.rounded_rectangle(box, radius=int(f.size * 0.45), fill=st["box"])
        if st.get("tail"):  # 말풍선 꼬리
            x0 = W / 2 - 40
            ld.polygon([(x0, box[3] - 2), (x0 + 44, box[3] - 2), (x0 + 6, box[3] + 30)], fill=st["box"])
        img.alpha_composite(layer)
    if st.get("shadow"):
        from PIL import ImageFilter
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        for c, line in zip(cy, lines):
            sd.text((W / 2 + 5, c + 6), line, font=f, fill=(0, 0, 0, 170), anchor="mm",
                    stroke_width=sw, stroke_fill=(0, 0, 0, 170))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
    d = ImageDraw.Draw(img)
    for c, line in zip(cy, lines):
        if not st.get("hi"):
            d.text((W / 2, c), line, font=f, fill=st["fill"], anchor="mm",
                   stroke_width=sw, stroke_fill=st.get("stroke"))
            continue
        # 단어별로 색을 달리해서 왼쪽부터 이어 그림 (핵심 단어 강조)
        words = line.split(" ")
        space = d.textlength(" ", font=f)
        x = W / 2 - d.textlength(line, font=f) / 2
        for w_ in words:
            color = st["hi"] if is_hi(w_) else st["fill"]
            d.text((x, c), w_, font=f, fill=color, anchor="lm", stroke_width=sw, stroke_fill=st.get("stroke"))
            x += d.textlength(w_, font=f) + space
    img.save(path)


# ---------------------------------------------------------------- 렌더링

def render(ff: str, src: Path, t0: float, dur: float, subs: list, tts: Path | None,
           out: Path, zoom: tuple[float, float], crop_bottom: float, punch: float):
    """한 구간을 영상 칸(+자막)만 렌더링. 제목·하단 글씨는 마지막에 한 번에 얹는다.
    subs: [(png, 시작, 끝)] (구간 기준 상대 시간). zoom: (처음 배율, 끝 배율)"""
    cmd = [ff, "-y", "-ss", f"{t0:.3f}", "-t", f"{dur:.3f}", "-i", str(src)]
    for png, _, _ in subs:
        cmd += ["-i", str(png)]
    if tts:
        cmd += ["-i", str(tts)]

    zw, zh = int(W * 1.5), int(VH * 1.5)  # 크게 키운 뒤 줌 → 떨림 없이 부드럽게
    frames = max(int(dur * FPS), 1)
    z0, z1 = zoom
    zexpr = f"{z0}+({z1}-{z0})*on/{frames}+{punch}*max(0,1-on/{int(0.3 * FPS)})"
    fg = [f"[0:v]crop=iw:ih*{1 - crop_bottom:.3f}:0:0,"            # 원본 영상 아래쪽(박혀 있는 자막) 잘라내기
          f"scale={zw}:{zh}:force_original_aspect_ratio=increase,crop={zw}:{zh},setsar=1,fps={FPS},"
          f"zoompan=z='{zexpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{VH}:fps={FPS},"
          f"pad={W}:{H}:0:{TOP}:black[b0]"]
    last = "b0"
    for i, (_, a, b) in enumerate(subs):
        fg.append(f"[{last}][{i + 1}:v]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'[s{i}]")
        last = f"s{i}"
    fg.append(f"[{last}]format=yuv420p[vout]")
    fade = f"afade=t=in:d=0.04,afade=t=out:st={max(dur - 0.06, 0):.3f}:d=0.06"
    if tts:
        ti = len(subs) + 1
        fg.append(f"[0:a]aresample=44100,volume={BG_DUCK}[bg]")
        fg.append(f"[{ti}:a]aresample=44100,adelay=260|260[t]")
        fg.append(f"[bg][t]amix=inputs=2:duration=first:normalize=0,apad,atrim=0:{dur:.3f},{fade}[aout]")
    else:
        fg.append(f"[0:a]aresample=44100,loudnorm=I=-14:TP=-1.5:LRA=11,apad,atrim=0:{dur:.3f},{fade}[aout]")

    cmd += ["-filter_complex", ";".join(fg), "-map", "[vout]", "-map", "[aout]",
            "-t", f"{dur:.3f}", "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
            "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2", str(out)]
    run(cmd, f"구간 렌더링({out.name})")


def resolve(v, subs: Subs, after: float, edge: str) -> tuple[float, bool]:
    """(시간, 문구로찾았는지). 시간 문자열이면 그대로, 문구면 자막에서 찾은 시작/끝."""
    if isinstance(v, (int, float)) or TIME_RE.match(str(v).strip()):
        return parse_time(v), False
    s, e = subs.find(str(v), after)
    return (s if edge == "start" else e), True


def plan_parts(recipe, subs: Subs, ff: str, src: Path | None, check: bool):
    """레시피를 실제 시간표로 바꾼다."""
    plan, cursor = [], 0.0
    for n, part in enumerate(recipe["parts"], 1):
        kind = part.get("type")
        if kind == "clip":
            a, fa = resolve(part["from"], subs, cursor, "start")
            b, fb = resolve(part["to"], subs, a, "end")
            if src and not check:
                a = snap(ff, src, a, "start") if fa else a
                b = snap(ff, src, b, "end") if fb else b
            a += float(part.get("pad_start", 0))
            b += float(part.get("pad_end", 0))
            if b <= a:
                die(f"{n}번 구간: 끝이 시작보다 빨라요 ({fmt(a)} ~ {fmt(b)})")
            plan.append({"type": "clip", "start": max(a, 0), "end": b, "part": part})
            cursor = b
        elif kind == "tts":
            at, _ = resolve(part.get("over", cursor), subs, cursor, "start")
            if check:
                tts, dur = None, 1.5 + len(part["text"]) * 0.11  # 대략치
            else:
                tts = make_tts(part["text"], recipe, ff)
                dur = duration_of(ff, tts) + 0.5
            plan.append({"type": "tts", "start": at, "end": at + dur, "tts": tts, "part": part})
        else:
            die(f"{n}번 구간: type은 clip 또는 tts 여야 해요.")
    return plan


def voice_test(ff: str):
    """같은 문장을 여러 목소리로 만들어 out/목소리_*.wav로 저장."""
    OUT.mkdir(exist_ok=True)
    line = "3천 원짜리로 발뒤꿈치 관리를 한다고?"
    if not gemini_key():
        die("Gemini 키가 없어요. shorts 폴더에 gemini_key.txt를 만들고 키를 붙여넣은 뒤 다시 실행하세요.")
    for v in GEMINI_VOICES:
        print(f"   {v} 만드는 중…")
        p = make_tts(line, {"tts_engine": "gemini", "gemini_voice": v}, ff)
        shutil.copy(p, OUT / f"목소리_{v}.wav")
    print(f"\n✅ out 폴더의 목소리_*.wav를 들어보고, 마음에 드는 이름을 레시피 \"gemini_voice\"에 적으세요.")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description="레시피로 쇼츠 만들기")
    ap.add_argument("recipe", nargs="?", help="레시피 JSON 파일")
    ap.add_argument("--check", action="store_true", help="영상은 만들지 않고 구간 시간만 확인")
    ap.add_argument("--voice-test", action="store_true", help="Gemini 목소리 샘플 만들기")
    ap.add_argument("--video", help="(선택) 이미 받아둔 원본 영상 파일")
    ap.add_argument("--subs", help="(선택) --video와 함께 쓸 자막 파일(.vtt/.json3)")
    ap.add_argument("--asr", help="(선택) --video와 함께 쓸 자동자막 json3(컷 정밀용)")
    args = ap.parse_args()

    ff = ffmpeg_exe()
    if args.voice_test:
        voice_test(ff)
        return
    if not args.recipe:
        ap.print_help()
        sys.exit(1)

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

    print(f"🎬 {rpath.stem}")
    if args.video:
        src = Path(args.video)
        lines, words = [], []
        if args.subs:
            raw = Path(args.subs).read_text(encoding="utf-8")
            lines = parse_json3(raw) if args.subs.endswith(".json3") else parse_vtt(raw)
        if args.asr:
            words = parse_json3_words(Path(args.asr).read_text(encoding="utf-8"))
        subs, channel = Subs(lines, words), ""
    else:
        src, subs, channel = fetch_source(recipe["source"], ff)
    recipe.setdefault("credit", f"출처 : {channel}" if channel else "")
    crop_bottom = float(recipe.get("src_crop_bottom", 0.2))

    plan = plan_parts(recipe, subs, ff, src, args.check)
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
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)
    layout = tmp / "layout.png"
    layout_png(recipe, layout)

    sub_theme = recipe.get("sub_theme", "premium")
    def pop(png: Path, text: str, role: str, a: float, b: float):
        """자막이 살짝 작게 나왔다가 제 크기로 '팝' — 앞 0.07초만 작은 버전."""
        if b - a < 0.25:
            return [(png, a, b)]
        small = png.with_name(png.stem + "_s.png")
        sub_png(text, role, small, sub_theme, 0.86)
        return [(small, a, a + 0.07), (png, a + 0.07, b)]

    seg_files, clip_no = [], 0
    for i, p in enumerate(plan, 1):
        print(f"   [{i}/{len(plan)}] 렌더링 중…")
        dur = p["end"] - p["start"]
        overlays = []
        if p["type"] == "tts":
            png = tmp / f"sub_{i}.png"
            sub_png(p["part"]["text"], "tts", png, sub_theme)
            overlays += pop(png, p["part"]["text"], "tts", 0, dur)
            zoom = (1.15, 1.22)          # TTS: 확 당겨서 시선 집중
        else:
            mode = p["part"].get("sub", "auto")
            if mode == "auto":
                for j, (s, e, text) in enumerate(subs.chunks(p["start"], p["end"])):
                    png = tmp / f"sub_{i}_{j}.png"
                    sub_png(text, "celeb", png, sub_theme)
                    overlays += pop(png, text, "celeb", s - p["start"], e - p["start"])
            elif mode and mode != "none":
                png = tmp / f"sub_{i}.png"
                sub_png(mode, "celeb", png, sub_theme)
                overlays.append((png, 0, dur))
            zoom = (1.0, 1.08) if clip_no % 2 == 0 else (1.08, 1.0)  # 줌인/줌아웃 번갈아
            clip_no += 1
        seg = tmp / f"seg_{i:02d}.mp4"
        punch = PUNCH if recipe.get("punch_zoom", True) else 0.0
        render(ff, src, p["start"], dur, overlays, p.get("tts"), seg, zoom, crop_bottom, punch)
        seg_files.append((seg, dur))

    OUT.mkdir(exist_ok=True)
    final = OUT / f"쇼츠_{rpath.stem}.mp4"
    print("   이어 붙이는 중…")
    assemble(ff, seg_files, layout, tmp, final,
             transitions=recipe.get("transitions", True), sfx=recipe.get("sfx", True))
    print(f"\n✅ 완성: {final}")


def assemble(ff: str, segs: list, layout: Path, tmp: Path, final: Path, transitions: bool, sfx: bool):
    """구간들을 전환 효과(xfade)로 잇고, 제목·하단 레이아웃을 얹고, 전환 때 '슉' 효과음을 넣는다."""
    n = len(segs)
    cmd = [ff, "-y"]
    for seg, _ in segs:
        cmd += ["-i", str(seg)]
    cmd += ["-loop", "1", "-i", str(layout)]
    li = n
    use_x = transitions and n > 1
    T = XFADE if use_x else 0.0
    fg, offsets = [], []
    if use_x:
        lv, la, acc = "0:v", "0:a", 0.0
        for k in range(1, n):
            acc += segs[k - 1][1] - T
            offsets.append(acc)
            tr = TRANSITIONS[(k - 1) % len(TRANSITIONS)]
            fg.append(f"[{lv}][{k}:v]xfade=transition={tr}:duration={T}:offset={acc:.3f}[xv{k}]")
            fg.append(f"[{la}][{k}:a]acrossfade=d={T}[xa{k}]")
            lv, la = f"xv{k}", f"xa{k}"
    else:
        fg.append("".join(f"[{k}:v][{k}:a]" for k in range(n)) + f"concat=n={n}:v=1:a=1[xv][xa]")
        lv, la = "xv", "xa"
        acc = 0.0
        for k in range(1, n):
            acc += segs[k - 1][1]
            offsets.append(acc)
    total = sum(d for _, d in segs) - T * (n - 1)
    fg.append(f"[{lv}][{li}:v]overlay=0:0:shortest=1,format=yuv420p[vout]")
    if sfx and offsets:
        whoosh = tmp / "whoosh.wav"
        run([ff, "-y", "-f", "lavfi", "-i", "anoisesrc=d=0.35:c=pink:a=0.6",
             "-af", "highpass=f=700,lowpass=f=7000,afade=t=in:d=0.2:curve=exp,"
                    "afade=t=out:st=0.2:d=0.15,volume=0.22", "-ar", "44100", "-ac", "2", str(whoosh)],
            "효과음 만들기")
        cmd += ["-i", str(whoosh)]
        wi = n + 1
        m = len(offsets)
        fg.append(f"[{wi}:a]asplit={m}" + "".join(f"[w{j}]" for j in range(m)) if m > 1 else f"[{wi}:a]anull[w0]")
        for j, o in enumerate(offsets):
            ms = max(int((o + T / 2 - 0.2) * 1000), 0)
            fg.append(f"[w{j}]adelay={ms}|{ms}[wd{j}]")
        fg.append(f"[{la}]" + "".join(f"[wd{j}]" for j in range(m)) +
                  f"amix=inputs={m + 1}:duration=first:normalize=0[aout]")
    else:
        fg.append(f"[{la}]anull[aout]")
    cmd += ["-filter_complex", ";".join(fg), "-map", "[vout]", "-map", "[aout]", "-t", f"{total:.3f}",
            "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
            "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2", "-movflags", "+faststart", str(final)]
    run(cmd, "이어 붙이기")


if __name__ == "__main__":
    main()
