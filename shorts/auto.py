"""
완전 자동: 유튜브 링크만 주면 → 자막 스캔 → (Claude가) 제품 고르기·대본 쓰기 → 검수 → 빈 번호 채우기 → 영상 제작

사용
  python3 auto.py https://youtu.be/링크1 https://youtu.be/링크2 ...
  python3 auto.py --dry 링크      # 대본만 만들고 영상은 안 만듦 (확인용)

준비 (처음 한 번)
  python3 -m pip install -U anthropic
  Claude API 키를 shorts/anthropic_key.txt 에 한 줄로 저장 (또는 ANTHROPIC_API_KEY 환경변수)

규칙은 recipe_rules.md (대본 쓰는 법), NARRATION.md (말투)를 그대로 Claude에게 줌.
"""
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
RECIPES = HERE / "recipes"
OUT = HERE / "out"
MODEL = "claude-opus-5-5"

sys.argv_real = sys.argv
sys.argv = [sys.argv[0]]
import make_short as ms  # noqa: E402
import review as rv  # noqa: E402
sys.argv = sys.argv_real

PART = {
    "type": "object", "additionalProperties": False,
    "properties": {"type": {"type": "string", "enum": ["tts", "clip"]},
                   "text": {"type": "string"}, "from": {"type": "string"}, "to": {"type": "string"}},
    "required": ["type", "text", "from", "to"],
}
RECIPE = {
    "type": "object", "additionalProperties": False,
    "properties": {
        "product": {"type": "string", "description": "제품 짧은 이름 (파일 이름용, 예: 빨대텀블러)"},
        "celeb": {"type": "string", "description": "출연자 이름 (예: 이현이)"},
        "job": {"type": "string", "description": "직업·그룹 (예: 모델, 배우, 트와이스)"},
        "why_enough": {"type": "string", "description": "이 제품을 고른 이유: 셀럽이 무엇을 충분히 말했는지"},
        "title1": {"type": "string"}, "title2": {"type": "string"},
        "caption": {"type": "string"},
        "points": {"type": "array", "items": {"type": "string"}},
        "hashtags": {"type": "array", "items": {"type": "string"}},
        "highlight": {"type": "array", "items": {"type": "string"}},
        "bgm_mood": {"type": "string", "enum": ["기본", "귀여운", "세련된", "상쾌한"]},
        "coupang_query": {"type": "string"},
        "sub_fix": {"type": "array", "items": {
            "type": "object", "additionalProperties": False,
            "properties": {"wrong": {"type": "string"}, "right": {"type": "string"}},
            "required": ["wrong", "right"]}},
        "parts": {"type": "array", "items": PART},
    },
    "required": ["product", "celeb", "job", "why_enough", "title1", "title2", "caption", "points", "hashtags",
                 "highlight", "bgm_mood", "coupang_query", "sub_fix", "parts"],
}
SCHEMA = {
    "type": "object", "additionalProperties": False,
    "properties": {"recipes": {"type": "array", "items": RECIPE},
                   "skipped": {"type": "string", "description": "만들지 않은 제품과 이유 (짧게)"}},
    "required": ["recipes", "skipped"],
}

INSTRUCTIONS = """너는 쿠팡 파트너스 셀럽템 쇼츠 계정의 대본 작가다. 아래 규칙서와 말투 가이드를 그대로 따른다.

출력 형식 메모
- parts: 첫 항목은 반드시 tts, tts는 최대 2개. tts 항목은 text만 쓰고 from/to는 빈 문자열.
  clip 항목은 text는 빈 문자열, from/to는 자막 문장을 글자 그대로 몇 어절 복사.
- title1/title2: 두 줄 제목. 출연자 이름은 [[이름]]으로 감싼다 (예: "[[박지현]]의 미니 빗").
- caption 첫 단어는 직업 또는 그룹 (예: "배우 박지현이 …", "트와이스 사나가 …").
- sub_fix: 자동자막 받아쓰기 오류만 고친다 (화면 자막용). 구간 찾기(from/to)는 고치기 전 원문으로 쓴다.
- 내용이 충분한 제품만 만든다. 개수는 정해져 있지 않다 (0개도 가능).
- 실제 말 받아쓰기가 아니라 번역 자막으로 보이면(문장이 어색한 번역투) recipes를 비우고 skipped에 그 이유를 쓴다.

=== 규칙서 ===
{rules}

=== 말투 가이드 ===
{narration}

=== 잘 된 레시피 예시 (JSON) ===
{example}
"""


def client():
    try:
        import anthropic
    except ImportError:
        sys.exit("anthropic 패키지가 없어요. 먼저 실행하세요:  python3 -m pip install -U anthropic")
    key = os.environ.get("ANTHROPIC_API_KEY") or ((HERE / "anthropic_key.txt").read_text().strip()
                                                    if (HERE / "anthropic_key.txt").exists() else "")
    if not key:
        sys.exit("Claude API 키가 없어요. shorts/anthropic_key.txt 에 키를 한 줄로 저장해 주세요.")
    return anthropic.Anthropic(api_key=key)


def scan(url: str) -> Path:
    vid = ms._video_id(url)
    txt = OUT / f"자막_{vid}.txt"
    if not txt.exists():
        subprocess.run([sys.executable, str(HERE / "scan.py"), url, "--full", "--no-comments"])
    if not txt.exists():
        raise RuntimeError(f"자막을 못 받았어요 (429면 30분 뒤 다시): {url}")
    return txt


def subs_from_txt(txt: Path) -> "ms.Subs":
    lines = []
    for l in txt.read_text(encoding="utf-8").splitlines():
        m = re.match(r"\[(\d+):(\d+)\] (.*)", l)
        if m:
            lines.append([int(m[1]) * 60 + int(m[2]), 0.0, ms.clean_text(m[3])])
    for k in range(len(lines)):
        lines[k][1] = lines[k + 1][0] if k + 1 < len(lines) else lines[k][0] + 3
    return ms.Subs([tuple(x) for x in lines])


def ask(cl, txt: Path, feedback: str = "") -> dict:
    example = next((p for p in sorted(RECIPES.rglob("*.json")) if "_보류" not in str(p)), None)
    system = INSTRUCTIONS.format(
        rules=(HERE / "recipe_rules.md").read_text(encoding="utf-8"),
        narration=(HERE / "NARRATION.md").read_text(encoding="utf-8"),
        example=example.read_text(encoding="utf-8") if example else "{}")
    user = f"아래 영상 자막으로 레시피를 만들어줘.\n\n{txt.read_text(encoding='utf-8')}"
    if feedback:
        user += f"\n\n=== 지난번 대본의 검수 결과 (고쳐서 다시) ===\n{feedback}"
    resp = cl.beta.messages.create(
        model=MODEL, max_tokens=16000,
        betas=["server-side-fallback-2026-07-01"], fallbacks="default",  # 정책상 거절되면 다른 모델로 자동 재시도
        output_config={"effort": "high", "format": {"type": "json_schema", "schema": SCHEMA}},
        system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": user}],
    )
    if resp.stop_reason == "refusal":
        raise RuntimeError("Claude가 이 요청을 거절했어요")
    text = next(b.text for b in resp.content if b.type == "text")
    return json.loads(text)


# ---------------------------------------------------------------- 번호 매기기

def link_no(r: dict) -> int | None:
    m = re.search(r"(\d+)", r.get("link_text", ""))
    return int(m.group(1)) if m else None


def numbering():
    """이미 쓴 번호 → (번호: 출연자) 와 다음에 채울 시작 번호."""
    used = {}
    done_max = 0
    for p in RECIPES.rglob("*.json"):
        if "_보류" in p.parts:
            continue
        r = json.loads(p.read_text(encoding="utf-8"))
        n = link_no(r)
        if n is None:
            continue
        name = re.findall(r"\[\[(.*?)\]\]", r.get("title1", "") + r.get("title2", ""))
        used[n] = name[0] if name else p.stem.split("_")[0]
        if "_완료" in p.parts:
            done_max = max(done_max, n)
    return used, done_max + 1


def pick_number(used: dict, start: int, celeb: str) -> int:
    """비어 있는 번호 중 가장 작은 것, 앞뒤 번호가 같은 출연자면 건너뜀. (이미 정한 번호는 안 바꿈)"""
    n = start
    while True:
        if n not in used and used.get(n - 1) != celeb and used.get(n + 1) != celeb:
            return n
        n += 1


# ---------------------------------------------------------------- 메인

def build(url: str, cl, dry: bool) -> list[Path]:
    print(f"\n🎬 {url}")
    txt = scan(url)
    subs = subs_from_txt(txt)
    head = txt.read_text(encoding="utf-8").splitlines()[:3]
    made, feedback = [], ""
    for attempt in range(3):  # 검수에 걸리면 이유를 알려주고 최대 2번 다시 쓰게 함
        print(f"   ✍️ Claude가 대본 쓰는 중… ({attempt + 1}차)")
        out = ask(cl, txt, feedback)
        if out.get("skipped"):
            print(f"   ⏭️ 안 만든 것: {out['skipped']}")
        failed = []
        used, start = numbering()
        for r in out["recipes"]:
            stem = re.sub(r"[^\w가-힣]+", "", r["celeb"]) + "_" + re.sub(r"[^\w가-힣]+", "", r["product"])
            path = RECIPES / f"{stem}.json"
            if path.exists() and attempt == 0:
                print(f"   ⏭️ 이미 있음: {stem}")
                continue
            n = link_no(json.loads(path.read_text(encoding="utf-8"))) if path.exists() else \
                pick_number(used, start, r["celeb"])
            recipe = {
                "source": url, "auto": True,
                "title1": r["title1"], "title2": r["title2"], "link_text": f"프로필 링크 {n}번",
                "coupang_query": r["coupang_query"],
                "theme": "celebpick", "sub_theme": "story_green", "clip_subs": True, "blur": True,
                "google_voice": "ko-KR-Chirp3-HD-Kore", "google_rate": 1.3, "broll_hint": r["job"],
                "caption": r["caption"], "points": r["points"], "hashtags": r["hashtags"],
                "highlight": r["highlight"], "bgm_mood": r["bgm_mood"],
                "sub_fix": {x["wrong"]: x["right"] for x in r["sub_fix"] if x["wrong"]},
                "why_enough": r["why_enough"],
                "parts": [{"type": "tts", "text": p["text"], **({"media": ["auto"]} if i == 0 else {})}
                          if p["type"] == "tts" else {"type": "clip", "from": p["from"], "to": p["to"]}
                          for i, p in enumerate(r["parts"])],
            }
            path.write_text(json.dumps(recipe, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            try:
                warn, _ = rv.review(path, subs)
            except SystemExit as e:  # 문구를 자막에서 못 찾음 등
                warn = [f"대본 확인 실패: {str(e).strip()[:200]}"]
            block = [w for w in warn if not w.startswith("💡")]
            if block:
                failed.append(f"- {stem}: " + " / ".join(block))
                path.unlink()
                print(f"   ⛔ {stem}: {' / '.join(block)}")
            else:
                used[n] = r["celeb"]
                made.append(path)
                print(f"   ✅ {n}번 {stem} — {r['why_enough'][:60]}")
        if not failed:
            break
        feedback = "다음 레시피가 검수에 걸려서 빠졌어. 걸린 것만 고쳐서 다시 줘 (통과한 건 다시 주지 마):\n" + "\n".join(failed)
    return made


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry" in sys.argv
    if not args:
        sys.exit(__doc__)
    cl = client()
    made = []
    for i, url in enumerate(args):
        try:
            made += build(url, cl, dry)
        except Exception as e:
            print(f"   ⚠️ {url}: {e}")
        if i < len(args) - 1:
            time.sleep(30)  # 유튜브 429 방지
    print(f"\n📝 새 레시피 {len(made)}개")
    if made and not dry:
        subprocess.run([sys.executable, str(HERE / "plan.py"), "--make"])


if __name__ == "__main__":
    main()
