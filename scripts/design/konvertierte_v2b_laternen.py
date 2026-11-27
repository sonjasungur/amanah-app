"""Konvertierte v2b – Nicht allein: Eine fein durchbrochene Messinglaterne steht nah und scharf auf einer
nächtlichen Steinterrasse. Weitere gleiche Laternen stehen in wachsender Entfernung, unscharf, jede mit ihrem
eigenen Lichtornament auf dem Boden; dahinter weiche Lichter in der Ferne (Gemeinschaft). Eigene,
programmatische Gestaltung."""
import os
import sys

import numpy as np
from scipy.ndimage import gaussian_filter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _r2_basis import F32, W, H, Cam, lin, fbm_tex, sample_wrap, bloom, finish, here, smoothstep  # noqa: E402
from _r2_laterne import Lantern, bokeh  # noqa: E402
from _r2_szene import dof, coc_map, volumetric, env_factory, composite, reflect_patch  # noqa: E402

rng = np.random.default_rng(2202)
ZE = 9.0                       # Kante der Terrasse
FOCUS = 1.30
KCOC = 7.0
near = Lantern((-0.26, 0, 0), intensity=0.34, rot=0.10, light_size=0.003, vis=0.85, fall=0.62)
others = [Lantern(p, intensity=0.34, rot=r, light_size=0.003, vis=0.85, fall=0.62)
          for p, r in (((0.55, 0, 1.1), 0.3), ((-1.6, 0, 2.8), 0.5), ((1.45, 0, 2.9), 0.2),
                       ((0.25, 0, 4.6), 0.7), ((2.6, 0, 6.0), 0.4), ((-0.6, 0, 7.5), 0.1), ((1.2, 0, 8.5), 0.6))]
lans = [near] + others
c = np.array([0.05, 0.40, -1.25], F32)
tgt = np.array([0.05, 0.30, 1.0], F32)
pitch = np.arctan2(c[1] - tgt[1], tgt[2] - c[2])
cam = Cam(c, pitch=pitch, f=1350)

D = cam.rays()
tf = np.where(D[..., 1] < -1e-4, -c[1] / np.minimum(D[..., 1], -1e-4), 1e9).astype(F32)
P = c + D * tf[..., None]
onfloor = (tf < 1e8) & (P[..., 2] < ZE)
N = np.broadcast_to(np.array([0, 1, 0], F32), P.shape)

# ---------------------------------------------------------------- Hintergrund: Nachthimmel, ferne Lichter
Y, X = np.mgrid[0:H, 0:W].astype(F32)
hor_y = cam.project(np.array([0, c[1], 400], F32))[1]
edge_y = cam.project(np.array([0, 0, ZE], F32))[1]
sky = lin("#0B1226") * 0.9
t_ = np.clip((Y - 0) / max(hor_y, 1), 0, 1)[..., None]
bg = lin("#0B1226") * (1 - t_) + lin("#22306A") * t_
bg = bg + lin("#B98A55") * 0.10 * np.exp(-((Y - hor_y) / 60) ** 2)[..., None] * np.exp(-((X - 900) / 700) ** 2)[..., None]
below = Y > hor_y
bg = np.where(below[..., None], lin("#121A3E") * 1.0 + lin("#B98A55") * 0.05 * np.exp(-(Y - hor_y) / 40)[..., None], bg)
bg = gaussian_filter(bg, (2, 2, 0))
# ferne Lichter (Gemeinschaft) als weiche Unschärfescheiben
for i in range(70):
    x = rng.uniform(-50, W + 50)
    y = hor_y + rng.uniform(-6, 40) * (0.4 + 0.6 * rng.random())
    r = rng.uniform(7, 22)
    warm = rng.random() < 0.8
    col = lin("#F2C27A") if warm else lin("#C9D2F0")
    bokeh(bg, x, y, r, col, k=rng.uniform(0.04, 0.16) * (1.3 if r < 12 else 1.0), rim=0.3, soft=1.4)
for i in range(16):        # wenige größere, nähere Lichter
    x = rng.uniform(0, W)
    y = hor_y + rng.uniform(-30, 10)
    bokeh(bg, x, y, rng.uniform(24, 40), lin("#F2C27A"), k=rng.uniform(0.025, 0.06), rim=0.35, soft=2.0)

# ---------------------------------------------------------------- Boden
tex = fbm_tex(rng, 512)
tex2 = fbm_tex(rng, 512, ((60, 1.0), (20, 0.6), (6, 0.3)))
u, v = P[..., 0] * 380, P[..., 2] * 380
n1 = sample_wrap(tex, u, v)
n2 = sample_wrap(tex2, u * 0.3, v * 0.3)
alb = lin("#6E665C") * (1 + 0.08 * n1 + 0.12 * n2)[..., None]
E = np.zeros(P.shape[:2], F32)
for L in lans:
    E += L.irradiance(np.where(onfloor[..., None], P, 0), N)
amb = lin("#1F3C88") * 0.65
ao = np.ones(P.shape[:2], F32)
for L in lans:
    rho = np.sqrt((P[..., 0] - L.base[0]) ** 2 + (P[..., 2] - L.base[2]) ** 2)
    ao *= 1 - 0.55 * np.exp(-np.clip(rho - 0.072, 0, None) / 0.035)
flo = alb * (E[..., None] * near.col + amb * ao[..., None])
# Terrassenkante: weich in die Tiefe auslaufen
zf = np.clip(P[..., 2], 0, ZE)
fogk = (1 - np.exp(-np.clip(P[..., 2], 0, None) / 7.0))[..., None]
flo = flo * (1 - fogk * 0.6) + lin("#16204A") * fogk * 0.25
img = np.where(onfloor[..., None], flo, bg).astype(F32)
depth = np.where(onfloor, tf * (D * cam.fwd).sum(-1), 300.0).astype(F32)
img = dof(img, coc_map(depth, FOCUS, KCOC), levels=(0, 1.0, 2.0, 3.5, 6.0, 9.0, 13.0))


def tsurf(O, Dd):
    tf_ = np.where(Dd[..., 1] < -1e-4, -O[..., 1] / np.minimum(Dd[..., 1], -1e-4), 30.0)
    return np.minimum(tf_, 30.0).astype(F32)


img += volumetric(cam, lans, tsurf, sigma=0.05, n=110, rng=rng, blur=2.2)

# ---------------------------------------------------------------- Laternen von hinten nach vorn
env = env_factory(floor=0.25, back=0.30, key=2.0, key_w=0.45, night_k=0.35,
                  spec=[((-0.75, 0.25, -0.62), 6.0, 0.10), ((-0.3, 0.9, -0.3), 1.5, 0.25)])
order = sorted(lans, key=lambda L: -L.base[2])
for L in order:
    rgb, a, box, dd = L.render(cam, env, ss=3 if L is near else 2, pad=40)
    zc = cam.project(L.L)[2]
    sig = float(coc_map(np.array(zc), FOCUS, KCOC))
    base_y = cam.project(L.base + np.array([0, 0, -0.06], F32))[1]
    if sig > 0.6:
        pm = gaussian_filter(rgb * a[..., None], (sig, sig, 0))
        a = gaussian_filter(a, sig)
        rgb = pm / np.maximum(a, 1e-4)[..., None]
    reflect_patch(img, rgb, a, box, base_y, k=0.06, blur=2.5 + sig, fade=50 * (1.3 / zc))
    composite(img, rgb, a, box)

img += bloom(img, thresh=1.2)
finish(img, sys.argv[1] if len(sys.argv) > 1 else here("konvertierte-v2b.jpg"), exposure=1.0, rng=rng)
