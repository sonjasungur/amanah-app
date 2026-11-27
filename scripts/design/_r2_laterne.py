"""Runde 2 – durchbrochene Messinglaterne (eigene, programmatische Konstruktion).

Rotationskörper aus Fuß, durchbrochenem Zylindermantel (versetzte Achtsterne, Spitzbogen-Arkade, Punktreihe),
Kuppel mit Lochreihen und Spitze. Das Licht im Inneren wird durch dieselbe Lochmaske nach außen projiziert
(Lichtornament auf Wand und Boden, mit physikalischer Halbschattenbreite). Keine Kreuzformen: nur versetzte
Sterne, Bögen und Punkte, keine durchgehenden senkrecht/waagrecht kreuzenden Stege."""
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, map_coordinates

from _r2_basis import F32, lin, smoothstep

RS = 0.100            # Radius Mantel (m)
NREP = 10             # Wiederholungen des Musters am Umfang
PX = 2 * np.pi * RS / NREP
HMAX = 0.52
TEX_E = 0.0002        # Texelgröße (m)
HL = 0.175            # Lichthöhe über dem Fuß

_PROF_H = np.linspace(0, HMAX, 2601).astype(F32)


def _profile(h):
    h = np.asarray(h, F32)
    pts = [(0.000, 0.070), (0.004, 0.075), (0.010, 0.075), (0.014, 0.079), (0.026, 0.090), (0.038, 0.102),
           (0.046, 0.108), (0.056, 0.108), (0.060, 0.104), (0.064, 0.101)]
    r = np.interp(h, [p[0] for p in pts], [p[1] for p in pts]).astype(F32)
    t = (h - 0.064) / (0.296 - 0.064)
    shell = 0.101 + 0.006 * np.sin(np.pi * np.clip(t, 0, 1))
    r = np.where((h >= 0.064) & (h < 0.296), shell, r)
    band = np.interp(h, [0.296, 0.300, 0.304, 0.316, 0.320, 0.324], [0.101, 0.104, 0.110, 0.110, 0.106, 0.103])
    r = np.where((h >= 0.296) & (h < 0.324), band, r)
    t = np.clip((h - 0.324) / (0.452 - 0.324), 0, 1)
    dome = 0.103 * (1 + 0.16 * np.sin(np.pi * np.minimum(t * 1.15, 1))) * (1 - t) ** 0.8
    dome = np.maximum(dome, 0.006 * (t > 0.9))
    r = np.where((h >= 0.324) & (h < 0.452), dome, r)
    fin = np.where(h < 0.462, 0.0055,
                   np.where(h < 0.486, np.sqrt(np.clip(0.0125 ** 2 - (h - 0.474) ** 2, 0, None)) + 0.002,
                            np.clip(0.0045 * (1 - (h - 0.486) / 0.03), 0, None)))
    r = np.where(h >= 0.452, fin, r)
    return np.where(h > 0.516, 0, r).astype(F32)


_PROF_R = _profile(_PROF_H)
from scipy.ndimage import gaussian_filter1d  # noqa: E402

_PROF_R = gaussian_filter1d(_PROF_R, 1.2).astype(F32)
_PROF_DR = np.gradient(_PROF_R, _PROF_H).astype(F32)


def prof_r(h):
    return np.interp(h, _PROF_H, _PROF_R, left=0, right=0).astype(F32)


def prof_dr(h):
    return np.interp(h, _PROF_H, _PROF_DR, left=0, right=0).astype(F32)


# --------------------------------------------------------------------------- Lochmuster (SDF)
def _star(cx, cy, ro, ri, n=8, rot=np.pi / 8):
    pts = []
    for i in range(2 * n):
        r = ro if i % 2 == 0 else ri
        a = rot + np.pi * i / n
        pts.append((cx + r * np.sin(a), cy + r * np.cos(a)))
    return pts


def _arch(cx, y0, y1, w, n=24):
    """Spitzbogen-Loch (y nach oben), Breite w, von y0 bis Scheitel y1."""
    a = w / 2
    ys = y1 - np.sqrt(3) * a
    pts = [(cx - a, y0), (cx - a, ys)]
    for i in range(n + 1):
        t = np.pi - (np.pi / 3) * i / n
        pts.append((cx + a + 2 * a * np.cos(t), ys + 2 * a * np.sin(t)))
    for i in range(1, n + 1):
        t = np.pi / 3 - (np.pi / 3) * i / n
        pts.append((cx - a + 2 * a * np.cos(t), ys + 2 * a * np.sin(t)))
    pts.append((cx + a, y0))
    return pts


def _build_tex():
    ss = 3
    tw, th = int(round(PX / TEX_E)), int(round(HMAX / TEX_E))
    im = Image.new("L", (3 * tw * ss, th * ss), 0)
    d = ImageDraw.Draw(im)

    def P(pts, ox):
        return [((x + ox) / TEX_E * ss, y / TEX_E * ss) for x, y in pts]

    for k in range(-1, 4):
        ox = k * PX
        # untere Arkade: 2 Spitzbögen pro Kachel
        for j in range(2):
            d.polygon(P(_arch(PX * (j + 0.5) / 2, 0.074, 0.100, 0.0115), ox + PX), fill=255)
        # versetzte Achtsterne
        for r in range(6):
            hy = 0.122 + r * 0.0275
            off = (r % 2) * PX / 2
            d.polygon(P(_star(off, hy, 0.0150, 0.0150 * 0.65), ox + PX), fill=255)
        # obere Punktreihe
        for j in range(3):
            x = PX * (j + 0.5) / 3
            rr = 0.0034
            d.ellipse(P([(x - rr, 0.2860 - rr), (x + rr, 0.2860 + rr)], ox + PX), fill=255)
        # Kuppel: Punktreihen, horizontal gestreckt (Textur in Mantel-Bogenmaß)
        for row, (hy, n, rr) in enumerate(((0.338, 2, 0.0042), (0.356, 2, 0.0038), (0.374, 1, 0.0034),
                                           (0.392, 1, 0.0030), (0.408, 1, 0.0025))):
            rad = float(prof_r(np.array([hy]))[0])
            sx = RS / max(rad, 1e-3)
            for j in range(n):
                x = PX * (j + 0.5 * (row % 2)) / n
                d.ellipse(P([(x - rr * sx, hy - rr), (x + rr * sx, hy + rr)], ox + PX), fill=255)
    im = im.resize((3 * tw, th), Image.LANCZOS)
    m = np.asarray(im, F32) / 255 > 0.5
    inside = distance_transform_edt(m)
    outside = distance_transform_edt(~m)
    sd = (inside - outside) * TEX_E
    return sd[:, tw:2 * tw].astype(F32)


_TEX = None


def tex():
    global _TEX
    if _TEX is None:
        _TEX = _build_tex()
    return _TEX


def sd_lookup(s, h):
    t = tex()
    u = (np.mod(s, PX) / TEX_E).ravel()
    v = (np.clip(h, 0, HMAX - 1e-4) / TEX_E).ravel()
    return map_coordinates(t, [v, u], order=1, mode="grid-wrap").reshape(np.shape(s)).astype(F32)


# Tabelle Höhenwinkel -> Auftreffhöhe auf dem Profil (vom Licht aus gesehen)
_AL = np.arctan2(_PROF_H - HL, np.maximum(_PROF_R, 1e-4))
_AL = np.maximum.accumulate(_AL)


class Lantern:
    def __init__(self, base, scale=1.0, intensity=1.0, rot=0.0, light_size=0.006, color=(1.0, 0.60, 0.24), vis=0.8, fall=None):
        self.base = np.asarray(base, F32)
        self.k = scale
        self.I = intensity
        self.rot = rot
        self.ls = light_size
        self.col = np.asarray(color, F32)
        self.vis = vis
        self.fall = fall
        self.L = self.base + np.array([0, HL * scale, 0], F32)

    # ------------------------------------------------------------- Lichtdurchlass nach außen
    def transmit(self, P, extra_w=0.0):
        d = (P - self.L) / self.k
        rho = np.sqrt(d[..., 0] ** 2 + d[..., 2] ** 2) + 1e-6
        dist = np.sqrt(rho ** 2 + d[..., 1] ** 2)
        al = np.arctan2(d[..., 1], rho)
        hh = np.interp(al, _AL, _PROF_H).astype(F32)
        rh = prof_r(hh)
        dh = np.sqrt(rh ** 2 + (hh - HL) ** 2)
        th = np.arctan2(d[..., 0], -d[..., 2]) + self.rot
        w = self.ls * np.clip(1 - dh / dist, 0, 1) + 0.0004 + extra_w
        sd = sd_lookup(th * RS, hh)
        T = smoothstep(-w, w, sd)
        T = T * ((hh > 0.062) & (hh < 0.43)) * (dist > dh)
        return T.astype(F32), dist * self.k

    def irradiance(self, P, N, leak=0.035):
        """Beleuchtungsstärke (Skalar) auf Fläche P mit Normale N; Farbe self.col."""
        T, dist = self.transmit(P)
        v = (self.L - P) / dist[..., None]
        cos = np.clip((v * N).sum(-1), 0, 1)
        E = self.I * T * cos / np.maximum(dist, 0.03) ** 2
        E += self.I * leak * (0.4 + 0.6 * cos) / (dist ** 2 + 0.08 * self.k ** 2)
        if self.fall:
            E *= np.exp(-(dist / self.fall) ** 2)
        return E.astype(F32)

    # ------------------------------------------------------------- Ansicht der Laterne
    def render(self, cam, env, ss=3, pad=8):
        """Gibt (rgb_lin, alpha, (y0, y1, x0, x1), depth) im Bildmaßstab zurück."""
        k = self.k
        corners = [self.base + np.array([sx * 0.12 * k, sy * k, sz * 0.12 * k], F32)
                   for sx in (-1, 1) for sy in (0, 0.52) for sz in (-1, 1)]
        pr = [cam.project(c) for c in corners]
        x0 = int(max(0, min(p[0] for p in pr) - pad)); x1 = int(min(cam.w, max(p[0] for p in pr) + pad))
        y0 = int(max(0, min(p[1] for p in pr) - pad)); y1 = int(min(cam.h, max(p[1] for p in pr) + pad))
        hh_, ww_ = (y1 - y0) * ss, (x1 - x0) * ss
        Y, X = np.mgrid[0:hh_, 0:ww_].astype(F32)
        dx = (X + 0.5) / ss + x0 - cam.w / 2
        dy = -((Y + 0.5) / ss + y0 - cam.h / 2)
        D = cam.right * dx[..., None] + cam.up * dy[..., None] + cam.fwd * cam.f
        D /= np.linalg.norm(D, axis=-1, keepdims=True)
        O = (cam.c - self.base) / k
        # Strahl gegen Rotationskörper: grob marschieren, dann halbieren
        tc = np.linalg.norm(cam.c - self.L) / k
        ts = np.linspace(tc - 0.42, tc + 0.42, 200, dtype=F32)
        hit_t = np.full(D.shape[:2], np.nan, F32)
        prev_in = np.zeros(D.shape[:2], bool)
        prev_t = ts[0]
        for t in ts:
            p = O + D * t
            inside = (p[..., 0] ** 2 + p[..., 2] ** 2) <= prof_r(p[..., 1]) ** 2
            new = inside & np.isnan(hit_t)
            hit_t[new] = t
            prev_t = t
        hit = ~np.isnan(hit_t)
        lo = np.where(hit, hit_t - (ts[1] - ts[0]), 0)
        hi = np.where(hit, hit_t, 0)
        for _ in range(12):
            mid = (lo + hi) / 2
            p = O + D * mid[..., None]
            inside = (p[..., 0] ** 2 + p[..., 2] ** 2) <= prof_r(p[..., 1]) ** 2
            hi = np.where(inside, mid, hi)
            lo = np.where(inside, lo, mid)
        t = hi
        p = O + D * t[..., None]
        px_, py_, pz_ = p[..., 0], p[..., 1], p[..., 2]
        rr = prof_r(py_)
        n = np.stack([px_, -rr * prof_dr(py_), pz_], -1)
        n /= np.linalg.norm(n, axis=-1, keepdims=True) + 1e-9
        th = np.arctan2(px_, -pz_) + self.rot
        # Pixelgröße im Material (für Kantenglättung)
        pix = t * k / cam.f / ss / k
        cosv = np.clip(-(n * D).sum(-1), 0.12, 1)
        fw = pix / cosv * 0.9
        sd = sd_lookup(th * RS, py_)
        holezone = ((py_ > 0.062) & (py_ < 0.43)).astype(F32)
        hole = smoothstep(-fw, fw, sd) * holezone
        # Messing: Spiegelung der Umgebung, Fresnel, etwas Diffus
        R = D - 2 * (D * n).sum(-1, keepdims=True) * n
        F0 = lin("#E8B25A")
        fres = F0 + (1 - F0) * ((1 - cosv) ** 5)[..., None]
        metal = env(R, n, p * k + self.base) * fres * 0.92 + env(n, n, p * k + self.base) * lin("#8A5A1C") * 0.10
        # warmer Glanz an den Lochkanten (Licht auf Materialstärke)
        edge = np.exp(-np.clip(-sd, 0, None) / 0.0009) * (sd < 0) * holezone
        metal += edge[..., None] * self.col * self.vis * 2.2 * (0.35 + 0.65 * cosv[..., None])
        # Innenraum durch die Löcher: warme Rückwand + Flamme
        lp = (self.L - self.base) / k
        rel = p - lp
        along = (rel * D).sum(-1)
        perp = rel - D * along[..., None]
        dperp = np.sqrt(perp[..., 0] ** 2 + (perp[..., 1] / 2.2) ** 2 + perp[..., 2] ** 2)
        flame = 9.0 * np.exp(-(dperp / 0.010) ** 2) + 2.2 * np.exp(-(dperp / 0.032) ** 2)
        back = 1.35 * (0.55 + 0.45 * cosv) * np.exp(-((py_ - HL) / 0.17) ** 2)
        inner = self.col * (self.vis * (back + flame))[..., None]
        inner = inner * np.array([1.0, 0.95, 0.9], F32) + np.array([0.25, 0.12, 0.02], F32) * (flame[..., None] > 3)
        metal = metal * (0.30 + 0.70 * smoothstep(0.0, 0.055, py_))[..., None]
        rgb = metal * (1 - hole[..., None]) + inner * hole[..., None]
        rgb[~hit] = 0
        a = hit.astype(F32)
        depth = np.where(hit, t * k, 1e9).astype(F32)
        # auf Bildmaßstab
        rgbd = rgb.reshape(y1 - y0, ss, x1 - x0, ss, 3).mean((1, 3))
        ad = a.reshape(y1 - y0, ss, x1 - x0, ss).mean((1, 3))
        rgbd = rgbd / np.maximum(ad, 1e-4)[..., None]
        dd = depth.reshape(y1 - y0, ss, x1 - x0, ss).min((1, 3))
        return rgbd.astype(F32), ad.astype(F32), (y0, y1, x0, x1), dd


def bokeh(img, x, y, r, col, k=1.0, rim=0.25, soft=1.2):
    """Weiche Unschärfescheibe (keine Ecken) additiv ins lineare Bild."""
    h, w = img.shape[:2]
    xa, xb = int(max(0, x - r - 4)), int(min(w, x + r + 5))
    ya, yb = int(max(0, y - r - 4)), int(min(h, y + r + 5))
    if xa >= xb or ya >= yb:
        return
    Y, X = np.mgrid[ya:yb, xa:xb].astype(F32)
    d = np.sqrt((X - x) ** 2 + (Y - y) ** 2)
    disc = np.clip((r - d) / soft + 0.5, 0, 1)
    prof = (1 - rim) + rim * smoothstep(0.55 * r, r, d)
    img[ya:yb, xa:xb] += (disc * prof * k)[..., None] * np.asarray(col, F32)
