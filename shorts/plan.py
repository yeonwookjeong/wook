"""
업로드 일정표 만들기 (+ 한꺼번에 영상 만들기)

recipes/*.json 을 모아서 프로필 링크 번호 순서대로 날짜별 업로드 일정을 out/업로드_일정.csv 로 저장합니다.
(번호를 띄엄띄엄 매겨서 같은 출연자가 붙지 않게 하는 방식. --mix 면 예전처럼 출연자를 섞는 순서)

규칙
  - 한 원본 영상에서 최대 3개 (넘으면 경고 후 앞 3개만 사용)
  - 같은 원본 영상은 되도록 --gap 일 간격 (기본 2일). 소스가 모자라면 빈 날 없이 채움 (--strict 면 비움)
  - 같은 출연자는 하루 1개까지
  - 하루 --per-day 개 (기본 1개)

사용
  python3 plan.py                       # 일정표만
  python3 plan.py --start 2026-11-03    # 시작 날짜 지정
  python3 plan.py --per-day 2 --times 12:30,20:30
  python3 plan.py --make                # 아직 없는 영상을 차례로 만들고 일정표
"""
import argparse
import csv
import json
import re
import subprocess
import sys
import time
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
RECIPES = HERE / "recipes"
OUT = HERE / "out"
MAX_PER_VIDEO = 3


def video_id(url: str) -> str:
    m = re.search(r"(?:v=|youtu\.be/|shorts/)([\w-]{11})", url or "")
    return m.group(1) if m else (url or "?")


def celeb(r: dict, stem: str) -> str:
    m = re.search(r"\[\[(.+?)\]\]", r.get("title1", ""))
    return m.group(1) if m else stem.split("_")[0]


def load() -> list[dict]:
    items = []
    for p in sorted(RECIPES.glob("*.json")):  # _보류 같은 하위 폴더는 제외
        try:
            r = json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"⚠️ {p.name} 읽기 실패: {e}")
            continue
        items.append({"stem": p.stem, "path": p, "vid": video_id(r.get("source", "")),
                      "celeb": celeb(r, p.stem), "link": r.get("link_text", "")})
    groups: dict[str, list] = {}
    for it in items:
        groups.setdefault(it["vid"], []).append(it)
    kept = []
    for vid, g in groups.items():
        if len(g) > MAX_PER_VIDEO:
            print(f"⚠️ 영상 {vid} 레시피 {len(g)}개 → 앞 {MAX_PER_VIDEO}개만 씀 "
                  f"(빠짐: {', '.join(x['stem'] for x in g[MAX_PER_VIDEO:])})")
        kept += g[:MAX_PER_VIDEO]
    return kept


def schedule(items: list[dict], start: date, per_day: int, gap: int, strict: bool = False) -> list[tuple]:
    left = list(items)
    last_vid: dict[str, int] = {}
    rows, day = [], 0
    while left:
        today_celebs = set()
        for slot in range(per_day):
            free = [x for x in left if x["celeb"] not in today_celebs]
            # 간격 지키는 것 → 안 되면 어제와 다른 영상 → 그래도 없으면 아무거나 (빈 날 없이)
            ok = [x for x in free if day - last_vid.get(x["vid"], -999) >= gap]
            if not ok and not strict:
                ok = ([x for x in free if day - last_vid.get(x["vid"], -999) >= 2]
                      or [x for x in free if day - last_vid.get(x["vid"], -999) >= 1])
            if not ok:
                break
            # 남은 개수가 많은 영상 우선, 오래 안 나온 영상 우선 → 골고루 섞임
            cnt = {v: sum(1 for x in left if x["vid"] == v) for v in {x["vid"] for x in ok}}
            pick = max(ok, key=lambda x: (cnt[x["vid"]], -last_vid.get(x["vid"], -999)))
            left.remove(pick)
            last_vid[pick["vid"]] = day
            today_celebs.add(pick["celeb"])
            rows.append((start + timedelta(days=day), slot, pick))
        day += 1
        if day > 3650:
            break
    return rows


def link_no(x: dict) -> int:
    m = re.search(r"(\d+)", x.get("link", ""))
    return int(m.group(1)) if m else 10**6


def schedule_by_link(items: list[dict], start: date, per_day: int) -> list[tuple]:
    """프로필 링크 번호 순서대로 하루 per_day개씩. (인포크 번호와 업로드 순서를 맞추기 위함)"""
    order = sorted(items, key=link_no)
    rows = [(start + timedelta(days=k // per_day), k % per_day, x) for k, x in enumerate(order)]
    for a, b in zip(order, order[1:]):
        if a["vid"] == b["vid"]:
            print(f"⚠️ {link_no(a)}번·{link_no(b)}번이 같은 원본 영상이라 연달아 올라가요. 번호를 띄워 주세요.")
    return rows


def make_missing(items: list[dict]) -> None:
    todo = [x for x in items if not (OUT / f"쇼츠_{x['stem']}.mp4").exists()]
    print(f"🎬 만들 영상 {len(todo)}개")
    for i, x in enumerate(todo):
        print(f"\n[{i + 1}/{len(todo)}] {x['stem']}")
        r = subprocess.run([sys.executable, str(HERE / "make_short.py"), str(x["path"])])
        if r.returncode != 0:
            print(f"⚠️ {x['stem']} 실패 → 건너뜀")
        if i < len(todo) - 1:
            time.sleep(20)  # 유튜브 429 방지


def main():
    ap = argparse.ArgumentParser(description="쌓아둔 쇼츠 목록(링크 번호순) / 영상 일괄 제작 / --start 주면 날짜 일정표")
    ap.add_argument("--start", help="날짜 일정표가 필요할 때 시작 날짜 YYYY-MM-DD")
    ap.add_argument("--per-day", type=int, default=1, help="하루 업로드 개수 (기본 1)")
    ap.add_argument("--gap", type=int, default=2, help="같은 원본 영상 권장 간격(일) (기본 2)")
    ap.add_argument("--strict", action="store_true", help="간격을 못 지키면 그날은 비우기 (기본: 빈 날 없이 채움)")
    ap.add_argument("--times", help="업로드 시각들, 쉼표 구분 (기본: 1개면 19:30, 2개면 12:30,19:30)")
    ap.add_argument("--make", action="store_true", help="아직 없는 영상을 먼저 만들기")
    ap.add_argument("--mix", action="store_true", help="링크 번호 대신 출연자를 섞는 순서로 (예전 방식)")
    a = ap.parse_args()

    items = load()
    if not items:
        sys.exit("recipes 폴더에 레시피가 없어요.")
    if a.make:
        make_missing(items)

    if not a.start and not a.mix:  # 기본: 날짜 없이 링크 번호순 재고 목록
        OUT.mkdir(exist_ok=True)
        dst = OUT / "쇼츠_목록.csv"
        order = sorted(items, key=link_no)
        with dst.open("w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(f)
            w.writerow(["링크번호", "출연자", "레시피", "영상", "캡션파일", "준비"])
            for x in order:
                mp4 = OUT / f"쇼츠_{x['stem']}.mp4"
                w.writerow([x["link"], x["celeb"], x["stem"], mp4.name, mp4.with_suffix(".txt").name,
                            "✅" if mp4.exists() else "❌ 영상 없음"])
        print(f"\n📦 쌓아둔 쇼츠 {len(order)}개 (링크 번호순) → {dst}")
        for x in order:
            ok = "✅" if (OUT / f"쇼츠_{x['stem']}.mp4").exists() else "❌"
            print(f"  {ok} {link_no(x):>4}번  {x['celeb']:<6} {x['stem']}")
        for a_, b_ in zip(order, order[1:]):
            if a_["vid"] == b_["vid"]:
                print(f"  ⚠️ {link_no(a_)}번·{link_no(b_)}번이 같은 원본 영상이라 연달아 올라가요.")
        return

    start = date.fromisoformat(a.start) if a.start else date.today() + timedelta(days=1)
    default = "19:30" if a.per_day <= 1 else "12:30,19:30,22:00"
    times = sorted(t.strip() for t in (a.times or default).split(",") if t.strip()) or ["19:30"]
    rows = schedule(items, start, max(1, a.per_day), max(0, a.gap), a.strict) if a.mix \
        else schedule_by_link(items, start, max(1, a.per_day))

    OUT.mkdir(exist_ok=True)
    dst = OUT / "업로드_일정.csv"
    week = "월화수목금토일"
    with dst.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["날짜", "요일", "시각", "출연자", "레시피", "링크번호", "영상", "캡션파일", "준비"])
        for d, slot, x in rows:
            mp4 = OUT / f"쇼츠_{x['stem']}.mp4"
            w.writerow([d.isoformat(), week[d.weekday()], times[slot % len(times)], x["celeb"],
                        x["stem"], x["link"], mp4.name, mp4.with_suffix(".txt").name,
                        "✅" if mp4.exists() else "❌ 영상 없음"])
    print(f"\n📅 {len(rows)}개 일정 → {dst}")
    for d, slot, x in rows:
        print(f"  {d} ({week[d.weekday()]}) {times[slot % len(times)]}  {x['celeb']:<6} {x['stem']}")
    vids = {x["vid"] for x in items}
    if a.mix and len(vids) < 3:
        print(f"\n💡 원본 영상이 {len(vids)}개뿐이라 같은 영상이 붙어 나와요. CC 영상 3~4개를 쌓아두면 골고루 섞여요.")


if __name__ == "__main__":
    main()
