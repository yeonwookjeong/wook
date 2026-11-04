# 맥에서 원본 영상 정리하기 (M3 MacBook Pro 기준)

외장하드에 있는 원본을 업로드하지 않고, 맥에서 직접 읽어서 아래 결과물을 만든다.
원본은 읽기만 하고 수정하지 않는다. 결과는 여행 폴더 안 `_index/`에만 저장된다.

| 결과물 | 내용 |
|---|---|
| `_index/clips.md` | 날짜별 클립 목록 (촬영 시각, 길이, 소리 유무, GPS) |
| `_index/sheets/*.jpg` | 클립마다 장면표 한 장 (몇 초 간격 컷 모음) |
| `_index/transcripts.md` | 말소리 받아쓰기 (몇 분 몇 초에 무슨 말을 했는지) |

## 1. 처음 한 번만 설치

**터미널** 앱을 연다 (Spotlight에서 ⌘+Space를 누르고 "터미널" 입력).

```bash
# Homebrew가 없을 때만 설치 (있으면 건너뛴다)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 영상 처리 도구와 Python
brew install ffmpeg python

# 받아쓰기 도구 (애플 칩 전용 Whisper)
python3 -m venv ~/.venvs/footage
~/.venvs/footage/bin/pip install mlx-whisper

# 이 저장소 내려받기
git clone https://github.com/yeonwookjeong/wook.git ~/wook
cd ~/wook && git checkout claude/video-automation-feasibility-2lsi1t
```

**Claude Code 설치**: https://claude.ai/download 에서 데스크톱 앱을 받거나, 터미널에서 아래 명령을 실행한다.
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

## 2. 실행

외장하드를 꽂으면 `/Volumes/외장하드이름/` 아래에 보인다.
처음 실행할 때 "터미널이 이동식 볼륨의 파일에 접근하려고 합니다"라는 창이 뜨면 **허용**을 누른다.

```bash
cd ~/wook
F="/Volumes/외장하드이름/여행/영국"   # Finder에서 폴더를 터미널 창으로 끌어다 놓으면 경로가 입력된다

~/.venvs/footage/bin/python youtube/tools/footage.py index "$F"       # 몇 분
~/.venvs/footage/bin/python youtube/tools/footage.py sheets "$F"      # 수십 분
~/.venvs/footage/bin/python youtube/tools/footage.py transcribe "$F"  # 가장 오래 걸림
```

- 중간에 멈춰도 괜찮다. 다시 실행하면 이미 만든 결과는 건너뛰고 이어서 처리한다.
- 받아쓰기를 처음 실행하면 모델(약 1.6GB)을 한 번 내려받는다.
- 노트북 전원을 연결하고, 덮개를 닫지 않은 상태로 돌린다.

## 3. Claude Code에 맡기기

위 명령을 직접 치지 않아도 된다. `~/wook`에서 Claude Code를 열고 이렇게 말하면 된다.

> youtube/SETUP_MAC.md 대로 /Volumes/외장하드이름/여행/영국 폴더 처리해줘. 끝나면 장면표랑 대본 보고 영국 시리즈 구성안 짜줘.
