"""
과일철이네2 홍보 영상용 배경음악(15초) 생성 스크립트

외부 음원을 쓰지 않고 파이썬(numpy)으로 직접 합성한 자체 제작 음악입니다.
(저작권 걱정 없이 어디에나 올릴 수 있습니다)

- 150 BPM (한 박 = 0.4초) → 영상의 장면 전환(2.8초, 5.6초, 10.0초)이 박자에 딱 맞습니다.
- 0 ~ 2.8초 : "복불복이셨죠?" 질문 장면 - 궁금한 느낌의 작은 멜로디 + 째깍 소리 + 상승음
- 2.8초 ~   : "그럼 과일철이네2!" - 밝고 통통 튀는 마림바 + 드럼 + 베이스
- 장면 전환 와이프 소리(휙), 과일 20종 등장 소리(뽁), 카카오 버튼 반짝 소리 포함

사용법 (promo-video 폴더에서):
    pip install numpy
    python3 tools/make-bgm.py            # → assets/audio/bgm.wav 생성
    (이후 README 의 ffmpeg 명령으로 bgm.m4a 로 변환)
"""

import os
import wave

import numpy as np

SR = 44100
DUR = 15.0
N = int(SR * DUR)
BEAT = 0.4  # 150 BPM
GROOVE = 2.8  # 본 음악이 시작되는 시각 (그럼 과일철이네2!)

rng = np.random.default_rng(2)  # 항상 같은 결과가 나오도록 고정
L = np.zeros(N)
R = np.zeros(N)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0):
    """sig 를 t초 위치에 더합니다. pan: -1(왼쪽) ~ 1(오른쪽)"""
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
    R[i : i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414


def tt(d):
    return np.arange(int(d * SR)) / SR


def onepole_lp(x, cutoff):
    """간단한 로우패스 필터 (cutoff 는 숫자 또는 샘플별 배열)"""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc += a[k] * (x[k] - acc)
        y[k] = acc
    return y


def hp(x, cutoff):
    return x - onepole_lp(x, cutoff)


# ---------------- 악기 ----------------
def marimba(m, d=0.5):
    t = tt(d)
    f = midi(m)
    env = np.exp(-t * 9)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)
    s *= env * np.minimum(1, t * 800)
    return s


def pluck(m, d=0.35):
    t = tt(d)
    f = midi(m)
    s = sum(np.sin(2 * np.pi * f * h * t) / h**1.3 for h in range(1, 6))
    return s * np.exp(-t * 14) * np.minimum(1, t * 600)


def bass(m, d=0.35):
    t = tt(d)
    f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    env = np.minimum(1, t * 300) * np.exp(-t * 5)
    env[-400:] *= np.linspace(1, 0, 400)
    return s * env


def pad(notes, d):
    t = tt(d)
    s = np.zeros_like(t)
    for m in notes:
        for det in (-0.12, 0.12):
            f = midi(m + det)
            s += 2 * ((f * t) % 1) - 1  # 톱니파
    s = onepole_lp(s / (len(notes) * 2), 1400)
    env = np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.3)
    return s * env


def kick():
    t = tt(0.35)
    f = 50 + 110 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9)


def clap():
    t = tt(0.25)
    n = rng.standard_normal(len(t))
    n = hp(onepole_lp(n, 3000), 900)
    env = np.exp(-t * 22)
    for off in (0.0, 0.012, 0.024):  # 손뼉 여러 번 겹친 느낌
        k = int(off * SR)
        env[k : k + 200] += 0.6
    return n * env


def hat(d=0.06):
    t = tt(d)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 60)


def tick():
    t = tt(0.04)
    return np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 150)


def crash(d=1.6):
    t = tt(d)
    return hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 2.8)


def whoosh(d=0.7, peak=0.5):
    """장면 전환 '휙' 소리 - 노이즈의 밝기가 올라갔다 내려갑니다"""
    t = tt(d)
    x = t / d
    shape = np.where(x < peak, x / peak, (1 - x) / (1 - peak))
    cut = 300 + 5000 * shape**2
    s = onepole_lp(rng.standard_normal(len(t)), cut)
    return s * shape**1.5


def riser(d):
    t = tt(d)
    x = t / d
    s = onepole_lp(rng.standard_normal(len(t)), 400 + 7000 * x**2)
    return s * x**2


def pop(m):
    """과일 등장 '뽁' 소리"""
    t = tt(0.09)
    f = midi(m) * (1 + 0.6 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)


def chime(m):
    t = tt(1.0)
    f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
    return s * np.exp(-t * 4) * np.minimum(1, t * 800)


# ---------------- SCENE 1 : 질문 (0 ~ 2.8초) ----------------
for b in range(7):
    place(tick(), b * BEAT, 0.25, 0.3)
place(pad([57, 60, 64], 1.6), 0.0, 0.10)  # Am
place(pad([55, 59, 62, 65], 1.3), 1.6, 0.11)  # G7 - 해결되지 않은 궁금한 느낌
question = [(0.0, 76), (0.2, 72), (0.4, 69), (0.8, 71), (1.0, 72), (1.2, 74), (1.6, 71), (2.0, 74), (2.2, 77)]
for t0, m in question:
    place(pluck(m), t0, 0.28, -0.2)
place(riser(1.2), GROOVE - 1.2, 0.35)
for k in range(8):  # 점점 빨라지는 스네어 롤
    t0 = 2.2 + 0.6 * (1 - (1 - k / 8) ** 1.6)
    place(clap(), t0, 0.12 + 0.04 * k)

# ---------------- SCENE 2~5 : 본 음악 (2.8 ~ 15초) ----------------
# 마디(1.6초)별 코드: C  G  Am  F  C  G  F/G  C
CHORDS = [
    ([60, 64, 67], 36),
    ([59, 62, 67], 43),
    ([57, 60, 64], 45),
    ([57, 60, 65], 41),
    ([60, 64, 67], 36),
    ([59, 62, 67], 43),
    ([57, 60, 65], 41),
    ([60, 64, 67, 72], 36),
]
MELODY = [
    [72, 76, 79, 76, 84, None, 79, None],
    [79, 83, 86, 83, 81, None, 79, None],
    [76, 72, 69, 72, 76, 79, 77, 76],
    [77, None, 77, 76, 74, 72, 74, None],
    [72, 76, 79, 84, 83, 79, 76, 79],
    [79, None, 81, 83, 86, 83, 79, None],
    [81, 77, 72, 77, 79, 83, 86, 89],
    [84, None, None, None, None, None, None, None],
]
BAR = BEAT * 4
place(crash(2.0), GROOVE, 0.30)
for bar, ((chord, root), mel) in enumerate(zip(CHORDS, MELODY)):
    t_bar = GROOVE + bar * BAR
    last = bar == len(CHORDS) - 1
    if last:
        # 마지막 마디: 한 번 '짠!' 하고 길게 울림
        place(kick(), t_bar, 0.9)
        place(crash(1.2), t_bar, 0.22)
        place(bass(root, 1.0), t_bar, 0.5)
        place(pad(chord, 1.0), t_bar, 0.16)
        for i, m in enumerate(chord):
            place(marimba(m + 12, 1.0), t_bar + i * 0.03, 0.22, -0.3 + 0.2 * i)
        break
    if bar == 6:  # F → G 로 반 마디씩
        place(pad([57, 60, 65], BAR / 2), t_bar, 0.10)
        place(pad([59, 62, 67], BAR / 2), t_bar + BAR / 2, 0.10)
    else:
        place(pad(chord, BAR), t_bar, 0.10)
    for b in range(4):
        tb = t_bar + b * BEAT
        place(kick(), tb, 0.85)
        if b in (1, 3):
            place(clap(), tb, 0.32, 0.1)
        place(hat(), tb + BEAT / 2, 0.18, 0.4)
        place(hat(0.03), tb, 0.08, 0.4)
        r = root if not (bar == 6 and b >= 2) else 43
        place(bass(r, 0.18), tb, 0.45)
        place(bass(r + 12, 0.15), tb + BEAT / 2, 0.30)
        # 반박마다 코드 스탭 (통통 튀는 느낌)
        cst = chord if not (bar == 6 and b >= 2) else [59, 62, 67]
        for m in cst:
            place(pluck(m, 0.15), tb + BEAT / 2, 0.07, 0.3)
    for s, m in enumerate(mel):
        if m is not None:
            place(marimba(m), t_bar + s * BEAT / 2, 0.30, -0.25)

# ---------------- 효과음 ----------------
for t0 in (2.45, 5.25, 9.65):  # 장면 전환 와이프
    place(whoosh(0.7), t0, 0.35)
for i in range(20):  # 과일 20종 등장
    place(pop(72 + (i % 5) * 2 + (i // 5) * 3), 10.35 + i * 0.045, 0.16, -0.6 + (i % 5) * 0.3)
place(chime(96), 3.85, 0.10, 0.4)  # 도장
place(chime(91), 13.7, 0.12, -0.3)  # 카카오 버튼
place(chime(96), 13.78, 0.09, 0.3)

# ---------------- 마스터 ----------------
mix = np.stack([L, R], axis=1)
fade_in = int(0.03 * SR)
fade_out = int(0.6 * SR)
mix[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
mix[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None] ** 1.5
mix = np.tanh(mix * 0.9)
mix /= np.max(np.abs(mix)) / 0.89

out = os.path.join(os.path.dirname(__file__), "..", "assets", "audio", "bgm.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("saved", os.path.abspath(out))
