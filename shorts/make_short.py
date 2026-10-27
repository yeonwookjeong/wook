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
# 테마별 배치: (TOP, VH, SUB_Y). story는 참고 채널 실측(흰 상단 458px + 아래 전체 영상)
LAYOUTS = {"celebpick": (504, 912, 504 + 912 - 150), "white": (504, 912, 504 + 912 - 150),
           "story": (458, 1920 - 458, 1250)}


def use_layout(theme: str):
    global TOP, VH, SUB_Y
    TOP, VH, SUB_Y = LAYOUTS.get(theme, LAYOUTS["celebpick"])
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
    "story": {    # 참고 채널 스타일: 셀럽 대사는 “따옴표” + 노랑 강조, 내레이션(TTS)은 흰 글씨
        "celeb": {"fill": (255, 255, 255), "stroke": (0, 0, 0), "sw": 7, "shadow": True, "size": 64,
                  "hi": (248, 216, 8), "quote": True},
        "tts": {"fill": (255, 255, 255), "stroke": (0, 0, 0), "sw": 7, "shadow": True, "size": 66,
                "hi": (248, 216, 8)},
    },
    "story_green": {  # story 자막 + 채널 초록 강조 (celebpick 레이아웃과 색 맞춤)
        "celeb": {"fill": (255, 255, 255), "stroke": (0, 0, 0), "sw": 7, "shadow": True, "size": 62,
                  "hi": (0, 214, 0), "quote": True},
        "tts": {"fill": (255, 255, 255), "stroke": (0, 0, 0), "sw": 7, "shadow": True, "size": 64,
                "hi": (0, 214, 0)},
    },
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
# 가볍게만 손봄: 앞뒤 무음만 자르고(문장 중간 숨 쉬는 틈은 살림) 저음 잡음 컷 + 음량 맞춤.
# 과한 압축·치찰음 제거·배속은 기계음처럼 들리게 만들어서 뺐음.
_TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03"
TTS_POLISH = (f"{_TRIM},areverse,{_TRIM},areverse,highpass=f=70,"
              "acompressor=threshold=-20dB:ratio=1.8:attack=10:release=150,loudnorm=I=-15:TP=-1.5:LRA=9")
BG_DUCK = 0.07  # TTS 나오는 동안 원본 소리 크기 (1 = 원래 크기)
XFADE = 4 / 30  # 구간(장면) 사이 부드러운 디졸브 길이(초, 4프레임)
HARD = 2 / 30   # 같은 장면 안에서 쉼을 잘라낸 곳: 사실상 컷(2프레임 겹침. 더 짧으면 ffmpeg가 끊김)


def video_len(ff: str, path: Path) -> float:
    """영상 스트림의 실제 길이(프레임 수 / FPS). 파일 정보의 길이는 소리 기준이라 미세하게 다름."""
    p = subprocess.run([ff, "-hide_banner", "-i", str(path), "-map", "0:v", "-c", "copy", "-f", "null", "-"],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    n = re.findall(r"frame=\s*(\d+)", p.stderr)
    return int(n[-1]) / FPS if n else duration_of(ff, path)


def frames(sec: float) -> float:
    """길이를 프레임 단위로 딱 맞춤 (이어 붙일 때 어긋나서 멈추는 것 방지)."""
    return max(round(sec * FPS), 3) / FPS
# 돌아가며 쓰는 전환 효과 (ffmpeg xfade 이름)
TRANSITIONS = ["zoomin", "slideleft", "fadewhite", "smoothup", "circleopen", "slideright"]
PUNCH = 0.10    # 각 구간 시작 0.3초 동안 '툭' 당겼다 풀리는 줌 세기

# Gemini TTS: 위에서부터 차례로 시도 (모델 이름이 바뀌어도 동작하도록)
GEMINI_MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts", "gemini-2.5-flash-tts"]
GEMINI_VOICES = ["Zephyr", "Leda", "Aoede", "Kore", "Autonoe"]  # 여성 음성 후보
GEMINI_STYLE = ("You are a Korean woman in her mid-20s chatting casually with a close friend, "
                "genuinely surprised and curious. Speak in natural spoken Korean with lively intonation, "
                "a little faster than normal, like a real person reacting in a TikTok video, "
                "not like an announcer or narrator. Say only this line:")

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
    t = round(max(sec, 0), 1)
    m, s = divmod(t, 60)
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
        w = self.by_word.find(phrase, after) if self.by_word else None
        line = self.by_line.find(phrase, after) if self.by_line else None
        # 자동자막은 받아쓰기가 틀릴 수 있어서, 줄 자막과 2.5초 넘게 어긋나면 줄 자막을 믿음
        if w and line and abs(w[0] - line[0]) > 2.5:
            return line
        if w or line:
            return w or line
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

def _video_id(url: str) -> str | None:
    m = re.search(r"(?:youtu\.be/|v=|shorts/)([\w-]{11})", url)
    return m.group(1) if m else None


def _register(video: Path, meta: dict, url: str, main: bool):
    _INFOS[str(video)] = {"duration": meta.get("duration") or 0, "heatmap": meta.get("heatmap") or [],
                          "license": meta.get("license") or ""}
    if main and not _ORIGIN:
        _ORIGIN.update({"title": meta.get("title", ""), "url": meta.get("url") or url,
                        "channel": meta.get("channel", ""), "license": meta.get("license", "")})
    if main and "creative commons" not in (meta.get("license") or "").lower():
        print(f"   ⚠️ 이 영상은 크리에이티브 커먼즈가 아니에요: {meta.get('url') or url}")


def fetch_source(url: str, ff: str, height: int = 1080, main: bool = True):
    """영상·자막·정보를 받아옴. 한 번 받은 건 work 폴더에 저장해두고 다음부터는 인터넷 없이 씀
    (유튜브에 자주 요청하면 'HTTP Error 429: Too Many Requests'로 막히기 때문)."""
    WORK.mkdir(exist_ok=True)
    vid = _video_id(url)
    cache = WORK / f"{vid}_info.json" if vid else None
    if cache and cache.exists():
        meta = json.loads(cache.read_text(encoding="utf-8"))
        video = WORK / meta["file"]
        if video.exists() and (meta.get("has_subs") or not main):
            print(f"   원본 영상·자막: 저장해둔 것 사용 ({vid})")
            _register(video, meta, url, main)
            lines = [tuple(x) for x in meta.get("lines", [])]
            words = [tuple(x) for x in meta.get("words", [])]
            return video, Subs(lines, words), meta.get("channel", "")

    try:
        import yt_dlp
    except ImportError:
        die(f"yt-dlp가 없어요. 먼저 실행하세요:\n   {INSTALL}")
    sys.path.insert(0, str(HERE))
    from scan import pick_subtitle  # 스캐너와 같은 자막 선택 규칙 사용

    opts = {
        "quiet": True, "no_warnings": True,
        "format": (f"bv*[height<={height}][ext=mp4]+ba[ext=m4a]/b[height<={height}][ext=mp4]/"
                   f"bv*[height<={height}]+ba/b"),
        "merge_output_format": "mp4",
        "outtmpl": str(WORK / "%(id)s.%(ext)s"),
        "ffmpeg_location": ff,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
        except Exception as e:
            if "429" in str(e):
                die("유튜브가 잠시 요청을 막았어요(429). 10~30분 뒤에 다시 실행해 주세요.")
            raise
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

        lines, words, kind = [], [], None
        if main:  # 도입부 자료 영상은 자막 필요 없음
            sub, kind = pick_subtitle(info)
            if sub:
                try:
                    raw = get(sub["url"])
                    lines = parse_json3(raw) if sub["ext"] == "json3" else parse_vtt(raw)
                except Exception as e:
                    if "429" in str(e):
                        die("유튜브가 잠시 요청을 막았어요(429). 10~30분 뒤에 다시 실행해 주세요.")
                    raise
            for f in (info.get("automatic_captions") or {}).get("ko", []):
                if f.get("ext") == "json3":
                    try:
                        words = parse_json3_words(get(f["url"]))
                    except Exception:
                        words = []
                    break
            print(f"   자막: {kind or '없음'} {len(lines)}줄, 컷 정밀용 자동자막 단어 {len(words)}개")

    meta = {"file": video.name, "duration": info.get("duration") or 0, "heatmap": info.get("heatmap") or [],
            "license": info.get("license") or "", "title": info.get("title", ""),
            "url": info.get("webpage_url") or url, "channel": info.get("channel") or info.get("uploader") or "",
            "has_subs": bool(lines) or main, "lines": lines, "words": words}
    (WORK / f"{info['id']}_info.json").write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")
    _register(video, meta, url, main)
    return video, Subs(lines, words), meta["channel"]


_INFOS = {}  # 받아온 영상별 길이·'많이 다시 본 구간' 정보
_ORIGIN = {}  # 메인 원본 영상 정보 (출처 표기용)


_FACE = None


def _face_area(img) -> float:
    """얼굴이 화면에서 차지하는 비율(0~1). opencv가 설치돼 있을 때만 계산, 없으면 0."""
    global _FACE
    try:
        import cv2
        import numpy as np
    except ImportError:
        return 0.0
    if _FACE is None:
        try:  # OpenCV 4.x에만 있는 얼굴 찾기 기능. 없으면 얼굴 점수 없이 진행
            _FACE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        except AttributeError:
            _FACE = False
    if _FACE is False:
        return 0.0
    g = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2GRAY)
    faces = _FACE.detectMultiScale(g, scaleFactor=1.15, minNeighbors=5, minSize=(24, 24))
    if len(faces) == 0:
        return 0.0
    w, h = img.size
    return max(fw * fh for (_, _, fw, fh) in faces) / (w * h)


def frame_score(ff: str, video: Path, t: float) -> float:
    """이 장면이 얼마나 '예쁘고 멋진지' 대략 점수: 선명함 + 색감 + 적당한 밝기 + 얼굴 크기."""
    from PIL import ImageFilter, ImageStat
    tmpf = WORK / "_score.jpg"
    p = subprocess.run([ff, "-y", "-v", "error", "-ss", f"{t:.2f}", "-i", str(video), "-frames:v", "1",
                        "-vf", "scale=320:-2", str(tmpf)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode != 0 or not tmpf.exists():
        return -1.0
    img = Image.open(tmpf).convert("RGB")
    gray = img.convert("L")
    sharp = ImageStat.Stat(gray.filter(ImageFilter.FIND_EDGES)).mean[0] / 40       # 흐릿하면 낮음
    bright = ImageStat.Stat(gray).mean[0] / 255
    r, g, b = [ImageStat.Stat(c).stddev[0] for c in img.split()]
    rm, gm, bm = ImageStat.Stat(img).mean
    color = (abs(rm - gm) + abs(gm - bm) + abs(bm - rm)) / 255 + (r + g + b) / 3 / 128  # 색감·대비
    bright_ok = 1 - abs(bright - 0.55) * 2                                             # 너무 어둡/밝으면 감점
    face = _face_area(img)
    face_bonus = min(face / 0.08, 1.0) * 1.5                                           # 얼굴이 크게 나오면 가점
    return min(sharp, 1.5) * 0.9 + min(color, 1.5) * 0.6 + bright_ok * 0.6 + face_bonus


_MOMENTS = {}


def auto_moments(video: Path, ff: str, count: int = 8) -> list[float]:
    """자동으로 고른 '예쁜' 장면 시각들. 많이 다시 본 구간 + 영상 전체 후보 중 화면 점수가 높은 순."""
    if str(video) in _MOMENTS:
        return _MOMENTS[str(video)]
    info = _INFOS.get(str(video), {})
    dur = info.get("duration") or duration_of(ff, video)
    cands = [h["start_time"] + 1 for h in sorted(info.get("heatmap", []), key=lambda x: -x.get("value", 0))[:6]]
    cands += [dur * (0.08 + 0.84 * i / 17) for i in range(18)]
    cands = [t for t in cands if 3 < t < dur - 5]
    print(f"      🖼️ 예쁜 장면 고르는 중… (후보 {len(cands)}개)")
    scored = sorted(((frame_score(ff, video, t), t) for t in cands), reverse=True)
    picks = []
    for sc, t in scored:
        if sc > 0 and all(abs(t - q) >= 10 for q in picks):
            picks.append(t)
        if len(picks) == count:
            break
    _MOMENTS[str(video)] = picks or [dur * 0.3]
    return _MOMENTS[str(video)]


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


def gemini_tts(text: str, voice: str, key: str, pcm_out: Path, style: str = GEMINI_STYLE):
    body = json.dumps({
        "contents": [{"parts": [{"text": f"{style}\n{text}"}]}],
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


# ---------------- ElevenLabs (유료 Starter $5/월부터 상업적 사용 가능 — 가장 자연스러운 한국어 TTS)

ELEVEN_MODELS = ["eleven_v3", "eleven_multilingual_v2"]  # 위에서부터 시도


def eleven_key():
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    f = HERE / "elevenlabs_key.txt"
    if not key and f.exists():
        key = f.read_text(encoding="utf-8").strip()
    return key or None


def _eleven(method: str, path: str, key: str, body: dict | None = None):
    req = urllib.request.Request(f"https://api.elevenlabs.io{path}", method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def eleven_voices(key: str):
    try:
        return json.loads(_eleven("GET", "/v1/voices", key)).get("voices", [])
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            die("ElevenLabs 키가 맞지 않아요. elevenlabs_key.txt 내용을 확인하세요.")
        die(f"ElevenLabs 목소리 목록을 못 불러왔어요 (HTTP {e.code}).")


def _is_korean(v: dict) -> bool:
    blob = json.dumps(v.get("labels", {}), ensure_ascii=False).lower() + " " + v.get("name", "").lower()
    langs = " ".join(str(x.get("language", "")) for x in v.get("verified_languages", []) or [])
    return "korean" in blob or "한국" in blob or " ko" in f" {langs}"


def pick_eleven_voice(recipe: dict, key: str) -> str:
    if recipe.get("eleven_voice"):
        return recipe["eleven_voice"]
    voices = eleven_voices(key)
    ko = [v for v in voices if _is_korean(v)]
    if not ko:
        die("ElevenLabs '내 목소리'에 한국어 목소리가 없어요.\n"
            "   elevenlabs.io → Voices → Voice Library에서 'Korean'으로 검색해 마음에 드는 여성 목소리를\n"
            "   'Add to my voices' 한 뒤 다시 실행하세요. (python3 make_short.py --list-voices 로 확인)")
    print(f"      (레시피에 eleven_voice가 없어 '{ko[0]['name']}' 목소리를 자동 선택)")
    return ko[0]["voice_id"]


def eleven_tts(text: str, voice_id: str, key: str, mp3_out: Path, models: list[str]):
    """eleven_v3는 [excited] 같은 감정 태그를 이해함. 다른 모델로 넘어가면 태그는 지워서 보냄."""
    last = ""
    for model in models:
        say = text if model == "eleven_v3" else re.sub(r"\[[^\]]*\]\s*", "", text)
        settings = ({"stability": 0.5} if model == "eleven_v3" else
                    {"stability": 0.35, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True})
        body = {"text": say, "model_id": model, "voice_settings": settings, "language_code": "ko"}
        for attempt in (body, {k: v for k, v in body.items() if k != "language_code"}):
            try:
                data = _eleven("POST", f"/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128", key, attempt)
                mp3_out.write_bytes(data)
                return model
            except urllib.error.HTTPError as e:
                msg = e.read().decode("utf-8", "replace")[:300]
                if e.code in (401, 403) and "quota" not in msg.lower():
                    die("ElevenLabs 키가 맞지 않거나 권한이 없어요. elevenlabs_key.txt를 확인하세요.")
                if e.code == 429 or "quota" in msg.lower():
                    die("ElevenLabs 이번 달 사용량을 다 썼어요. 요금제를 확인하세요.")
                last = f"{model}: HTTP {e.code} {msg}"
    die(f"ElevenLabs TTS 실패 → {last}")


# ---------------- Google Cloud TTS (월 무료 한도 안에서는 무료, 상업적 사용 가능)

GOOGLE_VOICES = ["ko-KR-Chirp3-HD-Aoede", "ko-KR-Chirp3-HD-Leda", "ko-KR-Chirp3-HD-Kore",
                 "ko-KR-Chirp3-HD-Zephyr", "ko-KR-Chirp3-HD-Autonoe", "ko-KR-Neural2-A"]


def google_key():
    key = os.environ.get("GOOGLE_TTS_API_KEY", "").strip()
    f = HERE / "google_tts_key.txt"
    if not key and f.exists():
        key = f.read_text(encoding="utf-8").strip()
    return key or None


def google_tts(text: str, voice: str, key: str, mp3_out: Path, rate: float) -> bool:
    """속도 지정이 먹혔으면 True. 안 먹히는 목소리면 False (그땐 나중에 직접 빠르게 만듦)."""
    body = {"input": {"text": text},
            "voice": {"languageCode": "ko-KR", "name": voice},
            "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz": 44100, "speakingRate": rate}}
    last = ""
    for applied, attempt in ((True, body), (False, {**body, "audioConfig": {"audioEncoding": "MP3"}})):
        req = urllib.request.Request("https://texttospeech.googleapis.com/v1/text:synthesize",
                                     data=json.dumps(attempt).encode(),
                                     headers={"Content-Type": "application/json", "x-goog-api-key": key})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                mp3_out.write_bytes(base64.b64decode(json.loads(r.read())["audioContent"]))
            return applied
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:400]
            if e.code == 403 and ("disabled" in msg or "not been used" in msg):
                die("구글 클라우드에서 'Cloud Text-to-Speech API'가 꺼져 있어요. 콘솔에서 '사용'을 눌러주세요.")
            if e.code in (401, 403):
                die(f"구글 TTS 키 문제예요: {msg}")
            last = f"HTTP {e.code} {msg}"
    die(f"구글 TTS 실패 ({voice}) → {last}")


def make_tts(text: str, recipe: dict, ff: str, audio_file: str | None = None) -> Path:
    WORK.mkdir(exist_ok=True)
    if audio_file:  # 캡컷·타입캐스트 등에서 직접 만든 음성 파일 사용
        src_path = Path(audio_file)
        if not src_path.is_absolute():
            src_path = HERE / src_path
        if not src_path.exists():
            die(f"음성 파일이 없어요: {src_path}")
        clean = WORK / f"tts_file_{hashlib.md5(str(src_path).encode()).hexdigest()[:8]}.wav"
        run([ff, "-y", "-i", str(src_path), "-af", TTS_POLISH, "-ar", "44100", "-ac", "2", str(clean)],
            "음성 파일 정리")
        print(f"      🔊 직접 넣은 음성: {src_path.name}")
        return clean
    ekey, gkey, ckey = eleven_key(), gemini_key(), google_key()
    engine = recipe.get("tts_engine") or ("elevenlabs" if ekey else "google" if ckey
                                          else "gemini" if gkey else "edge")
    if engine == "google" and not ckey:
        die("구글 TTS 키가 없어요. shorts 폴더에 google_tts_key.txt를 만들고 키를 붙여넣으세요.")
    if engine == "elevenlabs" and not ekey:
        die("ElevenLabs 키가 없어요. shorts 폴더에 elevenlabs_key.txt를 만들고 키를 붙여넣으세요.")
    if engine == "gemini" and not gkey:
        die("Gemini 키가 없어요. shorts 폴더에 gemini_key.txt를 만들고 키를 붙여넣으세요.")
    key = {"elevenlabs": ekey, "google": ckey}.get(engine, gkey)
    if engine == "elevenlabs":
        voice = pick_eleven_voice(recipe, key)
    elif engine == "google":
        voice = recipe.get("google_voice", GOOGLE_VOICES[0])
    elif engine == "gemini":
        voice = recipe.get("gemini_voice", GEMINI_VOICES[0])
    else:
        voice = recipe.get("voice", "ko-KR-SunHiNeural")
    style = recipe.get("tts_style", GEMINI_STYLE)
    tag = hashlib.md5(f"{engine}|{voice}|{recipe.get('eleven_model')}|{recipe.get('rate')}|{style}|{TTS_POLISH}|{recipe.get('tts_speed')}|{recipe.get('google_rate')}|{text}"
                      .encode()).hexdigest()[:10]
    label = {"elevenlabs": "ElevenLabs", "google": "Google Cloud", "gemini": "Gemini",
             "edge": "edge-tts(구형 무료)"}[engine]
    print(f"      🔊 TTS: {label} {voice}")
    clean = WORK / f"tts_{tag}.wav"
    if clean.exists():
        return clean
    if engine == "google":
        raw = WORK / f"tts_{tag}.mp3"
        g_rate = float(recipe.get("google_rate", 1.25))
        if not google_tts(re.sub(r"\[[^\]]*\]\s*", "", text), voice, key, raw, g_rate):
            recipe = {**recipe, "tts_speed": recipe.get("tts_speed", g_rate)}  # 속도 지정이 안 먹혔으면 직접 빠르게
        src = ["-i", str(raw)]
    elif engine == "elevenlabs":
        raw = WORK / f"tts_{tag}.mp3"
        models = [recipe["eleven_model"]] if recipe.get("eleven_model") else ELEVEN_MODELS
        used = eleven_tts(text, voice, key, raw, models)
        print(f"      (모델: {used})")
        src = ["-i", str(raw)]
    elif engine == "gemini":
        raw = WORK / f"tts_{tag}.pcm"
        gemini_tts(text, voice, key, raw, style)
        src = ["-f", "s16le", "-ar", "24000", "-ac", "1", "-i", str(raw)]
    else:
        raw = WORK / f"tts_{tag}.mp3"
        edge_tts_make(text, voice, recipe.get("rate", "+10%"), raw)
        src = ["-i", str(raw)]
    speed = float(recipe.get("tts_speed", 1.0))
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


def strip_emoji(t: str) -> str:
    """폰트에 없는 이모지는 네모로 깨지므로 뺌."""
    return re.sub(r"[\U00010000-\U0010FFFF\u2600-\u27BF\uFE0F]", "", t or "").strip()


def story_layout(recipe: dict, img):
    """참고 채널 스타일: 흰 상단, 작은 출처, 검정 박스 제목(노랑 강조), 흰 알약 부제, 아래는 영상 전체."""
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, TOP], fill=(255, 255, 255))
    yellow, white = (248, 216, 8), (255, 255, 255)
    # 제목 1줄: 검정 둥근 박스 + 굵은 기울임 글씨
    t1 = strip_emoji(recipe["title1"])
    parts = [(p[2:-2], yellow) if p.startswith("[[") else (p, white) for p in re.split(r"(\[\[.*?\]\])", t1) if p]
    plain = "".join(t for t, _ in parts)
    size = 96
    while size > 50 and d.textlength(plain, font=font(size, "title")) > W - 200:
        size -= 2
    f = font(size, "title")
    tw = d.textlength(plain, font=f)
    lh = int(size * 1.45)
    layer = Image.new("RGBA", (W, lh), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle([(W - tw) / 2 - 34, 4, (W + tw) / 2 + 34, lh - 4], radius=22, fill=(10, 10, 10))
    x = (W - tw) / 2
    for t, color in parts:
        ld.text((x, lh / 2), t, font=f, fill=color, anchor="lm")
        x += ld.textlength(t, font=f)
    k = float(recipe.get("title_italic", 0.12))
    layer = layer.transform(layer.size, Image.AFFINE, (1, k, -k * lh / 2, 0, 1, 0), resample=Image.BICUBIC)
    img.alpha_composite(layer, (0, 282 - lh // 2))
    # 출처: 제목 박스 왼쪽 위 작게
    if recipe.get("credit"):
        cf = font(30, "title")
        d.text(((W - tw) / 2 - 20, 282 - lh // 2 - 8), recipe["credit"], font=cf, fill=(17, 17, 17), anchor="ls")
    # 제목 2줄: 흰 알약 + 검정 글씨 + 은은한 그림자
    if recipe.get("title2"):
        t2 = strip_emoji(re.sub(r"\[\[|\]\]", "", recipe["title2"]))
        f2 = fit(d, t2, W - 220, 52)
        w2 = d.textlength(t2, font=f2)
        box = [(W - w2) / 2 - 30, 400 - 38, (W + w2) / 2 + 30, 400 + 38]
        from PIL import ImageFilter
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle([box[0], box[1] + 5, box[2], box[3] + 5], radius=38,
                                             fill=(150, 130, 200, 120))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle(box, radius=38, fill=(255, 255, 255), outline=(225, 225, 235), width=2)
        d.text((W / 2, 400), t2, font=f2, fill=(17, 17, 17), anchor="mm")
    # 프로필 링크: 영상 아래쪽에 작게 (그림자)
    if recipe.get("link_text"):
        lf = font(40)
        d.text((W / 2, H - 120), recipe["link_text"], font=lf, fill=(255, 255, 255), anchor="mm",
               stroke_width=5, stroke_fill=(0, 0, 0))


def layout_png(recipe: dict, path: Path):
    if recipe.get("theme") == "story":
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        story_layout(recipe, img)
        img.save(path)
        return
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
    text = strip_emoji(text)
    if st.get("quote"):
        text = f"\u201c{text}\u201d"
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

DEFAULT_BLUR = [[0, 0, 0.26, 0.16], [0.74, 0, 0.26, 0.16]]  # 원본 좌상단·우상단 로고 자리(비율)
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def _blur(label: str, out: str, boxes: list, k: int) -> list[str]:
    """원본 화면의 지정 영역(채널 로고 등)을 흐리게."""
    if not boxes:
        return [f"[{label}]null[{out}]"]
    n = len(boxes)
    fg = [f"[{label}]split={n + 1}[bm{k}]" + "".join(f"[bp{k}_{j}]" for j in range(n))]
    last = f"bm{k}"
    for j, (x, y, w, h) in enumerate(boxes):
        fg.append(f"[bp{k}_{j}]crop=iw*{w}:ih*{h}:iw*{x}:ih*{y},"
                  f"boxblur=lr='min(w,h)/5':lp=3:cr='min(cw,ch)/5':cp=3[bb{k}_{j}]")
        nxt = out if j == n - 1 else f"bo{k}_{j}"
        fg.append(f"[{last}][bb{k}_{j}]overlay=main_w*{x}:main_h*{y}[{nxt}]")
        last = nxt
    return fg


def render(ff: str, items: list, dur: float, subs: list, tts: Path | None, out: Path,
           zoom: tuple[float, float], crop_bottom: float, punch: float, blur: list, speed: float = 1.0):
    """한 구간을 영상 칸(+자막)만 렌더링. 제목·하단 글씨는 마지막에 한 번에 얹는다.
    items: [{"path", "t0", "dur", "image", "source"}] 화면 소스들(여러 개면 이어 붙임)
    subs: [(png, 시작, 끝)] (구간 기준 상대 시간). zoom: (처음 배율, 끝 배율)"""
    cmd = [ff, "-y"]
    for it in items:
        if it["image"]:
            cmd += ["-loop", "1", "-t", f"{it['dur']:.3f}", "-i", str(it["path"])]
        else:
            cmd += ["-ss", f"{it['t0']:.3f}", "-t", f"{it['dur']:.3f}", "-i", str(it["path"])]
    si = len(items)
    for png, _, _ in subs:
        cmd += ["-i", str(png)]
    ti = si + len(subs)
    if tts:
        cmd += ["-i", str(tts)]

    zw, zh = int(W * 1.5), int(VH * 1.5)  # 크게 키운 뒤 줌 → 떨림 없이 부드럽게
    fg = []
    for k, it in enumerate(items):
        sp = speed if it["source"] and not it.get("mute") else 1.0  # 원본 말하는 구간만 살짝 빠르게
        odur = it["dur"] / sp
        frames = max(int(odur * FPS), 1)
        z0, z1 = (1.0, 1.12) if it["image"] else zoom   # 사진은 천천히 당기는 켄번스 효과
        zexpr = f"{z0}+({z1}-{z0})*on/{frames}+{punch}*max(0,1-on/{int(0.3 * FPS)})"
        if it["source"]:
            fg += _blur(f"{k}:v", f"bl{k}", blur, k)
            pre = f"[bl{k}]setpts=(PTS-STARTPTS)/{sp},crop=iw:ih*{1 - crop_bottom:.3f}:0:0,"  # 속도 + 아래쪽 자막 잘라내기
        else:
            pre = f"[{k}:v]"
        fg.append(f"{pre}scale={zw}:{zh}:force_original_aspect_ratio=increase,crop={zw}:{zh},setsar=1,"
                  f"fps={FPS},zoompan=z='{zexpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:"
                  f"s={W}x{VH}:fps={FPS},trim=duration={odur:.3f},setpts=PTS-STARTPTS[m{k}]")
    if len(items) > 1:
        fg.append("".join(f"[m{k}]" for k in range(len(items))) + f"concat=n={len(items)}:v=1:a=0[vc]")
    else:
        fg.append("[m0]null[vc]")
    fg.append(f"[vc]pad={W}:{H}:0:{TOP}:black[b0]")
    last = "b0"
    for i, (_, a, b) in enumerate(subs):
        fg.append(f"[{last}][{si + i}:v]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'[s{i}]")
        last = f"s{i}"
    # 영상 길이를 정확히 dur로 맞춤(모자라면 마지막 장면 유지) → 이어 붙일 때 어긋나서 멈추지 않게
    fg.append(f"[{last}]tpad=stop_mode=clone:stop_duration=0.5,trim=duration={dur:.3f},format=yuv420p[vout]")

    fade = f"afade=t=in:d=0.04,afade=t=out:st={max(dur - 0.06, 0):.3f}:d=0.06"
    # 원본 영상이면 그 소리를 바닥에 깔기 (도입부 자료 영상은 소리 안 씀)
    base_audio = items[0]["source"] and not items[0]["image"] and not items[0].get("mute")
    if tts:
        if base_audio:
            fg.append(f"[0:a]aresample=44100,volume={BG_DUCK}[bg]")
        else:
            fg.append(f"anullsrc=r=44100:cl=stereo,atrim=0:{dur:.3f}[bg]")
        fg.append(f"[{ti}:a]aresample=44100,adelay=260|260[t]")
        fg.append(f"[bg][t]amix=inputs=2:duration=longest:normalize=0,apad,atrim=0:{dur:.3f},{fade}[aout]")
    elif base_audio:
        tempo = f"atempo={speed:.3f}," if abs(speed - 1) > 0.005 else ""
        fg.append(f"[0:a]aresample=44100,{tempo}loudnorm=I=-14:TP=-1.5:LRA=11,apad,atrim=0:{dur:.3f},{fade}[aout]")
    else:
        fg.append(f"anullsrc=r=44100:cl=stereo,atrim=0:{dur:.3f}[aout]")

    cmd += ["-filter_complex", ";".join(fg), "-map", "[vout]", "-map", "[aout]",
            "-t", f"{dur:.3f}", "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
            "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2", str(out)]
    run(cmd, f"구간 렌더링({out.name})")


_SOURCES = {}
_USED = []  # 본문에 쓰는 원본 구간들 (도입부 장면이 겹치지 않게)


_SEARCHES = {}


def search_videos(query: str, exclude: str = "", limit: int = 10, cc_only: bool = False) -> list[str]:
    """유튜브에서 검색해 쓸 만한 영상 링크 목록(1분~40분짜리)을 돌려줌."""
    if (query, cc_only) in _SEARCHES:
        return _SEARCHES[(query, cc_only)]
    WORK.mkdir(exist_ok=True)
    cache = WORK / f"search_{hashlib.md5(f'{query}|{cc_only}'.encode()).hexdigest()[:10]}.json"
    if cache.exists():  # 같은 검색은 저장해둔 결과 사용 (유튜브 요청 줄이기)
        _SEARCHES[(query, cc_only)] = json.loads(cache.read_text(encoding="utf-8"))
        return _SEARCHES[(query, cc_only)]
    import yt_dlp
    from urllib.parse import quote
    # 유튜브 검색 필터 '크리에이티브 커먼즈'(sp=EgIwAQ==)를 걸어서 재사용 가능한 영상만 찾음
    search_url = f"https://www.youtube.com/results?search_query={quote(query)}" + ("&sp=EgIwAQ%3D%3D" if cc_only else "")
    with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True, "extract_flat": True,
                           "playlistend": limit}) as ydl:
        res = ydl.extract_info(search_url, download=False)
    urls = []
    for e in res.get("entries") or []:
        d = e.get("duration") or 0
        if e.get("id") and e["id"] not in exclude and 60 <= d <= 2400:
            urls.append(f"https://www.youtube.com/watch?v={e['id']}")
    _SEARCHES[(query, cc_only)] = urls
    cache.write_text(json.dumps(urls), encoding="utf-8")
    print(f"      🔎 '{query}' 검색 결과 {len(urls)}개")
    return urls


def media_items(p: dict, dur: float, src: Path, subs: "Subs", ff: str) -> list:
    """TTS 구간 화면: "media"에 적은 인스타 캡처·다른 영상들을 나눠 보여줌. 없으면 원본 그 장면."""
    out = []
    cc_only = bool(p["part"].get("broll_cc_only", False))  # 도입부 자료는 기본적으로 CC가 아니어도 씀(소리는 안 씀)
    media = p["part"].get("media")
    if media is None and p["part"].get("intro"):
        media = ["auto"]  # 도입부인데 자료를 안 적었으면 자동 검색
    expanded = []
    for m in media or []:
        if m == "auto":
            k = int(p["part"].get("broll_n", 0))
            q = p["part"].get("broll_query")
            if p["part"].get("broll_search") and q:
                # 유튜브 검색(동명이인이 섞일 수 있어서 기본은 꺼둠)
                expanded += [{"search": q, "video": v, "at": "auto", "n": k} for v in range(3)]
            else:
                # 기본: 같은 원본 영상에서, 쓰지 않은 구간 중 '예쁜 장면' 3개 (같은 사람 보장)
                expanded += [{"self": True, "n": k * 3 + j} for j in range(3)]
        else:
            expanded.append(m)
    for m in expanded:
        if isinstance(m, str):  # 내 파일 (broll 폴더의 사진/영상)
            path = Path(m) if Path(m).is_absolute() else HERE / m
            if not path.exists():
                print(f"      ⚠️ 자료 파일이 없어서 건너뜀: {m}")
                continue
            out.append({"path": path, "t0": float(0), "image": path.suffix.lower() in IMAGE_EXT, "source": False})
        else:                   # 유튜브 영상의 특정 장면 {"at": "01:23"} 또는 {"src": "다른링크", "at": ...}
            vpath, vsubs = src, subs
            if m.get("self"):
                moments = [t for t in auto_moments(src, ff, 16)
                           if all(not (a - 4 <= t <= b + 2) for a, b in _USED)] or auto_moments(src, ff, 16)
                t = moments[int(m.get("n", 0)) % len(moments)]
                print(f"      🎞️ 같은 영상의 예쁜 장면: {fmt(t)}")
                out.append({"path": src, "t0": t, "image": False, "source": True, "mute": True})
                continue
            if m.get("search"):  # 셀럽 이름 등으로 유튜브를 검색해서 k번째 영상을 자동으로 씀
                try:
                    found = search_videos(m["search"], exclude=src.stem, cc_only=cc_only)
                except Exception as e:  # 검색이 막혀도(429 등) 영상 만들기는 계속
                    print(f"      ⚠️ 유튜브 검색 실패로 자동 자료를 건너뜀 ({type(e).__name__})")
                    _SEARCHES[(m["search"], cc_only)] = []
                    found = []
                if not found:
                    print(f"      ⚠️ '{m['search']}' 검색 결과가 없어서 건너뜀")
                    continue
                m = {**m, "src": found[int(m.get("video", 0)) % len(found)]}
                print(f"      🎬 자동으로 고른 영상: {m['src']}")
            if m.get("src"):
                if m["src"] not in _SOURCES:
                    try:
                        _SOURCES[m["src"]] = fetch_source(m["src"], ff, height=720, main=False)[:2]
                    except (Exception, SystemExit) as e:  # 자료 영상 하나 실패해도 영상 만들기는 계속
                        print(f"      ⚠️ 자료 영상을 못 받아서 건너뜀 ({type(e).__name__}): {m['src']}")
                        _SOURCES[m["src"]] = None
                if _SOURCES[m["src"]] is None:
                    continue
                vpath, vsubs = _SOURCES[m["src"]]
                if cc_only and "creative commons" not in _INFOS.get(str(vpath), {}).get("license", "").lower():
                    print(f"      ⛔ CC 영상이 아니라서 건너뜀: {m['src']}")
                    continue
            if str(m.get("at", "auto")) == "auto":  # 시간을 안 정하면 자동으로 볼만한 장면 선택
                moments = auto_moments(vpath, ff)
                t = moments[int(m.get("n", 0)) % len(moments)]
                print(f"      🎞️ 자동 선택 장면: {fmt(t)}")
            else:
                t, _ = resolve(m["at"], vsubs, 0, "start")
            out.append({"path": vpath, "t0": t, "image": False, "source": True, "mute": True})
    if not out:
        return [{"path": src, "t0": p["start"], "dur": dur, "image": False, "source": True}]
    for it in out:
        it["dur"] = dur / len(out)
    return out


def speech_pieces(ff: str, src: Path, a: float, b: float, min_gap: float = 0.35, keep: float = 0.08) -> list:
    """[a,b] 안에서 말 사이 긴 쉼(min_gap초 이상)을 잘라낸 조각들. 너무 짧은 조각은 붙여둠."""
    p = subprocess.run([ff, "-hide_banner", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", str(src), "-vn",
                        "-af", f"silencedetect=n=-32dB:d={min_gap}", "-f", "null", "-"],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", p.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", p.stderr)]
    pieces, cur = [], 0.0
    for st, en in zip(starts, ends):
        if st <= 0.05 or en >= (b - a) - 0.05:  # 맨 앞뒤 쉼은 이미 컷 보정에서 처리
            continue
        if st + keep - cur >= 0.6:
            pieces.append((a + cur, a + st + keep))
            cur = max(en - keep, st + keep)
    pieces.append((a + cur, b))
    merged = []
    for pa, pb in pieces:  # 0.6초보다 짧은 조각은 앞 조각에 붙이기
        if merged and pb - pa < 0.6:
            merged[-1] = (merged[-1][0], pb)
        else:
            merged.append((pa, pb))
    return merged


def speech_speed(subs: "Subs", a: float, b: float, target: float = 7.2, cap: float = 1.18) -> float:
    """말이 느린 사람은 살짝 빠르게: 초당 음절이 target보다 느리면 최대 cap배까지."""
    syl = sum(len(norm(t)) for s0, e0, t in subs.lines if s0 >= a - 0.3 and e0 <= b + 0.3)
    if b - a <= 0 or syl == 0:
        return 1.0
    rate = syl / (b - a)
    return round(min(max(target / rate, 1.0), cap), 3)


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
                tts = make_tts(part.get("say", part["text"]), recipe, ff, part.get("audio"))
                dur = duration_of(ff, tts) + 0.5
            plan.append({"type": "tts", "start": at, "end": at + dur, "tts": tts, "part": part})
        else:
            die(f"{n}번 구간: type은 clip 또는 tts 여야 해요.")
    return plan


def voice_test(ff: str):
    """같은 문장을 여러 목소리로 만들어 out/목소리_*.wav로 저장."""
    OUT.mkdir(exist_ok=True)
    line = "아니 이게 3천 원이라고?"
    if google_key():
        engine, field, voices = "google", "google_voice", GOOGLE_VOICES
    elif gemini_key():
        engine, field, voices = "gemini", "gemini_voice", GEMINI_VOICES
    else:
        die("google_tts_key.txt 또는 gemini_key.txt가 없어요. 키를 넣은 뒤 다시 실행하세요.")
    for v in voices:
        print(f"   {v} 만드는 중…")
        p = make_tts(line, {"tts_engine": engine, field: v}, ff)
        shutil.copy(p, OUT / f"목소리_{v}.wav")
    print(f"\n✅ out 폴더의 목소리_*.wav를 들어보고, 마음에 드는 이름을 레시피 \"{field}\"에 적으세요.")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description="레시피로 쇼츠 만들기")
    ap.add_argument("recipe", nargs="?", help="레시피 JSON 파일")
    ap.add_argument("--check", action="store_true", help="영상은 만들지 않고 구간 시간만 확인")
    ap.add_argument("--voice-test", action="store_true", help="Gemini 목소리 샘플 만들기")
    ap.add_argument("--list-voices", action="store_true", help="ElevenLabs 내 목소리 목록 보기")
    ap.add_argument("--voice", help="이번 실행만 구글 목소리 바꾸기 (예: Leda, Kore). 파일 이름 끝에 붙음")
    ap.add_argument("--video", help="(선택) 이미 받아둔 원본 영상 파일")
    ap.add_argument("--subs", help="(선택) --video와 함께 쓸 자막 파일(.vtt/.json3)")
    ap.add_argument("--asr", help="(선택) --video와 함께 쓸 자동자막 json3(컷 정밀용)")
    args = ap.parse_args()

    ff = ffmpeg_exe()
    if args.voice_test:
        voice_test(ff)
        return
    if args.list_voices:
        key = eleven_key() or die("elevenlabs_key.txt가 없어요.")
        for v in eleven_voices(key):
            mark = "🇰🇷" if _is_korean(v) else "  "
            print(f"{mark} {v.get('name', '')[:30]:30s}  {v['voice_id']}  {v.get('labels', {})}")
        print("\n마음에 드는 목소리의 ID를 레시피에 \"eleven_voice\": \"ID\" 로 넣으세요.")
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
    suffix = ""
    if args.voice:
        v = args.voice if args.voice.startswith("ko-KR") else f"ko-KR-Chirp3-HD-{args.voice}"
        recipe["google_voice"], suffix = v, "_" + v.split("-")[-1]
    # clip_subs=false: 원본 구간엔 내 자막을 안 넣고 원본에 박힌 자막을 그대로 살림(기존 계정 방식)
    clip_subs = recipe.get("clip_subs", True)
    # 자동 B-roll: 첫 TTS(도입부)에 자료가 없으면 "셀럽 이름 + 키워드"로 유튜브를 검색해서 씀
    names = re.findall(r"\[\[(.*?)\]\]", recipe["title1"] + recipe.get("title2", ""))
    query = recipe.get("broll_query") or (f"{names[0]} 화보 메이킹" if names else None)
    first_tts = next((pp for pp in recipe["parts"] if pp.get("type") == "tts"), None)
    if first_tts is not None and recipe.get("auto_broll", True):
        first_tts.setdefault("intro", True)
        first_tts.setdefault("broll_query", query)
        first_tts.setdefault("broll_n", recipe.get("broll_offset", 0))
        first_tts.setdefault("broll_search", recipe.get("broll_search", False))
    for pp in recipe["parts"]:
        if pp.get("type") == "tts":
            pp.setdefault("broll_cc_only", recipe.get("broll_cc_only", False))
    crop_bottom = float(recipe.get("src_crop_bottom", 0.2 if clip_subs else 0.0))
    # 원본 좌상단·우상단(채널 로고 자리) 흐리게. false면 끔, 직접 [[x,y,w,h],...] 비율로도 지정 가능
    blur = recipe.get("blur", True)
    blur = DEFAULT_BLUR if blur is True else (blur or [])
    use_layout(recipe.get("theme", "celebpick"))

    plan = plan_parts(recipe, subs, ff, src, args.check)
    _USED[:] = [(pp["start"], pp["end"]) for pp in plan if pp["type"] == "clip"]
    src_len = duration_of(ff, src)
    for i, p in enumerate(plan, 1):
        if p["end"] > src_len + 0.5:
            die(f"{i}번 구간({fmt(p['start'])}~{fmt(p['end'])})이 원본 영상 길이({fmt(src_len)})를 넘어요.")
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
    tighten = recipe.get("tighten", True)          # 말 사이 쉼 잘라내기
    speed_cfg = recipe.get("clip_speed", "auto")   # "auto" = 느린 말투만 살짝 빠르게, 숫자 = 고정 배속
    for i, p in enumerate(plan, 1):
        print(f"   [{i}/{len(plan)}] 렌더링 중…")
        dur = p["end"] - p["start"]
        crop = max(crop_bottom, 0.2) if p["type"] == "tts" else crop_bottom
        if p["type"] == "tts":
            dur = frames(max(dur, 1.4))  # 너무 짧은 TTS 장면은 '따닥' 넘어가 보여서 최소 1.4초 유지
            overlays = []
            pieces = Subs([(0.26, dur - 0.1, p["part"]["text"])]).chunks(0, dur) \
                if recipe.get("tts_chunks", True) else [(0, dur, p["part"]["text"])]
            for j, (a0, b0, text) in enumerate(pieces):
                png = tmp / f"sub_{i}_{j}.png"
                sub_png(text, "tts", png, sub_theme)
                overlays += pop(png, text, "tts", 0 if j == 0 else a0, dur if j == len(pieces) - 1 else b0)
            seg = tmp / f"seg_{i:02d}.mp4"
            items = media_items(p, dur, src, subs, ff)
            render(ff, items, dur, overlays, p.get("tts"), seg, (1.0, 1.05), crop, 0.0, blur)
            seg_files.append((seg, dur, "soft"))
            continue

        # 원본 구간: 쉼 잘라내기 + 말 빠르기 맞추기. 잘라낸 곳은 화면 크기를 번갈아 바꿔(줌 점프컷) 튀지 않게
        speed = speech_speed(subs, p["start"], p["end"]) if speed_cfg == "auto" else float(speed_cfg)
        pieces = speech_pieces(ff, src, p["start"], p["end"]) if tighten else [(p["start"], p["end"])]
        mode = p["part"].get("sub", "auto" if clip_subs else "none")
        for k, (pa, pb) in enumerate(pieces):
            odur = frames((pb - pa) / speed)
            overlays = []
            if mode == "auto":
                for j, (s0, e0, text) in enumerate(subs.chunks(pa, pb)):
                    png = tmp / f"sub_{i}_{k}_{j}.png"
                    sub_png(text, "celeb", png, sub_theme)
                    overlays += pop(png, text, "celeb", (s0 - pa) / speed, (e0 - pa) / speed)
            elif mode and mode != "none":
                png = tmp / f"sub_{i}.png"
                sub_png(mode, "celeb", png, sub_theme)
                overlays.append((png, 0, odur))
            z = 1.0 if (clip_no + k) % 2 == 0 else 1.1
            seg = tmp / f"seg_{i:02d}_{k:02d}.mp4"
            render(ff, [{"path": src, "t0": pa, "dur": pb - pa, "image": False, "source": True}], odur,
                   overlays, None, seg, (z, z + 0.02), crop, 0.0, blur, speed)
            seg_files.append((seg, odur, "soft" if k == 0 else "hard"))
        if speed > 1.0 or len(pieces) > 1:
            print(f"      ✂️ 쉼 {len(pieces) - 1}곳 잘라냄, 말 속도 x{speed}")
        clip_no += len(pieces)

    OUT.mkdir(exist_ok=True)
    final = OUT / f"쇼츠_{rpath.stem}{suffix}.mp4"
    print("   이어 붙이는 중…")
    assemble(ff, seg_files, layout, tmp, final,
             transitions=recipe.get("transitions", True), sfx=recipe.get("sfx", False),
             bgm=(HERE / recipe["bgm"]) if recipe.get("bgm") else None,
             bgm_volume=float(recipe.get("bgm_volume", 0.12)))
    caption = final.with_suffix(".txt")
    caption.write_text(upload_text(recipe), encoding="utf-8")
    print(f"\n✅ 완성: {final}\n   업로드용 문구: {caption}")


DISCLOSURE = "이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."


def upload_text(recipe: dict) -> str:
    """업로드할 때 복사해서 쓰는 제목·설명·해시태그·고지 문구."""
    plain = lambda t: re.sub(r"\[\[|\]\]", "", t or "")
    title = f"{plain(recipe['title1'])} {plain(recipe.get('title2', ''))}".strip()
    names = re.findall(r"\[\[(.*?)\]\]", recipe["title1"] + recipe.get("title2", ""))
    tags = [f"#{n.replace(' ', '')}" for n in names]
    tags += [f"#{t}" for t in recipe.get("hashtags", ["셀럽템", "연예인추천템", "쿠팡추천템", "꿀템", "추천템"])]
    link = recipe.get("link_text", "프로필 링크")
    credit = ""
    if _ORIGIN:  # 크리에이티브 커먼즈(CC BY)는 원작자·원본 링크 표기가 조건
        lic = "CC BY" if "creative commons" in _ORIGIN.get("license", "").lower() else _ORIGIN.get("license", "")
        credit = f"원본 영상: {_ORIGIN['channel']} - {_ORIGIN['title']}\n{_ORIGIN['url']} ({lic})\n\n"
    return (f"[제목]\n{title}\n\n"
            f"[설명/캡션]\n{title}\n제품 정보는 {link}에서 확인하세요 👆\n\n{' '.join(tags)}\n\n"
            f"{credit}{DISCLOSURE}\n\n"
            f"[고정 댓글]\n{DISCLOSURE}\n")


def assemble(ff: str, segs: list, layout: Path | None, tmp: Path, final: Path, transitions: bool, sfx: bool,
             bgm: Path | None = None, bgm_volume: float = 0.12):
    """구간들을 이어 붙이고(장면 사이는 짧은 디졸브, 쉼을 잘라낸 곳은 2프레임 컷), 제목·하단 레이아웃을 얹는다.
    화면과 소리를 한 번에 처리하면 ffmpeg가 서로 기다리다 멈춰서, 화면 → 소리 → 합치기 3단계로 나눔."""
    segs = [(seg, video_len(ff, seg), kind) for seg, _, kind in segs]  # 실제 영상 길이 기준
    n = len(segs)
    joins, offsets, acc = [], [], 0.0
    for k in range(1, n):
        Tk = XFADE if (transitions and segs[k][2] == "soft") else HARD
        acc += segs[k - 1][1] - Tk
        joins.append((Tk, acc))
        if segs[k][2] == "soft":
            offsets.append(acc)
    total = sum(d for _, d, _ in segs) - sum(t for t, _ in joins)
    ins = []
    for seg, _, _ in segs:
        ins += ["-i", str(seg)]

    # 1) 화면
    fv, lv = [], "0:v"
    for k, (Tk, off) in enumerate(joins, 1):
        fv.append(f"[{lv}][{k}:v]xfade=transition=fade:duration={Tk:.4f}:offset={off:.4f}[xv{k}]")
        lv = f"xv{k}"
    vcmd = [ff, "-y"] + ins
    if layout:
        vcmd += ["-loop", "1", "-i", str(layout)]
        fv.append(f"[{lv}][{n}:v]overlay=0:0:shortest=1,format=yuv420p[vout]")
    else:
        fv.append(f"[{lv}]format=yuv420p[vout]")
    vtmp = tmp / "_video.mp4"
    run(vcmd + ["-filter_complex", ";".join(fv), "-map", "[vout]", "-an", "-t", f"{total:.3f}", "-r", str(FPS),
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", str(vtmp)], "화면 이어 붙이기")

    # 2) 소리
    fa, la = [], "0:a"
    for k, (Tk, _) in enumerate(joins, 1):
        fa.append(f"[{la}][{k}:a]acrossfade=d={Tk:.4f}[xa{k}]")
        la = f"xa{k}"
    acmd = [ff, "-y"] + ins
    nin = n
    if sfx and offsets:
        whoosh = tmp / "whoosh.wav"
        run([ff, "-y", "-f", "lavfi", "-i", "anoisesrc=d=0.35:c=pink:a=0.6",
             "-af", "highpass=f=700,lowpass=f=7000,afade=t=in:d=0.2:curve=exp,"
                    "afade=t=out:st=0.2:d=0.15,volume=0.22", "-ar", "44100", "-ac", "2", str(whoosh)],
            "효과음 만들기")
        acmd += ["-i", str(whoosh)]
        wi, nin, m = nin, nin + 1, len(offsets)
        fa.append(f"[{wi}:a]asplit={m}" + "".join(f"[w{j}]" for j in range(m)) if m > 1 else f"[{wi}:a]anull[w0]")
        for j, o in enumerate(offsets):
            ms = max(int((o - 0.15) * 1000), 0)
            fa.append(f"[w{j}]adelay={ms}|{ms}[wd{j}]")
        fa.append(f"[{la}]" + "".join(f"[wd{j}]" for j in range(m)) +
                  f"amix=inputs={m + 1}:duration=first:normalize=0[amain]")
    else:
        fa.append(f"[{la}]anull[amain]")
    if bgm:
        # 배경음악: 영상 길이만큼 반복, 말소리가 나오면 자동으로 작아짐(사이드체인 덕킹), 끝에서 페이드아웃
        acmd += ["-stream_loop", "-1", "-i", str(bgm)]
        fa.append("[amain]asplit=2[am1][am2]")
        fa.append(f"[{nin}:a]aresample=44100,aformat=channel_layouts=stereo,volume={bgm_volume},"
                  f"atrim=0:{total:.3f},afade=t=out:st={max(total - 1.2, 0):.3f}:d=1.2[bg0]")
        fa.append("[bg0][am2]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[bgd]")
        fa.append("[am1][bgd]amix=inputs=2:duration=first:normalize=0[aout]")
    else:
        fa.append("[amain]anull[aout]")
    atmp = tmp / "_audio.m4a"
    run(acmd + ["-filter_complex", ";".join(fa), "-map", "[aout]", "-vn", "-t", f"{total:.3f}",
                "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2", str(atmp)], "소리 이어 붙이기")

    # 3) 합치기
    run([ff, "-y", "-i", str(vtmp), "-i", str(atmp), "-map", "0:v", "-map", "1:a", "-c", "copy",
         "-t", f"{total:.3f}", "-movflags", "+faststart", str(final)], "화면·소리 합치기")


if __name__ == "__main__":
    main()
