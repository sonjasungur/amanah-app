"""Runde 2 – Szenenhilfen für die Laternenbilder: Tiefenunschärfe, Lichtdunst (volumetrisch), Umgebung."""
import numpy as np
from scipy.ndimage import gaussian_filter, zoom

from _r2_basis import F32, Cam, lin


def dof(img, coc, levels=(0, 1.0, 2.0, 3.5, 6.0, 10.0, 16.0)):
    """Tiefenunschärfe: Mischung vorgefilterter Ebenen nach Zerstreuungskreis (sigma in px)."""
    lv = np.asarray(levels, F32)
    s = np.clip(coc, 0, lv[-1] - 1e-3)
    i = np.searchsorted(lv, s, side="right") - 1
    t = (s - lv[i]) / (lv[i + 1] - lv[i])
    out = np.zeros_like(img)
    for k in range(len(lv) - 1):
        m = i == k
        if not m.any():
            continue
        b0 = img if lv[k] == 0 else gaussian_filter(img, (lv[k], lv[k], 0))
        b1 = gaussian_filter(img, (lv[k + 1], lv[k + 1], 0))
        out += (m * (1 - t))[..., None] * b0 + (m * t)[..., None] * b1
    return out


def coc_map(depth, focus, k):
    return k * np.abs(1 - focus / np.maximum(depth, 1e-3))


def volumetric(cam, lanterns, tsurf_fn, sigma=0.03, n=56, down=2, tmin=0.25, g=0.35, rng=None, hg=True, blur=1.0, tmin_fn=None):
    """Gestreutes Laternenlicht im Raum (Lichtstrahlen durch die Löcher). Rückgabe: lineares RGB voller Größe."""
    rng = rng or np.random.default_rng(3)
    ch = Cam(cam.c, f=cam.f / down, w=cam.w // down, h=cam.h // down)
    ch.fwd, ch.right, ch.up = cam.fwd, cam.right, cam.up
    D = ch.rays()
    tmax = tsurf_fn(np.broadcast_to(cam.c, D.shape), D)
    if tmin_fn is not None:
        tmin = np.minimum(tmin_fn(np.broadcast_to(cam.c, D.shape), D), tmax)
    acc = np.zeros(D.shape[:2] + (3,), F32)
    jit = rng.uniform(0, 1, D.shape[:2]).astype(F32)
    for i in range(n):
        u = (i + jit) / n
        t = tmin + (tmax - tmin) * u
        dt = (tmax - tmin) / n
        Q = cam.c + D * t[..., None]
        for L in lanterns:
            T, dist = L.transmit(Q, extra_w=0.002)
            v = (Q - L.L) / dist[..., None]
            ct = -(v * D).sum(-1)
            phase = (1 - g * g) / (1 + g * g - 2 * g * ct) ** 1.5 if hg else 1.0
            e = L.I * (T + 0.02) * phase / np.maximum(dist, 0.10) ** 2
            if L.fall:
                e = e * np.exp(-(dist / L.fall) ** 2)
            acc += (e * dt * sigma)[..., None] * L.col
    acc = gaussian_filter(acc, (blur, blur, 0))
    return zoom(acc, (cam.h / acc.shape[0], cam.w / acc.shape[1], 1), order=1).astype(F32)


def env_factory(warm=(1.0, 0.60, 0.24), night="#142048", key_dir=(-0.55, 0.55, -0.62), key=1.6, key_col=(1.0, 0.86, 0.66),
                floor=1.2, back=0.5, night_k=0.5, key_w=0.30, spec=None):
    warm = np.asarray(warm, F32)
    kd = np.asarray(key_dir, F32)
    kd /= np.linalg.norm(kd)
    kc = np.asarray(key_col, F32)
    nb = lin(night)

    def env(R, n, P):
        R = R / np.linalg.norm(R, axis=-1, keepdims=True)
        out = nb * night_k * (0.6 + 0.4 * np.clip(R[..., 1:2], 0, 1)) * 4
        out = out + warm * floor * np.clip(-R[..., 1:2], 0, 1) ** 1.3
        out = out + warm * back * np.clip(R[..., 2:3], 0, 1) ** 1.6
        ang = np.arccos(np.clip((R * kd).sum(-1, keepdims=True), -1, 1))
        out = out + kc * key * np.exp(-(ang / key_w) ** 2)
        for sd, sk, sw in (spec or ()):
            sd = np.asarray(sd, F32) / np.linalg.norm(sd)
            a2 = np.arccos(np.clip((R * sd).sum(-1, keepdims=True), -1, 1))
            out = out + kc * sk * np.exp(-(a2 / sw) ** 2)
        return out.astype(F32)

    return env


def composite(img, rgb, a, box):
    y0, y1, x0, x1 = box
    img[y0:y1, x0:x1] = img[y0:y1, x0:x1] * (1 - a[..., None]) + rgb * a[..., None]


def reflect_patch(img, rgb, a, box, base_y, k=0.12, blur=3.0, fade=120.0, max_y=None):
    """Weiche Spiegelung der Laterne auf poliertem Boden (Bildraum, an der Standlinie gespiegelt)."""
    y0, y1, x0, x1 = box
    rgbm = (rgb * a[..., None])[::-1]
    am = a[::-1]
    by = int(round(base_y))
    top = by
    hgt = min(img.shape[0] - top, rgbm.shape[0] - max(0, y1 - by))
    if max_y is not None:
        hgt = min(hgt, int(max_y) - top)
    src_off = max(0, y1 - by)
    if hgt <= 0:
        return
    part = rgbm[src_off:src_off + hgt]
    part = gaussian_filter(part, (blur, blur, 0))
    yy = np.arange(hgt, dtype=F32)[:, None, None]
    img[top:top + hgt, x0:x1] += part * k * np.exp(-yy / fade)
