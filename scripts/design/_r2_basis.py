"""Runde 2 – gemeinsame Hilfen: lineares Licht, Tonemapping, Bloom, Rauschen, Kamera.
Vollständig programmatisch (numpy, PIL, scipy). Keine fremden Vorlagen."""
import os

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates, zoom

W, H = 1600, 1200
F32 = np.float32


def hx(h):
    return np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)], F32)


def lin(h):
    """sRGB-Hex -> lineares RGB."""
    c = hx(h) if isinstance(h, str) else np.asarray(h, F32)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(F32)


def to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055).astype(F32)


def aces(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def bloom(img, levels=((3, 0.35), (10, 0.30), (30, 0.25), (80, 0.18)), thresh=0.9):
    """Weicher Lichtschein heller Stellen (lineares Licht)."""
    lum = img.mean(-1, keepdims=True)
    hi = img * np.clip((lum - thresh) / (lum + 1e-4), 0, None)
    out = np.zeros_like(img)
    for s, k in levels:
        small = max(1, int(s / 4))
        if small > 1:
            src = zoom(hi, (1 / small, 1 / small, 1), order=1)
            b = gaussian_filter(src, (s / small, s / small, 0))
            b = zoom(b, (hi.shape[0] / b.shape[0], hi.shape[1] / b.shape[1], 1), order=1)
        else:
            b = gaussian_filter(hi, (s, s, 0))
        out += b * k
    return out


def finish(lin_img, path, exposure=1.0, rng=None, grain=0.006, vign=0.30, lift="#0B1226", lift_k=0.55, depurple=0.0):
    """Lineares Bild -> Tonemapping -> sRGB, leichte Vignette, Schatten Richtung Nachtblau, Korn, JPEG q88 progressiv."""
    h, w = lin_img.shape[:2]
    x = aces(lin_img * exposure)
    s = to_srgb(x)
    if depurple:
        # Violettstich in kühlen Bereichen Richtung Nachtblau schieben (Rot-Überschuss über Grün abbauen)
        r, g, b = s[..., 0], s[..., 1], s[..., 2]
        cool = smoothstep(0.0, 0.06, b - g)
        s[..., 0] = r - depurple * cool * np.clip(r - g, 0, None)
    # Schatten sanft zum Nachtblau anheben (Royal Imperial), nur in den Tiefen
    L = s.mean(-1, keepdims=True)
    k = (1 - smoothstep(0.0, 0.22, L)) * lift_k
    s = s * (1 - k) + np.maximum(s, hx(lift)) * k
    Y, X = np.mgrid[0:h, 0:w].astype(F32)
    d = ((X - w / 2) / (w / 2)) ** 2 + ((Y - h / 2) / (h / 2)) ** 2
    s *= (1 - vign * np.clip(d / 2.0, 0, 1) ** 1.5)[..., None]
    rng = rng or np.random.default_rng(7)
    s += rng.normal(0, grain, (h, w)).astype(F32)[..., None]
    s += rng.uniform(-0.5 / 255, 0.5 / 255, s.shape).astype(F32)
    out = Image.fromarray((np.clip(s, 0, 1) * 255 + 0.5).astype(np.uint8))
    if out.size != (W, H):
        out = out.resize((W, H), Image.LANCZOS)
    out.save(path, quality=88, optimize=True, progressive=True)
    print("ok", path, out.size)


def downsample(img, ss):
    if ss == 1:
        return img
    h, w = img.shape[0] // ss, img.shape[1] // ss
    return img[:h * ss, :w * ss].reshape(h, ss, w, ss, -1).mean((1, 3)).squeeze()


def tile_noise(rng, n, sigma):
    """Kachelbares, normiertes Rauschen (n x n)."""
    a = gaussian_filter(rng.normal(0, 1, (n, n)).astype(F32), sigma, mode="wrap")
    return (a - a.mean()) / (a.std() + 1e-6)


def fbm_tex(rng, n=512, octaves=((24, 1.0), (10, 0.5), (4, 0.25), (1.5, 0.12))):
    t = np.zeros((n, n), F32)
    for s, k in octaves:
        t += k * tile_noise(rng, n, s)
    return t / np.sqrt(sum(k * k for _, k in octaves))


def sample_wrap(tex, u, v, blur=None):
    """Kachelbare Textur an (u, v) in Texeln abtasten (bilinear)."""
    return map_coordinates(tex, [v.ravel(), u.ravel()], order=1, mode="grid-wrap").reshape(u.shape).astype(F32)


class Cam:
    """Lochkamera: Position c, Neigung pitch (rad, positiv = nach unten), Gier yaw (rad, positiv = nach rechts)."""

    def __init__(self, c, pitch=0.0, yaw=0.0, f=1400.0, w=W, h=H):
        self.c = np.asarray(c, F32)
        self.f, self.w, self.h = f, w, h
        cp, sp, cy, sy = np.cos(pitch), np.sin(pitch), np.cos(yaw), np.sin(yaw)
        self.fwd = np.array([sy * cp, -sp, cy * cp], F32)
        self.right = np.array([cy, 0, -sy], F32)
        self.up = np.cross(self.fwd, self.right).astype(F32)
        self.up = -self.up if self.up[1] < 0 else self.up

    def rays(self, ss=1, rows=None):
        h, w = self.h * ss, self.w * ss
        r0, r1 = rows if rows else (0, h)
        Y, X = np.mgrid[r0:r1, 0:w].astype(F32)
        dx = (X + 0.5) / ss - self.w / 2
        dy = -((Y + 0.5) / ss - self.h / 2)
        d = (self.right[None, None] * dx[..., None] + self.up[None, None] * dy[..., None]
             + self.fwd[None, None] * self.f)
        return d / np.linalg.norm(d, axis=-1, keepdims=True)

    def project(self, p):
        p = np.asarray(p, F32)
        r = p - self.c
        xc, yc, zc = r @ self.right, r @ self.up, r @ self.fwd
        return self.w / 2 + self.f * xc / zc, self.h / 2 - self.f * yc / zc, zc


def here(name):
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), name)
