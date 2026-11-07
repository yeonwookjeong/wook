"""
검수: 레시피(대본)를 영상 만들기 전에 자동으로 점검하고, 만든 영상은 장면 사진 한 장으로 훑어보게 해줌.

점검 항목
  - TTS로 시작하는지, TTS가 2개 이하인지
  - 전체 길이 (너무 짧거나 길지 않은지)
  - 클립이 앞 문장 꼬리로 시작하지 않는지
  - 마지막이 흐지부지 끝나지 않는지 (이어지는 말, 상대방 리액션, 추임새로 끝나면 경고)
  - 자막이 비는 구간이 없는지
  - 자동자막 오타 의심 (mm 단위, 같은 말 반복, 숫자+한글 붙음 등)

사용
  python3 review.py                 # recipes/*.json 전부 → out/검수/검수결과.md
  python3 review.py recipes/X.json  # 하나만
  python3 review.py --sheet         # 이미 만든 영상(out/쇼츠_*.mp4)마다 1초 간격 장면 사진 → out/검수/장면_*.jpg
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.argv_backup = sys.argv
sys.argv = [sys.argv[0]]  # make_short가 실행 인자를 읽지 않게
import make_short as ms  # noqa: E402
sys.argv = sys.argv_backup

CONCLUDE = re.compile(r"(요|다|죠|니다|네요|거든요|더라고요|어요|아요|예요|에요|해요|세요)[.?!~]*$")
DANGLE = re.compile(r"(고|는데|은데|서|니까|면|지만|가지고|하고|해서|인데|거나|며|면서|구요)[.,]*$")


def _fix(text: str, fixes: dict) -> str:
    for wrong, right in fixes.items():
        text = text.replace(wrong, right)
    return text


def review(rpath: Path, subs: "ms.Subs") -> tuple[list, list]:
    """(경고 목록, 대본 줄 목록)"""
    recipe = json.loads(rpath.read_text(encoding="utf-8"))
    fixes = recipe.get("sub_fix", {})
    warn, script = [], []
    parts = recipe.get("parts", [])
    tts = [p for p in parts if p.get("type") == "tts"]
    if not parts or parts[0].get("type") != "tts":
        warn.append("TTS로 시작하지 않아요")
    if len(tts) > 2:
        warn.append(f"TTS가 {len(tts)}개예요 (최대 2개)")

    plan = ms.plan_parts(recipe, subs, ms.ffmpeg_exe(), None, True)
    total = sum(p["end"] - p["start"] for p in plan)
    clip_total = sum(p["end"] - p["start"] for p in plan if p["type"] == "clip") / 1.15  # 말 빠르게 감안
    est = clip_total + sum(p["end"] - p["start"] for p in plan if p["type"] == "tts")
    if est < 15:
        warn.append(f"💡 너무 짧아요 (약 {est:.0f}초)")
    if est > 42:
        warn.append(f"💡 길어요 (약 {est:.0f}초) — 클립을 좁히는 게 좋아요")

    clips = [p for p in plan if p["type"] == "clip"]
    for n, p in enumerate(plan):
        if p["type"] == "tts":
            script.append(f"🔊 {p['part']['text']}")
            continue
        lines = [(s, e, t) for s, e, t in subs.lines if e > p["start"] + 0.2 and s < p["end"] - 0.2]
        if not lines:
            warn.append(f"{ms.fmt(p['start'])} 클립에 자막이 없어요")
            continue
        for s, e, t in lines:
            script.append(f"🎬 [{ms.fmt(s)}] {_fix(t, fixes)}")
        # 앞 문장 꼬리로 시작하는지: 바로 앞 줄이 문장 끝이 아니고 붙어 있으면
        raw = lines[0][2]
        first_word = p["part"].get("from", "").split(" ")[0]
        pos = raw.find(first_word) if first_word else -1
        before = raw[:pos].replace(">>", " ").strip() if pos > 0 else ""
        if pos > 0:  # 줄 중간에서 시작: 단어 시각으로 그 자리에서 정확히 자르므로 앞 말이 이어지는 경우만 경고
            last_w = before.split()[-1] if before.split() else ""
            # '그리고/근데' 같은 이음말 뒤에서 자르는 건 OK, '맛있는 / 빗'처럼 꾸밈말 뒤에서 자르면 경고
            bad_start = bool(re.search(r"(는|은|을|를|의|한|던)$", last_w)) and last_w not in ("이거는", "저는", "제가는")
        else:  # 줄 처음에서 시작: 바로 앞 줄이 문장 끝인지 (앞 줄이 '예', '어' 같은 추임새면 OK)
            prev = [x for x in subs.lines if x[1] <= lines[0][0] + 0.05]
            bad_start = bool(prev) and not raw.lstrip().startswith(">>") \
                and ms.norm(prev[-1][2]) not in ms._FILLERS and len(ms.norm(prev[-1][2])) > 2 \
                and not re.search(r"([.?!]|요|용|다|죠|더라고|거든|잖아|네|지)$", prev[-1][2].strip()) and lines[0][0] - prev[-1][1] < 0.3
        if bad_start:
            warn.append(f"[{ms.fmt(lines[0][0])}] 앞 문장 꼬리로 시작하는 것 같아요: '{raw.strip()[:24]}'")
        # 자막 빈 구간 (화면 자막 기준)
        ch = ms.Subs([(s, e, _fix(t, fixes)) for s, e, t in subs.lines]).chunks(p["start"], p["end"])
        if ch:
            gaps = [(a1, b0) for (_, a1, _), (b0, _, _) in zip(ch, ch[1:]) if b0 - a1 > 1.2]
            for a1, b0 in gaps:
                warn.append(f"💡 [{ms.fmt(a1)}~{ms.fmt(b0)}] {b0 - a1:.1f}초 동안 자막이 없어요")
        # 오타 의심 (자동자막)
        for s, e, t in lines:
            t2 = _fix(t, fixes)
            sus = []
            if re.search(r"\d+\s?mm\b", t2):
                sus.append("mm 단위")
            if re.search(r"(\S{2,})\s+\1", t2):
                sus.append("같은 말 반복")
            if re.search(r"\d[가-힣]체|[가-힣]{2}이\s?[가-힣]{2}에\b", t2):
                sus.append("받아쓰기 오류 의심")
            if sus:
                warn.append(f"💡 [{ms.fmt(s)}] 오타 의심({', '.join(sus)}): '{t2.strip()[:30]}'")
        # 마지막이 흐지부지인지
        if p is clips[-1]:
            last = _fix(lines[-1][2], fixes).strip()
            tail = last.split(">>")[-1].strip()
            if ">>" in lines[-1][2] and lines[-1][2].strip().index(">>") > 0:
                warn.append(f"마지막 줄에 다른 사람 말이 섞여 있어요: '{last[:30]}'")
            if re.search(r"단점|불편|별로|아쉬|안 좋|싫더라", " ".join(_fix(x[2], fixes) for x in lines[-2:])):
                warn.append("마지막에 단점·부정적인 말이 들어가요 (사고 싶게 끝나야 해요)")
            if not tail or norm_start(tail) in ms._FILLERS:
                warn.append("추임새로 끝나요")
            elif DANGLE.search(tail) or not CONCLUDE.search(tail):
                warn.append(f"흐지부지 끝나요 (말이 안 닫힘): '…{tail[-20:]}'")
    script.append(f"⏱️ 예상 길이 약 {est:.0f}초 (계획상 {total:.0f}초)")
    return warn, script


def norm_start(t: str) -> str:
    return ms.norm(t)[:6]


def load_subs(recipe: dict) -> "ms.Subs":
    ff = ms.ffmpeg_exe()
    return ms.fetch_source(recipe["source"], ff)[1]


def sheet(mp4: Path):
    """만든 영상을 1초 간격으로 찍어 한 장으로 (자막·끝부분 훑어보기용)."""
    from PIL import Image, ImageDraw
    ff = ms.ffmpeg_exe()
    dur = ms.duration_of(ff, mp4)
    tmp = ms.WORK / f"sheet_{mp4.stem}"
    tmp.mkdir(parents=True, exist_ok=True)
    subprocess.run([ff, "-v", "error", "-y", "-i", str(mp4), "-vf", "fps=1,scale=216:-1",
                    str(tmp / "f_%03d.jpg")], check=True)
    frames = sorted(tmp.glob("f_*.jpg"))
    if not frames:
        return None
    cols = 8
    w, h = Image.open(frames[0]).size
    rows = (len(frames) + cols - 1) // cols
    out = Image.new("RGB", (cols * w, rows * (h + 22)), (255, 255, 255))
    d = ImageDraw.Draw(out)
    for i, f in enumerate(frames):
        x, y = (i % cols) * w, (i // cols) * (h + 22)
        out.paste(Image.open(f), (x, y + 22))
        d.text((x + 6, y + 4), f"{i}s", fill=(0, 0, 0))
    (ms.OUT / "검수").mkdir(parents=True, exist_ok=True)
    dst = ms.OUT / "검수" / f"장면_{mp4.stem.replace('쇼츠_', '')}.jpg"
    out.save(dst, quality=85)
    for f in frames:
        f.unlink()
    print(f"   🖼️ {dst.name} ({dur:.0f}초)")
    return dst


def main():
    ap = argparse.ArgumentParser(description="레시피 검수 / 영상 장면 사진")
    ap.add_argument("recipes", nargs="*")
    ap.add_argument("--sheet", action="store_true", help="만든 영상마다 1초 간격 장면 사진")
    a = ap.parse_args()
    if a.sheet:
        for mp4 in sorted(ms.OUT.glob("쇼츠_*.mp4")):
            sheet(mp4)
        return
    paths = [Path(p) for p in a.recipes] or sorted((HERE / "recipes").glob("*.json"))
    report, bad, failed = ["# 검수 결과\n"], 0, []
    for rp in paths:
        recipe = json.loads(rp.read_text(encoding="utf-8"))
        try:
            warn, script = review(rp, load_subs(recipe))
        except SystemExit as e:  # 원본·자막을 못 받음(429 등) → 만들 때 다시 시도하도록 막지는 않음
            warn, script = [f"💡 대본 확인 못 함 (원본·자막을 못 받음): {str(e).strip()[:120]}"], []
        except Exception as e:  # 검수 도구 자체 오류로 영상 만들기가 막히지 않게
            warn, script = [f"💡 검수 중 오류로 건너뜀: {type(e).__name__}: {str(e)[:120]}"], []
        block = [w_ for w_ in warn if not w_.startswith("💡")]  # 💡는 참고용(만들긴 함), 나머지는 안 만듦
        mark = "✅" if not block else "⛔"
        bad += bool(block)
        if block:
            failed.append(rp.stem)
        print(f"\n{mark} {rp.stem}  {recipe.get('link_text', '')}")
        for w_ in warn:
            print(f"   {'' if w_.startswith('💡') else '⛔ '}{w_}")
        report.append(f"## {mark} {rp.stem} ({recipe.get('link_text', '')})\n")
        report += [f"- {'' if w_.startswith('💡') else '⛔ '}{w_}" for w_ in warn] + [""] + [f"    {s}" for s in script] + [""]
    (ms.OUT / "검수").mkdir(parents=True, exist_ok=True)
    (ms.OUT / "검수" / "검수결과.md").write_text("\n".join(report), encoding="utf-8")
    # 검수에 걸린 레시피 목록 (plan.py --make는 이것들은 만들지 않음)
    (ms.OUT / "검수" / "실패목록.txt").write_text("\n".join(failed), encoding="utf-8")
    print(f"\n{'✅ 전부 통과' if not bad else f'⛔ {bad}개는 고쳐야 해요'} → {ms.OUT / '검수' / '검수결과.md'}")


if __name__ == "__main__":
    main()
