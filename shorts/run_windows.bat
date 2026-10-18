@echo off
chcp 65001 > nul
cd /d "%~dp0"

rem 파이썬 찾기 (python 또는 py)
set "PY="
where python >nul 2>nul && set "PY=python"
if not defined PY where py >nul 2>nul && set "PY=py"
if not defined PY (
  echo 파이썬이 없습니다. https://www.python.org/downloads/ 에서 설치하세요.
  echo 설치 첫 화면에서 "Add python.exe to PATH" 체크 필수!
  pause
  exit /b
)

echo 준비 중... (처음엔 1분 정도 걸려요)
%PY% -m pip install -q -U "yt-dlp[default]"

:loop
echo.
set "URL="
set /p "URL=유튜브 링크 붙여넣고 Enter (끝내려면 그냥 Enter): "
if not defined URL goto end
%PY% scan.py "%URL%"
start "" "out"
goto loop

:end
