import sys, numpy as np, onnxruntime as ort
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB"); W, H = im.size
s = 518; w = (int(s * W / H) // 14) * 14   # 세로 사진: 높이 518 기준, 14의 배수
x = np.asarray(im.resize((w, s), Image.BICUBIC), dtype=np.float32) / 255.0
x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
x = x.transpose(2, 0, 1)[None].astype(np.float32)
sess = ort.InferenceSession("depth.onnx", providers=["CPUExecutionProvider"])
d = sess.run(None, {sess.get_inputs()[0].name: x})[0].squeeze()
d = (d - d.min()) / (d.max() - d.min())          # 1 = 가까움
Image.fromarray((d * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).save(out)
print("depth", d.shape, "->", out)
