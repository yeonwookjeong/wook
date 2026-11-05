# 내레이션 목소리 (Kokoro, 무료)

맥 터미널에서 처음 한 번:
```bash
cd ~/Documents/wook && git pull && cd youtube/tts
brew install python@3.12 && /opt/homebrew/bin/python3.12 -m venv .venv-tts && source .venv-tts/bin/activate && pip install kokoro-onnx soundfile   # 3.15는 onnxruntime 미지원(2026-11)
curl -L -O https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -O https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

샘플 만들기:
```bash
cd ~/Documents/wook/youtube/tts && source .venv-tts/bin/activate && python make_samples.py && open samples
```

EP01 내레이션 만들기 (목소리를 고른 뒤):
```bash
cd ~/Documents/wook/youtube/tts && source .venv-tts/bin/activate && python make_ep01.py af_heart
cd ../studio && npx remotion render src/index.ts Ep01 out/ep01.mp4 && open out/ep01.mp4
```
`af_heart` 자리에 고른 목소리 이름을 넣는다. 두 번째 숫자로 속도 조절 가능(예: `python make_ep01.py af_heart 1.1`).
