"""채널 공용 효과음을 직접 합성한다 (저작권 걱정 없음). 결과: youtube/studio/public/sfx/*.wav"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).parent.parent / "studio" / "public" / "sfx"


def save(name: str, x: np.ndarray) -> None:
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def t(sec: float) -> np.ndarray:
    return np.arange(int(SR * sec)) / SR


rng = np.random.default_rng(7)


def lowpass(x: np.ndarray, a: float) -> np.ndarray:
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


# 엘리베이터 도착 '띵': 맑은 두 음 + 긴 여운
tt = t(1.4)
ding = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) * g for f, d, g in [(1318.5, 3.0, 1.0), (2637, 5.0, 0.35), (1975.5, 4.0, 0.25)])
save("ding", ding)

# 쑥 들어가는 소리: 점점 높아지고 커지는 바람
tt = t(0.7)
noise = rng.standard_normal(len(tt))
sweep = lowpass(noise, 0.02) + 0.6 * lowpass(noise, 0.15) * np.linspace(0, 1, len(tt))
save("whoosh", sweep * np.sin(np.pi * np.linspace(0, 1, len(tt))) ** 1.5)

# 네온 지직: 60Hz 계열 윙 소리에 불규칙한 끊김
tt = t(0.9)
hum = np.sign(np.sin(2 * np.pi * 120 * tt)) * 0.4 + np.sin(2 * np.pi * 240 * tt) * 0.3
flick = (rng.random(len(tt) // 2400 + 1) > 0.3).repeat(2400)[: len(tt)]
save("buzz", lowpass(hum * flick, 0.3) * np.exp(-tt * 1.2))

# 글리치: 잘게 끊긴 디지털 잡음 + 짧은 비프
tt = t(0.5)
seg = (rng.random(len(tt) // 800 + 1) > 0.5).repeat(800)[: len(tt)]
glitch = rng.standard_normal(len(tt)) * seg * 0.6 + np.sign(np.sin(2 * np.pi * 880 * tt)) * (1 - seg) * 0.3
save("glitch", glitch * np.exp(-tt * 3))

# 쿵: 낮은 음이 떨어지며 사라짐 (死 강조, 인장)
tt = t(0.8)
f = 110 * np.exp(-tt * 3) + 40
thud = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 5) + lowpass(rng.standard_normal(len(tt)), 0.05) * np.exp(-tt * 30) * 2
save("thud", thud)

# 톡: 동그라미·물음표 같은 그래픽이 튀어나올 때
tt = t(0.18)
save("pop", np.sin(2 * np.pi * (600 + 900 * tt / 0.18) * tt) * np.exp(-tt * 30))

# 지도 확대 '스윽' 상승음: 낮은 바람 + 위로 올라가는 음, 끝으로 갈수록 커짐 (오프닝 처음부터)
tt = t(1.3)
noise = rng.standard_normal(len(tt))
air = lowpass(noise, 0.01) * 3 + lowpass(noise, 0.06) * np.linspace(0.2, 1, len(tt))
tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (tt / 0.65)) / SR) * 0.35
save("riser", (air + tone) * np.linspace(0.05, 1, len(tt)) ** 2)

# 서울 표시가 찍힐 때 맑은 '팅'
tt = t(0.6)
save("chime", (np.sin(2 * np.pi * 1760 * tt) + 0.5 * np.sin(2 * np.pi * 2640 * tt)) * np.exp(-tt * 8))

print("done:", sorted(p.name for p in OUT.glob("*.wav")))
