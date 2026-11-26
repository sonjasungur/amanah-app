"""Sadaqa Jariya: Wasserfläche, auf der sich von einem Tropfen goldene Ringe ausbreiten (eigene Gestaltung)."""
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

W, H = 1600, 1200
rng = np.random.default_rng(7)
Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
cx, cy = 800, 640
dx = X - cx
dy = (Y - cy) * 1.9
r = np.sqrt(dx * dx + dy * dy) + 1e-3

h = np.zeros_like(r)
for k, ph, amp in ((0.032, 0.0, 1.0),):
    h += amp * np.sin(k * r - ph) * np.exp(-r / 230) * np.clip(r / 50, 0, 1)
h += 0.10 * gaussian_filter(rng.normal(0, 1, (H, W)).astype(np.float32), (2, 8))
gx = np.gradient(h, axis=1)
gy = np.gradient(h, axis=0)
nx, ny, nz = -gx * 18, -gy * 18, np.ones_like(h)
n = np.sqrt(nx * nx + ny * ny + nz * nz)
nx, ny, nz = nx / n, ny / n, nz / n
L = np.array([0.0, -0.55, 0.83]); L /= np.linalg.norm(L)
V = np.array([0.0, 0.35, 0.94]); V /= np.linalg.norm(V)
Hh = L + V; Hh /= np.linalg.norm(Hh)
spec = np.clip(nx * Hh[0] + ny * Hh[1] + nz * Hh[2], 0, 1) ** 140
diff = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1)

t = Y / H
base = np.stack([0.03 + 0.05 * (1 - t), 0.05 + 0.07 * (1 - t), 0.12 + 0.14 * (1 - t)], -1)
img = base * (0.6 + 0.6 * diff[..., None])
gold = np.array([1.0, 0.80, 0.40])
glow = np.exp(-((dx / 420) ** 2 + (dy / 420) ** 2))
img += spec[..., None] * gold * (0.05 + 1.1 * glow[..., None])
img += np.exp(-((dx / 260) ** 2 + (dy / 260) ** 2))[..., None] * gold * 0.35
img += np.exp(-((dx / 14) ** 2 + ((Y - cy + 6) / 16) ** 2))[..., None] * np.array([1.0, 0.92, 0.7]) * 0.9
img += np.exp(-((Y - 0) / 260) ** 2)[..., None] * np.array([0.10, 0.12, 0.22])
d = ((X - W / 2) / (W / 2)) ** 2 + ((Y - H / 2) / (H / 2)) ** 2
img *= (1 - 0.45 * np.clip(d / 1.6, 0, 1) ** 1.3)[..., None]
img += rng.normal(0, 0.01, (H, W, 1)).astype(np.float32)
img = np.clip(img, 0, 1)
k = 0.82
hi = img > k
img[hi] = k + (1 - k) * (1 - np.exp(-(img[hi] - k) / (1 - k)))
Image.fromarray((img * 255).astype(np.uint8)).save(sys.argv[1], quality=88, optimize=True, progressive=True)
print("ok")
