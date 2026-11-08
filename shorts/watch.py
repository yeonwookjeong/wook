"""
채널 지켜보기: 등록한 유튜브 채널에 '아이템 소개' 영상(왓츠인마이백·애정템·파우치…)이 올라오면 알려줌.

유튜브 공식 RSS(채널 새 영상 목록)만 읽어서 가볍고, 429 차단 걱정이 거의 없음.
새로 올라온 것 중 제목이 아이템 소개 같은 것만 골라 CC 여부까지 확인 → out/새영상.md + 맥 알림.

사용
  python3 watch.py                      # 지금 확인
  python3 watch.py add 채널링크          # 채널 등록 (채널 주소, @핸들, 그 채널 영상 링크, 또는 "채널 이름")
  python3 watch.py list                 # 등록된 채널 보기
  python3 watch.py --install            # 매일 오전 10시·오후 6시에 자동 확인 (맥)
  python3 watch.py --uninstall          # 자동 확인 끄기
"""
import json
import re
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHANNELS = HERE / "channels.json"          # {channel_id: 이름}
SEEN = HERE / "work" / "watch_seen.json"   # 이미 본 영상 id
OUT = HERE / "out"
KEYWORDS = ["왓츠인", "인마이백", "인 마이 백", "가방", "파우치", "애정템", "꿀템", "추천템", "찐템", "필수템",
            "최애템", "인생템", "favorite", "favourite", "what's in my", "whats in my", "in my bag", "essential",
            "에센셜", "선물", "하울", "내돈내산", "루틴", "뷰티템", "아이템"]
NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015",
      "media": "http://search.yahoo.com/mrss/"}
PLIST = Path.home() / "Library" / "LaunchAgents" / "com.celebpick.watch.plist"


def load(p: Path, default):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return default


def save(p: Path, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


def ydl_opts():
    opts = {"quiet": True, "no_warnings": True, "skip_download": True, "extract_flat": "in_playlist",
            "playlist_items": "1"}
    bf = HERE / "browser.txt"
    if bf.exists() and bf.read_text().strip():
        opts["cookiesfrombrowser"] = (bf.read_text().strip(),)
    return opts


def resolve(url: str) -> tuple[str, str]:
    """채널 주소·@핸들·영상 링크 → (채널 id, 채널 이름)."""
    import yt_dlp
    if url.startswith("@"):
        url = "https://www.youtube.com/" + url
    with yt_dlp.YoutubeDL(ydl_opts()) as ydl:
        info = ydl.extract_info(url, download=False)
    cid = info.get("channel_id") or info.get("uploader_id") or info.get("id")
    name = info.get("channel") or info.get("uploader") or info.get("title") or cid
    if not (cid or "").startswith("UC"):
        raise ValueError(f"채널을 못 찾았어요: {url}")
    return cid, name


def resolve_name(name: str) -> tuple[str, str]:
    """채널 이름으로 유튜브 '채널' 검색 → 첫 번째 결과 (채널 id, 채널 이름)."""
    import urllib.parse
    import yt_dlp
    opts = ydl_opts()
    opts["playlist_items"] = "1-3"
    url = "https://www.youtube.com/results?sp=EgIQAg%3D%3D&search_query=" + urllib.parse.quote(name)
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    for e in info.get("entries") or []:
        cid = e.get("channel_id") or e.get("id") or ""
        if cid.startswith("UC"):
            return cid, e.get("channel") or e.get("title") or e.get("uploader") or name
    raise ValueError(f"'{name}' 채널을 못 찾았어요")


def feed(cid: str) -> list[dict]:
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={cid}"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as r:
        root = ET.fromstring(r.read())
    out = []
    for e in root.findall("a:entry", NS):
        out.append({"id": e.findtext("yt:videoId", "", NS), "title": e.findtext("a:title", "", NS),
                    "published": e.findtext("a:published", "", NS)})
    return out


def is_item_video(title: str) -> bool:
    t = title.lower().replace(" ", "")
    return any(k.lower().replace(" ", "") in t for k in KEYWORDS)


def license_of(vid: str) -> str:
    try:
        import yt_dlp
        opts = ydl_opts()
        opts.pop("extract_flat", None)
        opts.pop("playlist_items", None)
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(f"https://youtu.be/{vid}", download=False)
        return info.get("license") or ""
    except Exception as e:
        return f"확인 실패({type(e).__name__})"


def notify(text: str):
    if sys.platform == "darwin":
        safe = text.replace('"', "'")
        subprocess.run(["osascript", "-e", f'display notification "{safe}" with title "셀럽템 새 영상"'],
                       capture_output=True)


def check():
    chans = load(CHANNELS, {})
    if not chans:
        sys.exit("등록된 채널이 없어요. 예) python3 watch.py add https://youtu.be/NDyePWmIYeM")
    seen = set(load(SEEN, []))
    first_run = not seen
    since = datetime.now(timezone.utc) - timedelta(days=14)
    found = []
    for cid, name in chans.items():
        try:
            items = feed(cid)
        except Exception as e:
            print(f"⚠️ {name}: 목록을 못 읽었어요 ({type(e).__name__})")
            continue
        for v in items:
            if v["id"] in seen:
                continue
            seen.add(v["id"])
            try:
                when = datetime.fromisoformat(v["published"].replace("Z", "+00:00"))
            except ValueError:
                when = datetime.now(timezone.utc)
            if first_run and when < since:  # 처음 실행 땐 최근 2주 것만
                continue
            if is_item_video(v["title"]):
                found.append((name, v, when))
    save(SEEN, sorted(seen))
    if not found:
        print("🔍 새로 올라온 아이템 소개 영상이 없어요.")
        return
    OUT.mkdir(exist_ok=True)
    lines = [f"\n## {datetime.now():%Y-%m-%d %H:%M} 확인"]
    for name, v, when in sorted(found, key=lambda x: x[2], reverse=True):
        lic = license_of(v["id"])
        cc = "✅ CC" if "creative commons" in lic.lower() else ("⛔ CC 아님" if lic and "실패" not in lic else f"❔ {lic}")
        line = f"- {cc} | {name} | {v['title']} | https://youtu.be/{v['id']} ({when:%m/%d})"
        print(line)
        lines.append(line)
    with (OUT / "새영상.md").open("a", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    notify(f"아이템 소개 영상 {len(found)}개: " + ", ".join(n for n, _, _ in found[:3]))
    print(f"\n📝 out/새영상.md 에 적어뒀어요. 마음에 드는 링크를 보내주세요.")


def install():
    if sys.platform != "darwin":
        sys.exit("자동 확인 설치는 맥에서만 돼요.")
    log = HERE / "work" / "watch.log"
    plist = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.celebpick.watch</string>
<key>ProgramArguments</key><array><string>{sys.executable}</string><string>{HERE / 'watch.py'}</string></array>
<key>WorkingDirectory</key><string>{HERE}</string>
<key>StartCalendarInterval</key><array>
<dict><key>Hour</key><integer>10</integer><key>Minute</key><integer>7</integer></dict>
<dict><key>Hour</key><integer>18</integer><key>Minute</key><integer>7</integer></dict>
</array>
<key>StandardOutPath</key><string>{log}</string><key>StandardErrorPath</key><string>{log}</string>
</dict></plist>"""
    PLIST.parent.mkdir(parents=True, exist_ok=True)
    PLIST.write_text(plist, encoding="utf-8")
    subprocess.run(["launchctl", "unload", str(PLIST)], capture_output=True)
    subprocess.run(["launchctl", "load", str(PLIST)])
    print("✅ 매일 오전 10시·오후 6시에 자동으로 확인하고, 새 영상이 있으면 맥 알림을 띄워요.\n"
          "   (이 폴더를 옮기면 다시 설치해야 해요. 끄기: python3 watch.py --uninstall)")


def main():
    a = sys.argv[1:]
    if a[:1] == ["add"] and len(a) > 1:
        chans = load(CHANNELS, {})
        for url in a[1:]:
            try:
                # 링크·@핸들이면 바로, 그냥 이름이면 유튜브 채널 검색으로 찾기
                cid, name = resolve(url) if re.match(r"(https?://|@)", url) else resolve_name(url)
            except Exception as e:
                print(f"⚠️ 등록 실패: {url} ({e})")
                continue
            chans[cid] = name
            print(f"✅ 등록: {url} → {name}  (https://www.youtube.com/channel/{cid})")
        save(CHANNELS, chans)
    elif a[:1] == ["list"]:
        for cid, name in load(CHANNELS, {}).items():
            print(f"- {name}  https://www.youtube.com/channel/{cid}")
    elif "--install" in a:
        install()
    elif "--uninstall" in a:
        subprocess.run(["launchctl", "unload", str(PLIST)], capture_output=True)
        PLIST.unlink(missing_ok=True)
        print("자동 확인을 껐어요.")
    else:
        check()


if __name__ == "__main__":
    main()
