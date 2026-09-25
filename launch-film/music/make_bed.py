"""Original music bed for the Panels launch film. Synthesized, so it is
license-free. 112 BPM, F major, soft and bright: pad, sub, kick, hats,
pluck arpeggio. Writes bed.wav (48 kHz stereo)."""
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
BPM = 112
BEAT = 60 / BPM
BAR = BEAT * 4
BARS = 20
N = int(BAR * BARS * SR) + SR * 3
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(7)


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def place(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    j = min(N, i + len(sig))
    if i >= N:
        return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt(0.5 * (1 - pan))
    R[i:j] += s * np.sqrt(0.5 * (1 + pan))


def env(n, a, d, s, r, hold):
    """ADSR over n samples; times in seconds."""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    e = np.where((t >= a + d) & (t < hold), s, e)
    e = np.where(t >= hold, s * np.exp(-(t - hold) / max(r, 1e-4)), e)
    return e


def lowpass(x, f, order=2):
    return sosfilt(butter(order, f / (SR / 2), output="sos"), x)


def highpass(x, f, order=2):
    return sosfilt(butter(order, f / (SR / 2), btype="high", output="sos"), x)


def saw(f, n, detune=0.0):
    t = np.arange(n) / SR
    ph = (t * f * (1 + detune)) % 1.0
    return 2 * ph - 1


# Fmaj9 - Am7 - Dm9 - Bbmaj7(#11), two bars each in the groove.
CHORDS = [
    [53, 60, 64, 67, 69],
    [57, 60, 64, 67, 72],
    [50, 57, 60, 64, 65],
    [46, 57, 62, 65, 69],
]
ROOTS = [41, 45, 38, 46]


def chord_at(bar):
    return bar // 2 % 4


# Pad: detuned saws, soft attack, warm filter.
for b in range(0, BARS, 2):
    c = CHORDS[chord_at(b)]
    dur = BAR * 2
    n = int((dur + 1.5) * SR)
    sig = np.zeros(n)
    for note in c:
        for d in (-0.004, 0.0, 0.005):
            sig += saw(midi(note), n, d)
    sig = lowpass(sig, 1400 if b >= 2 else 900, 2)
    sig *= env(n, 0.6, 0.4, 0.8, 0.9, dur)
    place(sig, b * BAR, -0.25, 0.028)
    place(np.roll(sig, int(0.013 * SR)), b * BAR, 0.25, 0.028)

GROOVE = 2  # bars of pad-only intro

# Sub bass: root on 8ths, ducked like a sidechain.
for b in range(GROOVE, BARS):
    root = ROOTS[chord_at(b)]
    for k in range(8):
        n = int(BEAT / 2 * SR)
        t = np.arange(n) / SR
        f = midi(root)
        sig = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
        sig *= env(n, 0.005, 0.08, 0.7, 0.05, BEAT / 2 - 0.05)
        sig *= 0.55 if k % 2 == 0 else 0.85
        place(sig, b * BAR + k * BEAT / 2, 0, 0.16)

# Kick on every beat.
for b in range(GROOVE, BARS):
    for k in range(4):
        n = int(0.35 * SR)
        t = np.arange(n) / SR
        f = 48 + 90 * np.exp(-t * 28)
        sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
        sig += 0.3 * rng.standard_normal(n) * np.exp(-t * 200)
        place(sig, b * BAR + k * BEAT, 0, 0.30)

# Hats on the offbeats, a quieter 16th ghost after bar 6.
for b in range(GROOVE, BARS):
    for k in range(8):
        n = int(0.09 * SR)
        t = np.arange(n) / SR
        sig = highpass(rng.standard_normal(n), 7000, 2) * np.exp(-t * 55)
        if k % 2 == 1:
            place(sig, b * BAR + k * BEAT / 2, 0.3, 0.10)
        elif b >= 6:
            place(sig * 0.5, b * BAR + k * BEAT / 2 + BEAT / 4, -0.3, 0.05)

# Soft clap on 2 and 4 from bar 6.
for b in range(6, BARS):
    for k in (1, 3):
        n = int(0.25 * SR)
        t = np.arange(n) / SR
        sig = lowpass(highpass(rng.standard_normal(n), 900), 5000) * np.exp(-t * 22)
        place(sig, b * BAR + k * BEAT, 0, 0.11)

# Pluck arpeggio: chord tones up an octave on 16ths, from bar 4.
PATTERN = [0, 2, 4, 1, 3, 4, 2, 1]
for b in range(4, BARS):
    c = CHORDS[chord_at(b)]
    for k in range(16):
        note = c[1:][PATTERN[k % 8] % 4] + 12
        n = int(0.5 * SR)
        t = np.arange(n) / SR
        f = midi(note)
        sig = (2 / np.pi) * np.arcsin(np.sin(2 * np.pi * f * t))
        sig += 0.3 * np.sin(4 * np.pi * f * t)
        sig *= np.exp(-t * 11)
        sig = lowpass(sig, 4200, 2)
        pan = 0.35 if k % 2 else -0.35
        place(sig, b * BAR + k * BEAT / 4, pan, 0.06 * (1.0 if k % 4 == 0 else 0.7))
        # Dotted-eighth echo.
        place(sig * 0.35, b * BAR + k * BEAT / 4 + BEAT * 0.75, -pan, 0.06)

# Final bar: let it ring on the tonic.
end = BARS * BAR
n = int(3 * SR)
sig = np.zeros(n)
for note in CHORDS[0]:
    sig += saw(midi(note), n, 0.003)
sig = lowpass(sig, 1600) * env(n, 0.01, 0.3, 0.5, 1.2, 0.4)
place(sig, end - 0.001, 0, 0.02)

mix = np.stack([L, R], axis=1)
mix = highpass(mix.T, 28).T
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.3) / np.tanh(1.3) * 0.84
wavfile.write("bed.wav", SR, (mix * 32767).astype(np.int16))
print(f"bed.wav {len(mix) / SR:.1f}s, bar {BAR:.3f}s, groove starts {GROOVE * BAR:.3f}s")
