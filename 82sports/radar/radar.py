"""+82 SPORTS 글감 레이더.

명단(roster.csv)의 선수마다 네이버 모바일 뉴스(최신순)를 검색해
최근 N시간 안에 나온 기사를 모으고, 기사 수가 많은 선수부터 정리한다.

실행:  python3 -I radar.py [시간=14] [출력폴더=out]
결과:  out/radar.json (기계용), out/radar.md (사람용)
제외 선수: 황희찬, 양민혁, 박승수 (운영 원칙)
"""
import csv, html, json, os, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

HOURS = float(sys.argv[1]) if len(sys.argv) > 1 else 14
OUT = sys.argv[2] if len(sys.argv) > 2 else "out"
EXCLUDE = {"황희찬", "양민혁", "박승수"}
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
KST = timezone(timedelta(hours=9))
HERE = os.path.dirname(os.path.abspath(__file__))


def fetch(q):
    url = "https://m.search.naver.com/search.naver?where=m_news&sort=1&query=" + urllib.parse.quote(q)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "ko-KR"})
    for attempt in range(2):
        try:
            return urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "ignore")
        except Exception as e:  # 일시 오류는 한 번만 다시 시도
            err = e
            time.sleep(3)
    raise err


def age_hours(s):
    m = re.match(r"(\d+)(분|시간|일|주) 전", s)
    if not m:
        return None
    n, u = int(m.group(1)), m.group(2)
    return {"분": n / 60, "시간": n, "일": n * 24, "주": n * 168}[u]


def parse(page):
    """기사 블록마다 (언론사, 경과시간, 제목, 링크)."""
    items = []
    blocks = page.split("sds-comps-profile-info-title")[1:]
    for b in blocks:
        press = re.search(r'text-weight-sm">([^<]{1,30})</span></a>', b)
        t = re.search(r">(\d+(?:분|시간|일|주) 전)<", b)
        h = re.search(r'<a[^>]+href="([^"]+)"[^>]*>(?:(?!</a>).){0,400}?headline1[^>]*>(.*?)</span>', b, re.S)
        if not (t and h):
            continue
        title = html.unescape(re.sub(r"<[^>]+>", "", h.group(2))).strip()
        items.append({"press": press.group(1) if press else "", "age_h": age_hours(t.group(1)),
                      "when": t.group(1), "title": title, "url": h.group(1)})
    return items


def main():
    rows = list(csv.DictReader(open(os.path.join(HERE, "roster.csv"), encoding="utf-8-sig")))
    found, errors = [], []
    for r in rows:
        name, sport = r["name"].strip(), r["sport"].strip()
        if not name or name in EXCLUDE:
            continue
        try:
            items = parse(fetch(f"{name} {sport}"))
        except Exception as e:
            errors.append(f"{name}: {e}")
            continue
        seen, recent = set(), []
        for it in items:
            if it["age_h"] is not None and it["age_h"] <= HOURS and it["title"] not in seen and name in it["title"]:
                seen.add(it["title"]); recent.append(it)
        if recent:
            found.append({"name": name, "sport": sport, "group": r.get("group", ""), "team": r.get("team_or_event", ""),
                          "league": r.get("league_or_tour", ""), "count": len(recent), "items": recent[:5]})
        time.sleep(1.2)
    found.sort(key=lambda x: (-x["count"], min(i["age_h"] for i in x["items"])))
    os.makedirs(OUT, exist_ok=True)
    now = datetime.now(KST).strftime("%Y-%m-%d %H:%M KST")
    json.dump({"generated": now, "hours": HOURS, "athletes": found, "errors": errors},
              open(os.path.join(OUT, "radar.json"), "w"), ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, "radar.md"), "w") as f:
        f.write(f"# 글감 레이더 {now} (최근 {HOURS:g}시간)\n\n선수 {len(found)}명 / 오류 {len(errors)}건\n\n")
        for a in found:
            f.write(f"## {a['name']} · {a['sport']} · {a['team']} (기사 {a['count']})\n")
            for it in a["items"]:
                f.write(f"- [{it['when']}] {it['title']} — {it['press']} {it['url']}\n")
            f.write("\n")
    print(f"done: {len(found)} athletes with news, {len(errors)} errors -> {OUT}/radar.md")


if __name__ == "__main__":
    main()
