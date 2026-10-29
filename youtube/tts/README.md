# 내레이션 목소리 (Kokoro, 무료)

맥 터미널에서 처음 한 번:
```bash
cd ~/Documents/wook && git pull && cd youtube/tts
python3 -m venv .venv && source .venv/bin/activate && pip install kokoro-onnx soundfile
curl -L -O https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -O https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

샘플 만들기:
```bash
cd ~/Documents/wook/youtube/tts && source .venv/bin/activate && python make_samples.py && open samples
```
