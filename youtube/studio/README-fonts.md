# 3D 장면 글꼴 (EP02부터)

캔버스 무늬는 컴퓨터에 설치된 글꼴을 쓴다. 렌더 전에 한 번 설치한다. 셋 다 OFL 무료 글꼴이다.

```
mkdir -p ~/.fonts && cd ~/.fonts
for f in nanumpenscript/NanumPenScript-Regular.ttf nanumbrushscript/NanumBrushScript-Regular.ttf lxgwwenkaitc/LXGWWenKaiTC-Bold.ttf; do
  curl -sSfL -o $(basename $f) "https://raw.githubusercontent.com/google/fonts/main/ofl/$f"
done
fc-cache -f
```
macOS는 받은 파일을 더블클릭해서 설치한다.

- Nanum Pen: 한글 손글씨 (빨간 펜 이름, 칠판)
- LXGW WenKai TC: 한자 붓글씨 (만장, 위패, 도장)
