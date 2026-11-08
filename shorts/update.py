"""
최신 버전으로 업데이트 (폴더를 옮기거나 새로 받을 필요 없음)

GitHub에서 최신 코드와 레시피만 받아서 이 폴더에 덮어씁니다.
work(원본 영상 캐시), out(만든 영상), bgm, broll, 키 파일들은 그대로 둡니다.

사용
  python3 update.py          # 업데이트만
  python3 update.py --make   # 업데이트 후 바로 영상 만들기 (plan.py --make)
"""
import io
import shutil
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ZIP_URL = "https://github.com/yeonwookjeong/wook/archive/refs/heads/claude/coupang-shorts-tts-k8qbz1.zip"
KEEP_DIRS = {"work", "out", "bgm", "broll", "my_tts", "fonts", "__pycache__"}  # 사장님 자료: 건드리지 않음
KEEP_FILES = {"google_tts_key.txt", "gemini_key.txt", "elevenlabs_key.txt", "kakao_key.txt", "naver_key.txt",
              "browser.txt", "channels.json"}


def main():
    print("⬇️  최신 버전 받는 중…")
    try:
        with urllib.request.urlopen(ZIP_URL, timeout=60) as r:
            data = r.read()
    except Exception as e:
        sys.exit(f"❌ 받기 실패({type(e).__name__}). 인터넷 연결을 확인하고 다시 실행해 주세요.")
    z = zipfile.ZipFile(io.BytesIO(data))
    prefix = next(n for n in z.namelist() if n.endswith("/shorts/"))  # 압축 안의 shorts 폴더
    changed, removed = 0, 0
    new_recipes = set()
    for info in z.infolist():
        raw = info.filename
        # 한글 파일 이름: UTF-8 표시가 없는 압축이면 직접 바꿔 읽음
        name = raw if info.flag_bits & 0x800 else raw.encode("cp437", "replace").decode("utf-8", "replace")
        if not name.startswith(prefix) or name.endswith("/"):
            continue
        rel = Path(name[len(prefix):])
        if rel.parts[0] in KEEP_DIRS and rel.name != "README.txt":
            continue
        if rel.name in KEEP_FILES:
            continue
        if rel.parts[0] == "recipes":
            new_recipes.add(rel)
        dst = HERE / rel
        body = z.read(info)
        if dst.exists() and dst.read_bytes() == body:
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(body)
        changed += 1
    # 레시피는 GitHub과 똑같이 맞춤 (올린 영상은 _완료로 옮겨지므로, 예전 위치에 남은 건 지움)
    for f in ((HERE / "recipes").rglob("*.json") if new_recipes else []):
        if f.relative_to(HERE) not in new_recipes:
            f.unlink()
            removed += 1
    print(f"✅ 업데이트 완료 (바뀐 파일 {changed}개" + (f", 정리한 레시피 {removed}개" if removed else "") + ")")
    if "--make" in sys.argv:
        subprocess.run([sys.executable, str(HERE / "plan.py"), "--make"])


if __name__ == "__main__":
    main()
