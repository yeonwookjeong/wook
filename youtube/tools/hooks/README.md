# 후킹 점수 · 이탈 분석 도구

출처: uplika/uplika-plugin (MIT) 안의 yt-script, yt-retention, yt-edit 스크립트.
원래는 Jakeschincariol/youtube-agent-skill (MIT)이다. 라이선스 전문은 이 폴더의 LICENSE_* 파일에 있다.
모두 파이썬 기본 기능만 쓰고, 인터넷에 연결하지 않는다 (2026-11-14 코드 확인).

## 후킹 점수
    python3 hookscore.py lines.txt        # 한 줄에 문장 하나
    python3 hookscore.py --json lines.txt

## 이탈 분석 (스튜디오 > 분석 > 참여도 > 시청자 유지율 > 다운로드)
    python3 retention.py retention.csv --duration 35
    python3 retention.py retention.csv --transcript subs.srt
