"""Janazah v4a – Weg ins Licht: Ein schmaler, heller Feldweg schwingt sanft durch eine weite, ruhige Wiesenlandschaft
auf das warme Licht am Horizont zu. Weicher Dunst liegt in den Senken, wenige Zypressen säumen in großem Abstand den
Weg (Verbindung zu v2), im Vordergrund feine, gegenlichtige Gräser. Ruhig und tröstlich, ohne Grab- oder
Todessymbole. Eigene, programmatische Gestaltung."""
import os
import sys

import numpy as np
from scipy.ndimage import gaussian_filter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _r2_basis import F32, W, H, Cam, lin, smoothstep, bloom, finish, here, downsample  # noqa: E402
from _r2_land import (Noise2, Sky, sun_dir, terrain_render, normals, fog_apply, cypress, norm,  # noqa: E402
                      grass_blades, cypress_shadow, grass_texture)
from _r2_szene import dof, coc_map  # noqa: E402

rng = np.random.default_rng(2401)
SUN = sun_dir(4, 1.8)
cam = Cam((0.0, 1.35, 0.0), pitch=np.radians(0.4), yaw=np.radians(0), f=1450)
nA, nB, nC = Noise2(rng, 512, 10), Noise2(rng, 512, 6), Noise2(rng, 512, 3)
FOGC, FOGW, DENS = "#3E4C86", "#F2C07C", 0.0042
SUNXY = cam.project(cam.c + SUN * 1000)[:2]
PW = 0.75                                    # halbe Wegbreite


def path_x(z):
    z = np.asarray(z, F32)
    k = smoothstep(2, 30, z)
    return (1.6 * np.sin(z / 16 + 0.4) * k + 0.9 * np.sin(z / 41 + 1.3) * k + np.tan(np.radians(4)) * z * 0.97).astype(F32)


def height(x, z):
    z = np.asarray(z, F32)
    x = np.asarray(x, F32)
    h = 1.2 * nA(x, z, 900) + 0.25 * nB(x, z, 260) + 0.02 * z * smoothstep(0, 80, z)
    # sanfte Wellen quer zum Blick
    h += 1.4 * np.sin(z / 37 + 0.6) * smoothstep(20, 80, z) * (0.6 + 0.4 * np.cos(x / 50))
    h += smoothstep(150, 450, z) * (5.0 * nA(x + 300, z, 3000) + 2.0)
    h += smoothstep(500, 1500, z) * (18 * np.clip(nA(x * 0.6 + 900, z * 0.3, 2600) + 0.6, 0, None) + 5)
    # Weg leicht eingetieft
    d = np.abs(x - path_x(z))
    h -= 0.06 * (1 - smoothstep(PW * 0.6, PW * 1.6, d))
    return h.astype(F32)


SS = 2
P, depth, hit = terrain_render(cam, height, ss=SS, zmin=1.0, zmax=4500, nsteps=2600)
h2, w2 = depth.shape
Yg, Xg = np.mgrid[0:h2, 0:w2].astype(F32)
dx = (Xg + 0.5) / SS - W / 2
dy = -((Yg + 0.5) / SS - H / 2)
D = cam.right * dx[..., None] + cam.up * dy[..., None] + cam.fwd * cam.f
D /= np.linalg.norm(D, axis=-1, keepdims=True)
del Xg, Yg, dx, dy

sky = Sky(SUN, zenith="#0B1226", mid="#1B3070", horizon="#4E76A6", warm="#F2C870", glow=1.7, rng=rng, clouds=0.22,
          sun_disc=0.9, broad=0.12, band_e=0.07)
img = sky(D)

N = normals(height, P[..., 0], P[..., 2])
dist = np.linalg.norm(P - cam.c, axis=-1)
fp = dist / cam.f / SS * 2
g1 = nC(P[..., 0] * 3, P[..., 2] * 0.6, 2.5) * (1 - smoothstep(0.002, 0.008, fp))
g2 = nB(P[..., 0], P[..., 2], 18.0) * (1 - smoothstep(0.02, 0.09, fp))
g3 = nA(P[..., 0], P[..., 2], 240.0)
alb = lin("#3E4A34") * np.clip(1 + 0.08 * g1 + 0.06 * g2 + 0.10 * g3, 0.6, 1.4)[..., None]
# Weg: Breite mit leicht unregelmäßigem Grasrand, kantengeglättet über die Pixelgröße
pd = np.abs(P[..., 0] - path_x(P[..., 2])) - PW * (1 + 0.05 * nA(P[..., 0], P[..., 2], 40.0))
pm = np.clip(0.5 - pd / np.maximum(fp * 1.2, 1e-4), 0, 1) * hit
ptex = 1 + 0.10 * nC(P[..., 0] * 2, P[..., 2] * 2, 1.5) * (1 - smoothstep(0.002, 0.006, fp)) + 0.06 * g2
alb = alb * (1 - pm[..., None]) + (lin("#6E675A") * ptex[..., None]) * pm[..., None]
V = -D
Rf = 2 * (N * SUN).sum(-1, keepdims=True) * N - SUN
spec = np.clip((Rf * V).sum(-1), 0, 1) ** 220 * 1.4 * (1 + 0.8 * pm)
lam = np.clip((N * SUN).sum(-1), 0, 1)
col = alb * (lin("#FFD39A") * 1.2 * (lam + 0.03)[..., None] + lin("#3A4C96") * 0.55 * (0.6 + 0.4 * N[..., 1:2]))
col += lin("#F6C27E") * (spec * np.clip(0.7 + 0.3 * g1, 0.3, 1.3))[..., None] * 0.12
# Wegrand: leichter Kontaktschatten
edge = np.clip(1 - np.abs(pd) / 0.12, 0, 1) * (pd > 0) * hit
col *= (1 - 0.25 * edge)[..., None]
col, _ = fog_apply(col, dist, D, SUN, density=DENS, fogcol=FOGC, warm=FOGW, warm_k=1.6, height=P[..., 1], hfall=60)
img = np.where(hit[..., None], col, img)
del N, g1, g2, g3, alb, lam, col, Rf, V, spec, ptex, edge
img = downsample(img, SS)
pmask = 1 - downsample(pm[..., None], SS)
zbuf = downsample(np.where(hit, dist, 1e6)[..., None], SS).astype(F32)
del P, D, depth

# Dunstbänder in den Senken
Y, X = np.mgrid[0:H, 0:W].astype(F32)
hor = cam.project(np.array([0, cam.c[1], 3000], F32))[1]
mn = gaussian_filter(rng.normal(0, 1, (H, W)).astype(F32), (5, 90))
mn /= mn.std() + 1e-6
for yo, s_, k_ in ((3, 16, 0.15), (22, 12, 0.07), (48, 10, 0.045), (85, 9, 0.025)):
    band = np.exp(-((Y - hor - yo) / s_) ** 2) * np.clip(0.65 + 0.4 * mn, 0, 1.6)
    img += band[..., None] * (lin("#7F93C0") * 0.40 + lin(FOGW) * 1.3 * np.exp(-((X - SUNXY[0]) / 520) ** 2)[..., None]) * k_

CUR = {"warm": 0.0}


def fog_obj(c, d):
    f = 1 - np.exp(-d * DENS)
    return c * (1 - f) + (lin(FOGC) + lin(FOGW) * (0.14 + 1.2 * CUR["warm"])) * f


objs = []
for z, side in ((44, 1), (50, 1), (78, -1), (112, 1), (118, 1), (160, -1), (215, 1), (222, 1)):
    x = float(path_x(np.array([z]))[0]) + side * (2.6 + 0.02 * z)
    objs.append((np.array([x, float(height(np.array([x]), np.array([z]))[0]) - 0.1, z], F32),
                 rng.uniform(9.5, 12.5), rng.uniform(1.4, 1.8)))
for _ in range(0):
    z = rng.uniform(220, 420)
    x = rng.uniform(-0.5, 0.6) * z
    if abs(x - float(path_x(np.array([z]))[0])) < 20:
        continue
    objs.append((np.array([x, float(height(np.array([x]), np.array([z]))[0]) - 0.1, z], F32),
                 rng.uniform(10, 14), rng.uniform(1.5, 2.0)))
objs.sort(key=lambda o: -np.linalg.norm(o[0] - cam.c))
for b, hh, ww in objs:
    cypress_shadow(img, cam, b, hh, ww, SUN, k=0.30, blur=2.5)
for b, hh, ww in objs:
    dvec = norm(b + np.array([0, 4, 0], F32) - cam.c)
    CUR["warm"] = float(np.clip((dvec * SUN).sum(), 0, 1) ** 300)
    cypress(img, zbuf, cam, b, hh, ww, SUN, rng, fog_obj, rim_k=0.10, amb_k=0.6)

grass_texture(img, zbuf, rng, near=2.0, far=32.0, k=0.15, warm_k=0.12, mask=pmask)
# grass_blades(img, rng, 2600, 1110, 1215, 18, 85, dark="#141A14", tip="#F4C46E", tip_k=0.55, blur=1.1, lean=0.25)
img = dof(img, coc_map(zbuf, 30.0, 1.2), levels=(0, 0.6, 1.2, 2.0))
img += bloom(img, levels=((4, 0.20), (16, 0.12), (50, 0.06)), thresh=1.5)
finish(img, sys.argv[1] if len(sys.argv) > 1 else here("janazah-v4a.jpg"), exposure=0.9, rng=rng, vign=0.35, depurple=0.7)
