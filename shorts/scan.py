"""
셀럽 유튜브 영상에서 '제품 언급 구간'만 뽑아주는 스캐너.

영상을 정독하지 않고도
  1) 자막(없으면 자동 자막)에서 키워드가 나온 시간
  2) '가장 많이 다시 본 구간' 그래프의 최고점
  3) 타임스탬프나 제품 질문이 달린 인기 댓글
을 한 번에 모아 보여줍니다.

사용법
  python scan.py 링크1 링크2 ...
  python scan.py -f urls.txt            # 한 줄에 링크 하나
  python scan.py 링크 --no-comments     # 댓글 수집 생략(더 빠름)

결과
  - 화면에 요약 출력
  - out/리포트_날짜.md  : 영상별 상세 리포트(시간 클릭하면 그 구간부터 재생)
  - out/구간목록.csv    : 소재 관리 시트에 붙여넣기용(누적 저장)
"""

import argparse
import csv
import datetime as dt
import json
import re
import sys
from pathlib import Path

try:
    import yt_dlp
except ImportError:
    sys.exit("yt-dlp가 없습니다. 먼저 실행하세요:  pip install -U yt-dlp")

HERE = Path(__file__).resolve().parent
OUT_DIR = HERE / "out"

# 키워드 앞뒤로 몇 초를 문맥으로 보여줄지
CONTEXT_BEFORE = 3
CONTEXT_AFTER = 8
# 이 간격(초) 안에서 연달아 걸린 키워드는 한 구간으로 합침
MERGE_GAP = 12

# 제품을 진짜 소개할 때 나오는 말. 이 단어가 걸리면 점수 2배.
STRONG = {"추천", "애정템", "최애", "꿀템", "필수템", "내돈내산", "인생템", "재구매", "브랜드", "제품", "쓰고있", "중독"}

TIMESTAMP_RE = re.compile(r"\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b")
QUESTION_WORDS = ["어디", "제품", "정보", "브랜드", "이름", "뭐에요", "뭐예요", "뭔가요", "알려", "궁금", "링크"]


def load_keywords(path: Path) -> tuple[list[str], list[str]]:
    """keywords.txt에서 (찾을 단어, 제외할 단어)를 읽는다.
    '#' 뒤는 무시, '!'로 시작하는 단어는 제외 목록(예: !벌써 → '벌써요'의 '써요'를 무시)."""
    if not path.exists():
        sys.exit(f"키워드 파일이 없습니다: {path}")
    words = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            words.extend(w.strip() for w in line.split(",") if w.strip())
    words = list(dict.fromkeys(words))  # 중복 제거, 순서 유지
    keep = [w for w in words if not w.startswith("!")]
    excludes = [w[1:] for w in words if w.startswith("!") and len(w) > 1]
    return keep, excludes


def fmt_time(sec: float) -> str:
    sec = int(sec)
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def squash(text: str) -> str:
    """띄어쓰기를 지워서 '써 요' / '써요' 같은 자동자막 띄어쓰기 차이를 무시한다."""
    return re.sub(r"\s+", "", text)


# ---------------------------------------------------------------- 자막 처리

def pick_subtitle(info: dict):
    """한국어 수동 자막 > 한국어 자동 자막 순으로 고른다. (자막정보, 종류) 반환."""
    for kind, pool in (("수동 자막", info.get("subtitles") or {}),
                       ("자동 자막", info.get("automatic_captions") or {})):
        for lang in sorted(pool, key=lambda l: (l != "ko", l)):
            if lang == "ko" or lang.startswith("ko-"):
                fmts = pool[lang]
                for want in ("json3", "vtt"):
                    for f in fmts:
                        if f.get("ext") == want and f.get("url"):
                            return f, kind
    return None, None


def parse_json3(raw: str) -> list[tuple[float, str]]:
    data = json.loads(raw)
    segs = []
    for ev in data.get("events", []):
        if "segs" not in ev:
            continue
        text = "".join(s.get("utf8", "") for s in ev["segs"]).replace("\n", " ").strip()
        if text:
            segs.append((ev.get("tStartMs", 0) / 1000, text))
    return segs


VTT_TIME_RE = re.compile(r"(\d+):(\d{2}):(\d{2})\.(\d{3})\s+-->")


def parse_vtt(raw: str) -> list[tuple[float, str]]:
    segs, cur_t, buf, seen = [], None, [], set()

    def flush():
        if cur_t is not None and buf:
            text = re.sub(r"<[^>]+>", "", " ".join(buf)).strip()
            # 자동자막 vtt는 같은 줄이 여러 번 반복돼서 걸러낸다
            if text and text not in seen:
                seen.add(text)
                segs.append((cur_t, text))

    for line in raw.splitlines():
        m = VTT_TIME_RE.match(line)
        if m:
            flush()
            h, mi, s, ms = map(int, m.groups())
            cur_t, buf = h * 3600 + mi * 60 + s + ms / 1000, []
        elif line.strip() and cur_t is not None:
            buf.append(line.strip())
    flush()
    return segs


def find_hits(segs, keywords, excludes=()):
    """키워드가 들어간 자막 조각을 찾아 가까운 것끼리 묶은 구간 목록을 만든다."""
    squashed_kw = [(k, squash(k)) for k in keywords]
    squashed_ex = [squash(e) for e in excludes]
    raw_hits = []
    for t, text in segs:
        s = squash(text)
        for ex in squashed_ex:
            s = s.replace(ex, "|")
        found = [k for k, sk in squashed_kw if sk and sk in s]
        if found:
            raw_hits.append((t, found))

    groups = []
    for t, found in raw_hits:
        if groups and t - groups[-1]["end"] <= MERGE_GAP:
            groups[-1]["end"] = t
            groups[-1]["keywords"].update(found)
        else:
            groups.append({"start": t, "end": t, "keywords": set(found)})

    for g in groups:
        lo, hi = g["start"] - CONTEXT_BEFORE, g["end"] + CONTEXT_AFTER
        g["text"] = " ".join(text for t, text in segs if lo <= t <= hi)
        g["start"] = max(0.0, g["start"] - 1)  # 링크는 1초 일찍 시작
        g["score"] = sum(2 if k in STRONG else 1 for k in g["keywords"])
    return groups


def stars(score: int) -> str:
    return "⭐⭐⭐" if score >= 6 else "⭐⭐" if score >= 3 else "⭐"


# ---------------------------------------------------------------- 그래프/댓글

def heat_peaks(info: dict, top: int = 3):
    """'가장 많이 다시 본 구간' 최고점 top개. 서로 30초 이상 떨어진 것만."""
    hm = sorted(info.get("heatmap") or [], key=lambda x: x.get("value", 0), reverse=True)
    picked = []
    for p in hm:
        if all(abs(p["start_time"] - q["start_time"]) >= 30 for q in picked):
            picked.append(p)
        if len(picked) == top:
            break
    return sorted(picked, key=lambda p: p["start_time"])


def useful_comments(info: dict, keywords, limit: int = 10):
    """타임스탬프, 제품 질문, 키워드가 들어간 댓글을 좋아요 순으로."""
    out = []
    for c in info.get("comments") or []:
        text = (c.get("text") or "").strip()
        if not text:
            continue
        s = squash(text)
        if (TIMESTAMP_RE.search(text)
                or any(w in s for w in QUESTION_WORDS)
                or any(squash(k) in s for k in keywords)):
            out.append((c.get("like_count") or 0, text.replace("\n", " ")))
    out.sort(reverse=True)
    return out[:limit]


# ---------------------------------------------------------------- 메인

def scan(url: str, keywords, excludes, with_comments: bool):
    opts = {
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
        "getcomments": with_comments,
        "extractor_args": {"youtube": {"comment_sort": ["top"], "max_comments": ["300", "300", "0"]}},
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
        if with_comments and not info.get("comments"):
            # 버전에 따라 댓글은 post_extract 단계에서 채워진다
            try:
                ydl.post_extract(info)
            except Exception:
                pass

        sub, sub_kind = pick_subtitle(info)
        segs = []
        if sub:
            raw = ydl.urlopen(sub["url"]).read().decode("utf-8", "replace")
            segs = parse_json3(raw) if sub["ext"] == "json3" else parse_vtt(raw)

    return {
        "url": info.get("webpage_url") or url,
        "id": info.get("id"),
        "title": info.get("title", ""),
        "channel": info.get("channel") or info.get("uploader", ""),
        "duration": info.get("duration") or 0,
        "description": info.get("description") or "",
        "sub_kind": sub_kind,
        "hits": find_hits(segs, keywords, excludes) if segs else [],
        "peaks": heat_peaks(info),
        "comments": useful_comments(info, keywords) if with_comments else [],
    }


def t_link(video_id: str, sec: float) -> str:
    return f"https://youtu.be/{video_id}?t={int(sec)}"


def render_md(r) -> str:
    lines = [f"## {r['title']}", f"- 채널: {r['channel']} / 길이: {fmt_time(r['duration'])}",
             f"- 링크: {r['url']}", ""]

    lines.append(f"### 🔎 키워드 구간 ({r['sub_kind'] or '자막 없음'}) — 점수 높은 순")
    if not r["sub_kind"]:
        lines.append("- 한국어 자막이 없어 키워드 검색을 못 했어요. 아래 그래프 최고점과 댓글을 보세요.")
    elif not r["hits"]:
        lines.append("- 걸린 키워드 없음 → keywords.txt에 단어를 추가하거나 다음 영상으로 넘어가세요.")
    for h in sorted(r["hits"], key=lambda h: -h["score"]):
        kws = ", ".join(sorted(h["keywords"]))
        lines.append(f"- {stars(h['score'])} [{fmt_time(h['start'])}]({t_link(r['id'], h['start'])}) `{kws}`  {h['text']}")
    lines.append("")

    lines.append("### 📈 가장 많이 다시 본 구간")
    if not r["peaks"]:
        lines.append("- 데이터 없음 (조회수가 적거나 짧은 영상은 그래프가 없어요)")
    for p in r["peaks"]:
        lines.append(f"- [{fmt_time(p['start_time'])}]({t_link(r['id'], p['start_time'])}) 반응 {p['value']:.2f}")
    lines.append("")

    if r["comments"]:
        lines.append("### 💬 쓸만한 댓글 (좋아요순)")
        for likes, text in r["comments"]:
            lines.append(f"- 👍{likes} {text[:200]}")
        lines.append("")

    desc_hits = [l.strip() for l in r["description"].splitlines()
                 if TIMESTAMP_RE.search(l)
                 or any(w in l.lower() for w in ("제품", "정보", "product", "item", "협찬", "제작지원", "ppl"))]
    if desc_hits:
        lines.append("### 📝 더보기란에서 제품·타임스탬프로 보이는 줄")
        lines.extend(f"- {l}" for l in desc_hits[:20])
        lines.append("")
    return "\n".join(lines)


CSV_HEADER = ["수집일", "영상제목", "채널", "시간", "점수", "바로가기", "키워드", "자막"]


def append_csv(path: Path, results):
    if path.exists():
        with path.open(encoding="utf-8-sig") as f:
            if f.readline().strip() != ",".join(CSV_HEADER):
                # 예전 형식 파일은 옆으로 치워두고 새로 시작
                path.rename(path.with_name(path.stem + "_예전형식.csv"))
    new = not path.exists()
    # utf-8-sig: 엑셀에서 열어도 한글이 안 깨지게
    with path.open("a", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        if new:
            w.writerow(CSV_HEADER)
        today = dt.date.today().isoformat()
        for r in results:
            for h in r["hits"]:
                w.writerow([today, r["title"], r["channel"], fmt_time(h["start"]), h["score"],
                            t_link(r["id"], h["start"]), ", ".join(sorted(h["keywords"])), h["text"]])


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # 윈도우 콘솔 한글 깨짐 방지

    ap = argparse.ArgumentParser(description="셀럽 영상 제품 언급 구간 스캐너")
    ap.add_argument("urls", nargs="*", help="유튜브 링크(여러 개 가능)")
    ap.add_argument("-f", "--file", help="링크 목록 파일(한 줄에 하나)")
    ap.add_argument("-k", "--keywords", default=str(HERE / "keywords.txt"), help="키워드 파일 경로")
    ap.add_argument("--no-comments", action="store_true", help="댓글 수집 생략")
    args = ap.parse_args()

    urls = list(args.urls)
    if args.file:
        urls += [l.strip() for l in Path(args.file).read_text(encoding="utf-8").splitlines()
                 if l.strip() and not l.startswith("#")]
    if not urls:
        ap.print_help()
        sys.exit(1)

    keywords, excludes = load_keywords(Path(args.keywords))
    OUT_DIR.mkdir(exist_ok=True)

    results = []
    for i, url in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] 스캔 중: {url}")
        try:
            r = scan(url, keywords, excludes, not args.no_comments)
        except Exception as e:  # 한 영상이 실패해도 나머지는 계속
            print(f"   ⚠️ 실패: {e}\n   → 'pip install -U yt-dlp'로 업데이트 후 다시 시도해 보세요.")
            continue
        results.append(r)
        print(f"   {r['title'][:50]}  |  키워드 구간 {len(r['hits'])}개, 그래프 최고점 {len(r['peaks'])}개, 댓글 {len(r['comments'])}개")
        if r["hits"]:
            print("   점수 높은 구간 Top 5:")
        for h in sorted(r["hits"], key=lambda h: -h["score"])[:5]:
            print(f"   {stars(h['score'])} [{fmt_time(h['start'])}] {', '.join(sorted(h['keywords']))} | {h['text'][:60]}")

    if not results:
        sys.exit("스캔에 성공한 영상이 없습니다.")

    stamp = dt.datetime.now().strftime("%Y%m%d_%H%M")
    report = OUT_DIR / f"리포트_{stamp}.md"
    report.write_text("\n\n".join(render_md(r) for r in results), encoding="utf-8")
    append_csv(OUT_DIR / "구간목록.csv", results)
    print(f"\n✅ 완료\n   리포트: {report}\n   시트용 CSV: {OUT_DIR / '구간목록.csv'}")


if __name__ == "__main__":
    main()
