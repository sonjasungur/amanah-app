"""Runde 2 – Landschaftsrenderer: Abendhimmel, Höhenfeld-Gelände (Voxel-Space-Spaltenverfahren, kantengeglättet),
Wiese mit entfernungsabhängiger Textur, Dunst/Nebel, Zypressen und schlichte Grabstelen als echte 3D-Körper.
Vollständig programmatisch (numpy, PIL, scipy)."""
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, map_coordinates

from _r2_basis import F32, W, H, lin, smoothstep, tile_noise


def norm(v):
    v = np.asarray(v, F32)
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def sun_dir(az_deg, el_deg):
    a, e = np.radians(az_deg), np.radians(el_deg)
    return np.array([np.sin(a) * np.cos(e), np.sin(e), np.cos(a) * np.cos(e)], F32)


class Noise2:
    """Kachelbares Rauschen als Funktion der Weltkoordinaten (bilinear)."""

    def __init__(self, rng, n=512, sigma=8):
        self.t = tile_noise(rng, n, sigma)
        self.n = n

    def __call__(self, x, z, scale):
        u = np.asarray(x, F32) / scale * self.n
        v = np.asarray(z, F32) / scale * self.n
        return map_coordinates(self.t, [v.ravel(), u.ravel()], order=1, mode="grid-wrap").reshape(np.shape(x)).astype(F32)


class Sky:
    def __init__(self, sun, zenith="#0B1226", mid="#1C2A64", horizon="#5A5C8E", warm="#F2C27A", glow=1.0,
                 sun_disc=0.0, rng=None, clouds=0.0, broad=0.35, band_e=0.10):
        self.s = norm(sun)
        self.zen, self.mid, self.hor, self.warm = lin(zenith), lin(mid), lin(horizon), lin(warm)
        self.glow = glow
        self.disc = sun_disc
        self.clouds = clouds
        self.broad, self.band_e = broad, band_e
        rng = rng or np.random.default_rng(5)
        self.cn = tile_noise(rng, 1024, 10)
        self.cn2 = tile_noise(rng, 1024, 3)

    def __call__(self, D):
        e = np.arcsin(np.clip(D[..., 1], -1, 1))
        t = np.clip(e / 0.75, 0, 1)[..., None]
        base = self.hor * (1 - smoothstep(0, 0.25, t)) + self.mid * smoothstep(0, 0.25, t) * (1 - smoothstep(0.25, 1, t)) \
            + self.zen * smoothstep(0.25, 1, t)
        cosg = np.clip((D * self.s).sum(-1), -1, 1)
        ang = np.arccos(cosg)
        az = np.arctan2(D[..., 0], D[..., 2])
        saz = np.arctan2(self.s[0], self.s[2])
        daz = np.angle(np.exp(1j * (az - saz)))
        band = np.exp(-np.clip(e, 0, None) / self.band_e) * np.exp(-(daz / 1.1) ** 2)
        warm = self.warm * (band * 0.55 * self.glow)[..., None]
        mie = self.warm * (self.glow * (0.9 * np.exp(-ang / 0.09) + self.broad * np.exp(-ang / 0.35)))[..., None]
        col = base + warm + mie * np.exp(-np.clip(e, 0, None) / 0.35)[..., None]
        if self.disc:
            col += lin("#FFF2D6") * (self.disc * smoothstep(0.0115, 0.0085, ang))[..., None]
        if self.clouds:
            u = (az / (2 * np.pi) + 0.5) * 1024 * 3
            v = np.clip(e, 0, None) * 1024 * 6
            c1 = map_coordinates(self.cn, [v.ravel() * 0.25, u.ravel()], order=1, mode="grid-wrap").reshape(e.shape)
            c2 = map_coordinates(self.cn2, [v.ravel() * 0.5, u.ravel() * 0.8], order=1, mode="grid-wrap").reshape(e.shape)
            cm = smoothstep(0.3, 1.6, c1 + 0.35 * c2) * smoothstep(0.015, 0.05, e) * (1 - smoothstep(0.12, 0.30, e))
            lit = self.warm * (0.25 + 1.6 * np.exp(-(daz / 0.8) ** 2))[..., None] * 0.35
            ccol = base * 0.75 + lit
            col = col * (1 - (cm * self.clouds)[..., None]) + ccol * (cm * self.clouds)[..., None]
        return col.astype(F32)


def terrain_render(cam, height_fn, ss=2, zmin=0.8, zmax=4000.0, nsteps=2600):
    """Voxel-Space: je Bildspalte vom nahen zum fernen Gelände. Liefert (P, depth, hit) in ss-Auflösung."""
    w, h = cam.w * ss, cam.h * ss
    xs = (np.arange(w, dtype=F32) + 0.5) / ss - cam.w / 2
    fh = cam.fwd.copy()
    fh[1] = 0
    fh /= np.linalg.norm(fh)
    rh = np.array([fh[2], 0, -fh[0]], F32)
    pitch = np.arcsin(-cam.fwd[1])
    ds = np.geomspace(zmin, zmax, nsteps).astype(F32)
    Ys = np.empty((nsteps, w), F32)
    for i, d in enumerate(ds):
        px = cam.c[0] + fh[0] * d + rh[0] * xs / cam.f * d
        pz = cam.c[2] + fh[2] * d + rh[2] * xs / cam.f * d
        hh = height_fn(px, pz)
        # exakte Projektion mit Neigung
        rel_y = hh - cam.c[1]
        yc = rel_y * np.cos(pitch) + d * np.sin(pitch)
        zc = d * np.cos(pitch) - rel_y * np.sin(pitch)
        Ys[i] = (cam.h / 2 - cam.f * yc / zc) * ss
    M = np.minimum.accumulate(Ys, axis=0)
    yy = np.arange(h, dtype=F32) + 0.5
    depth = np.full((h, w), np.inf, F32)
    for col in range(w):
        m = -M[:, col]
        k = np.searchsorted(m, -yy, side="left")
        ok = k < nsteps
        kk = np.clip(k, 1, nsteps - 1)
        y0, y1 = M[kk - 1, col], M[kk, col]
        fr = np.clip((y0 - yy) / np.maximum(y0 - y1, 1e-6), 0, 1)
        dd = ds[kk - 1] * (1 - fr) + ds[kk] * fr
        dd = np.where(k == 0, ds[0], dd)
        depth[:, col] = np.where(ok, dd, np.inf)
    hit = np.isfinite(depth)
    d = np.where(hit, depth, 1.0)
    X = np.broadcast_to(xs[None, :], (h, w))
    px = cam.c[0] + fh[0] * d + rh[0] * X / cam.f * d
    pz = cam.c[2] + fh[2] * d + rh[2] * X / cam.f * d
    py = height_fn(px, pz)
    P = np.stack([px, py, pz], -1).astype(F32)
    return P, np.where(hit, depth, np.inf).astype(F32), hit


def normals(height_fn, x, z, e=0.15):
    hx_ = (height_fn(x + e, z) - height_fn(x - e, z)) / (2 * e)
    hz_ = (height_fn(x, z + e) - height_fn(x, z - e)) / (2 * e)
    n = np.stack([-hx_, np.ones_like(hx_), -hz_], -1)
    return (n / np.linalg.norm(n, axis=-1, keepdims=True)).astype(F32)


def fog_apply(col, dist, D, sun, density=0.004, fogcol="#4A5288", warm="#E9B872", warm_k=1.0, height=None, hfall=None):
    s = norm(sun)
    cg = np.clip((D * s).sum(-1), -1, 1)
    f = 1 - np.exp(-np.clip(dist, 0, None) * density)
    if height is not None and hfall:
        f = f * np.exp(-np.clip(height, 0, None) / hfall) ** 0.5
    fc = lin(fogcol) + lin(warm) * (warm_k * (0.08 + 0.35 * np.clip(cg, 0, 1) ** 12 + 0.9 * np.clip(cg, 0, 1) ** 80))[..., None]
    return (col * (1 - f[..., None]) + fc * f[..., None]).astype(F32), f


# --------------------------------------------------------------------- Objekte (Polygonmasken mit Tiefentest)
def poly_mask(pts, ss=4, pad=2, w=W, h=H):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    x0, x1 = int(max(0, np.floor(min(xs)) - pad)), int(min(w, np.ceil(max(xs)) + pad))
    y0, y1 = int(max(0, np.floor(min(ys)) - pad)), int(min(h, np.ceil(max(ys)) + pad))
    if x0 >= x1 or y0 >= y1:
        return None, None
    im = Image.new("L", ((x1 - x0) * ss, (y1 - y0) * ss), 0)
    ImageDraw.Draw(im).polygon([((x - x0) * ss, (y - y0) * ss) for x, y in pts], fill=255)
    m = np.asarray(im.resize((x1 - x0, y1 - y0), Image.BOX), F32) / 255
    return m, (y0, y1, x0, x1)


def paint(img, zbuf, m, box, col, z, ztest=True):
    if m is None:
        return
    y0, y1, x0, x1 = box
    if ztest:
        m = m * (zbuf[y0:y1, x0:x1] > z)
    col = np.asarray(col, F32)
    if col.ndim == 1:
        col = col[None, None]
    img[y0:y1, x0:x1] = img[y0:y1, x0:x1] * (1 - m[..., None]) + col * m[..., None]
    zbuf[y0:y1, x0:x1] = np.where(m > 0.5, z, zbuf[y0:y1, x0:x1])


def stela_profile(half_w, height, head="round", n=18):
    """Umriss (u, v) einer schlanken Stele, gegen den Uhrzeigersinn, Boden zuerst."""
    pts = [(-half_w, 0.0)]
    if head == "round":
        vs = height - half_w
        pts.append((-half_w, vs))
        for i in range(1, n):
            a = np.pi - np.pi * i / n
            pts.append((half_w * np.cos(a), vs + half_w * np.sin(a)))
        pts.append((half_w, vs))
    elif head == "pointed":
        # Kielbogen: zwei Kreisbögen, Scheitel spitz
        r = half_w * 1.6
        vs = height - np.sqrt(r * r - (r - half_w) ** 2)
        pts.append((-half_w, vs))
        cxl = -half_w + r
        for i in range(1, n):
            y = vs + (height - vs) * i / n
            x = cxl - np.sqrt(max(r * r - (y - vs) ** 2, 0))
            pts.append((x, y))
        pts.append((0.0, height))
        for i in range(n - 1, 0, -1):
            y = vs + (height - vs) * i / n
            x = -(cxl - np.sqrt(max(r * r - (y - vs) ** 2, 0)))
            pts.append((x, y))
        pts.append((half_w, vs))
    else:
        pts += [(-half_w, height - 0.04), (-half_w + 0.03, height), (half_w - 0.03, height), (half_w, height - 0.04)]
    pts.append((half_w, 0.0))
    return pts


def stela_shadow(img, cam, base, q, prof, thick, sun, k=0.5, blur=0.7):
    """Schlagschatten der Stele auf den (lokal ebenen) Boden, Richtung von der Sonne weg."""
    q = norm(q)
    up = np.array([0, 1, 0], F32)
    eu = np.cross(up, q)
    eu /= np.linalg.norm(eu)
    s = norm(sun)
    pts = []
    for u, v in prof:
        p = base + eu * u + up * v
        p = p - s * (v / max(s[1], 1e-3))
        pts.append(p)
    # Fuß verbreitern (Dicke)
    pts = [base + eu * prof[0][0] - q * thick / 2, base + eu * prof[0][0] + q * thick / 2] + pts[1:-1] + \
          [base + eu * prof[-1][0] + q * thick / 2, base + eu * prof[-1][0] - q * thick / 2]
    pr = [cam.project(p) for p in pts]
    if any(p[2] <= 0.05 for p in pr):
        return
    m, box = poly_mask([(p[0], p[1]) for p in pr])
    if m is None:
        return
    if blur:
        m = gaussian_filter(m, blur)
    y0, y1, x0, x1 = box
    img[y0:y1, x0:x1] *= (1 - k * m)[..., None]


def draw_stela(img, zbuf, cam, base, q, prof, thick, shade_fn, ztest=True, rim=None, tex=None, tex_k=0.0):
    """Extrudierter Körper: Vorder-/Rückfläche und sichtbare Seitenstreifen. shade_fn(normal, v_rel) -> Farbe."""
    q = norm(q)
    up = np.array([0, 1, 0], F32)
    eu = np.cross(up, q)
    eu /= np.linalg.norm(eu)

    def W3(u, v, s):
        return base + eu * u + up * v + q * s

    cen = base + up * prof[len(prof) // 2][1] * 0.5
    dist = float(np.linalg.norm(cen - cam.c))
    faces = []
    for s, nrm in ((-thick / 2, -q), (thick / 2, q)):
        pts3 = [W3(u, v, s) for u, v in prof]
        faces.append((pts3, nrm, None))
    for i in range(len(prof) - 1):
        (u0, v0), (u1, v1) = prof[i], prof[i + 1]
        if v0 == 0 and v1 == 0:
            continue
        e = np.array([u1 - u0, v1 - v0], F32)
        nl = np.array([e[1], -e[0]], F32)          # nach außen (Umriss gegen Uhrzeigersinn)
        nl /= np.linalg.norm(nl) + 1e-9
        nrm = eu * nl[0] + up * nl[1]
        pts3 = [W3(u0, v0, -thick / 2), W3(u1, v1, -thick / 2), W3(u1, v1, thick / 2), W3(u0, v0, thick / 2)]
        faces.append((pts3, nrm, (v0 + v1) / 2))
    vis = []
    for pts3, nrm, vm in faces:
        ctr = np.mean(pts3, axis=0)
        if np.dot(nrm, cam.c - ctr) <= 0:
            continue
        pr = [cam.project(p) for p in pts3]
        if any(p[2] <= 0.05 for p in pr):
            continue
        vis.append(([(p[0], p[1]) for p in pr], nrm, vm, ctr))
    # erst Seiten, dann Kappen (Kappe deckt bei konvexem Körper korrekt)
    vis.sort(key=lambda f: f[2] is None)
    if not vis:
        return dist
    for pts2, nrm, vm, ctr in vis:
        m, box = poly_mask(pts2)
        if m is None:
            continue
        y0, y1, x0, x1 = box
        if vm is None:
            # Kappe: senkrechter Verlauf (unten dunkler) und feine Verwitterung
            vb = cam.project(base)[1]
            vt = min(p[1] for p in pts2)
            yy = np.arange(y0, y1, dtype=F32)[:, None]
            g = smoothstep(vb + 2, vt, yy)
            col = shade_fn(nrm, g, dist)
        else:
            col = shade_fn(nrm, np.full((1, 1), vm / max(prof[len(prof) // 2][1], 1e-3), F32), dist)
        col = np.broadcast_to(col, (y1 - y0, x1 - x0, 3))
        if tex is not None:
            col = col * (1 + tex_k * tex[y0:y1, x0:x1, None])
        paint(img, zbuf, m, box, col, dist, ztest)
    if rim is not None:
        sun_xy, rcol, rk, rpx = rim
        allp = [p for f in vis for p in f[0]]
        m, box = poly_mask_multi([f[0] for f in vis], pad=int(rpx) + 3)
        if m is not None:
            y0, y1, x0, x1 = box
            cx, cy = np.mean([p[0] for p in allp]), np.mean([p[1] for p in allp])
            v = np.array([sun_xy[0] - cx, sun_xy[1] - cy], F32)
            v /= np.linalg.norm(v) + 1e-6
            from scipy.ndimage import shift as _shift
            ms = _shift(m, (v[1] * rpx, v[0] * rpx), order=1, mode="constant")
            r = np.clip(m - ms, 0, 1) * (zbuf[y0:y1, x0:x1] >= dist - 0.01)
            img[y0:y1, x0:x1] += np.asarray(rcol, F32) * (r * rk)[..., None]
    return dist


def poly_mask_multi(polys, ss=4, pad=2, w=W, h=H):
    xs = [p[0] for pl in polys for p in pl]
    ys = [p[1] for pl in polys for p in pl]
    x0, x1 = int(max(0, np.floor(min(xs)) - pad)), int(min(w, np.ceil(max(xs)) + pad))
    y0, y1 = int(max(0, np.floor(min(ys)) - pad)), int(min(h, np.ceil(max(ys)) + pad))
    if x0 >= x1 or y0 >= y1:
        return None, None
    im = Image.new("L", ((x1 - x0) * ss, (y1 - y0) * ss), 0)
    d = ImageDraw.Draw(im)
    for pl in polys:
        d.polygon([((x - x0) * ss, (y - y0) * ss) for x, y in pl], fill=255)
    m = np.asarray(im.resize((x1 - x0, y1 - y0), Image.BOX), F32) / 255
    return m, (y0, y1, x0, x1)


def cypress(img, zbuf, cam, base, height, width, sun, rng, fog_fn, foliage="#3A4A2E", ss=2, ztest=True, rim_k=0.5,
            amb_k=1.0):
    """Säulenförmige Zypresse als dichte Laubsilhouette mit Büschelstruktur und weichem Streiflicht."""
    sb = cam.project(base)
    st = cam.project(base + np.array([0, height, 0], F32))
    if sb[2] <= 0.5:
        return
    hp = sb[1] - st[1]
    wp = width * cam.f / sb[2]
    x0, x1 = int(sb[0] - wp * 0.8 - 3), int(sb[0] + wp * 0.8 + 4)
    y0, y1 = int(st[1] - 4), int(sb[1] + 3)
    X0, Y0 = max(0, x0), max(0, y0)
    X1, Y1 = min(img.shape[1], x1), min(img.shape[0], y1)
    if X0 >= X1 or Y0 >= Y1:
        return
    Yg, Xg = np.mgrid[Y0 * ss:Y1 * ss, X0 * ss:X1 * ss].astype(F32)
    Xg = (Xg + 0.5) / ss
    Yg = (Yg + 0.5) / ss
    t = np.clip((sb[1] - Yg) / hp, 0, 1)
    lean = 0.04 * wp * np.sin(t * 2.0 + rng.uniform(0, 6))
    cx = sb[0] + (st[0] - sb[0]) * t + lean
    prof = np.clip(t / 0.03, 0, 1) ** 0.35 * np.clip(1 - np.clip(t, 0, 1) ** 2.1, 0, 1) ** 0.85 * (1 + 0.12 * np.sin(np.pi * t))
    prof = np.maximum(prof, 0) * (t > 0.0)
    hw = wp / 2 * prof
    nx = (Xg - cx) / np.maximum(hw, 1e-3)
    # Büschel: Rauschen in (Winkel, Höhe)
    sc = max(hp, 30)
    n1 = gaussian_filter(rng.normal(0, 1, Xg.shape).astype(F32), (max(0.7, sc / 130 * ss), max(0.7, sc / 260 * ss)))
    n1 /= n1.std() + 1e-6
    n2 = gaussian_filter(rng.normal(0, 1, Xg.shape).astype(F32), (max(0.5, sc / 420 * ss), max(0.5, sc / 700 * ss)))
    n2 /= n2.std() + 1e-6
    edge = 1 - np.abs(nx) + 0.09 * n1 + 0.06 * n2
    trunk = (np.abs(Xg - sb[0]) < max(0.6, wp * 0.035)) & (Yg > sb[1] - hp * 0.02)
    cov = np.clip(edge * hw / 1.2 * ss, 0, 1) * (t < 0.995) * (t > 0.006) * (np.abs(nx) < 1.12)
    cov = np.maximum(cov, trunk.astype(F32))
    # Pseudo-Normale (Zylinder), Licht
    nz = -np.sqrt(np.clip(1 - np.clip(nx, -1, 1) ** 2, 0, 1))
    n = cam.right * np.clip(nx, -1, 1)[..., None] + cam.up * 0.15 + cam.fwd * nz[..., None]
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    s = norm(sun)
    lam = np.clip((n * s).sum(-1), 0, 1)
    clump = 0.45 + 0.65 * smoothstep(-1.4, 1.6, n1 + 0.7 * n2)
    alb = lin(foliage)
    col = alb * (lin("#F4C27C")[None, None] * (lam * 3.4 * clump)[..., None]
                 + lin("#2B3D7A") * amb_k * (0.55 + 0.25 * t)[..., None] * clump[..., None])
    # Gegenlicht-Saum an der Sonnenseite
    back = float(np.clip((s * cam.fwd).sum(), 0, 1))
    side = np.where(np.sign(nx) == np.sign((s * cam.right).sum() + 1e-6), 1.0, 0.45)
    rim = smoothstep(0.82, 1.0, gaussian_filter(np.abs(np.clip(nx, -1.2, 1.2)), 1.5)) ** 2 * side * back
    col += lin("#F2C27A") * (rim * rim_k * clump)[..., None]
    col *= (0.7 + 0.3 * t)[..., None]
    from _r2_basis import downsample
    col = downsample(col, ss)
    cov = downsample(cov[..., None], ss)
    dist = float(sb[2])
    col = fog_fn(col, dist)
    sl = (slice(Y0, Y1), slice(X0, X1))
    m = cov * (zbuf[sl] > dist) if ztest else cov
    img[sl] = img[sl] * (1 - m[..., None]) + col * m[..., None]
    zbuf[sl] = np.where(m > 0.5, dist, zbuf[sl])


def grass_blades(img, rng, n, y_from, y_to, hmin, hmax, dark="#1A2216", tip="#E8B66A", tip_k=0.5, blur=1.6,
                 lean=0.25, x_range=(0, W), ss=3):
    """Feine Grashalme im unscharfen Vordergrund (Silhouetten mit warm angestrahlten Spitzen)."""
    h, w = img.shape[:2]
    y0 = int(max(0, y_from - hmax - 5))
    hh = h - y0
    im = Image.new("L", (w * ss, hh * ss), 0)
    it = Image.new("L", (w * ss, hh * ss), 0)
    d, dt = ImageDraw.Draw(im), ImageDraw.Draw(it)
    for _ in range(n):
        x = rng.uniform(*x_range)
        yb = rng.uniform(y_from, y_to)
        L = rng.uniform(hmin, hmax) * (0.6 + 0.4 * (yb - y_from) / max(y_to - y_from, 1))
        bend = rng.normal(0, lean) * L
        wid = rng.uniform(1.2, 2.6) * (0.7 + 0.6 * (yb - y_from) / max(y_to - y_from, 1))
        pts = []
        for i in range(12):
            t = i / 11
            pts.append((x + bend * t * t, yb - L * t))
        for i in range(11):
            t0, t1 = i / 11, (i + 1) / 11
            ww = wid * (1 - t0) + 0.3
            seg = [((pts[i][0]) * ss, (pts[i][1] - y0) * ss), ((pts[i + 1][0]) * ss, (pts[i + 1][1] - y0) * ss)]
            d.line(seg, fill=255, width=max(1, int(ww * ss)))
            if t0 > 0.55:
                dt.line(seg, fill=int(255 * (t0 - 0.55) / 0.45), width=max(1, int(ww * ss)))
    m = np.asarray(im.resize((w, hh), Image.BOX), F32) / 255
    mt = np.asarray(it.resize((w, hh), Image.BOX), F32) / 255
    if blur:
        m = gaussian_filter(m, blur)
        mt = gaussian_filter(mt, blur)
    sub = img[y0:]
    sub[:] = sub * (1 - m[..., None]) + lin(dark) * m[..., None]
    sub += lin(tip) * (mt * tip_k)[..., None]


def cypress_shadow(img, cam, base, height, width, sun, k=0.3, blur=2.0):
    """Langer weicher Schlagschatten einer Zypresse auf dem (lokal ebenen) Boden."""
    ts = np.linspace(0, 1, 40)
    prof = np.sqrt(np.clip(ts / 0.06, 0, 1)) * np.clip(1 - ts ** 2.1, 0, 1) ** 0.85 * (1 + 0.12 * np.sin(np.pi * ts))
    left = [(-width / 2 * p, height * t) for t, p in zip(ts, prof)]
    right = [(width / 2 * p, height * t) for t, p in zip(ts, prof)][::-1]
    pts = left + right
    sh = norm(np.array([sun[0], 0, sun[2]], F32))
    stela_shadow(img, cam, base, sh, pts, 0.0, sun, k=k, blur=blur)


def grass_texture(img, zbuf, rng, near=2.0, far=40.0, k=0.16, warm_k=0.10, warm="#F4C46E", mask=None):
    """Feine Halmstruktur auf naher Wiese (senkrecht gestreckt, mit Tiefe feiner und schwächer)."""
    h, w = zbuf.shape
    a = gaussian_filter(rng.normal(0, 1, (h, w)).astype(F32), (2.2, 0.55))
    b = gaussian_filter(rng.normal(0, 1, (h, w)).astype(F32), (5.0, 1.1))
    a /= a.std() + 1e-6
    b /= b.std() + 1e-6
    t = 1 - smoothstep(near, far, zbuf)
    if mask is not None:
        t = t * mask
    tex = (0.7 * a + 0.5 * b) * t
    img *= (1 + k * tex)[..., None]
    img += lin(warm) * (np.clip(tex - 0.8, 0, None) * warm_k * img.mean(-1) / (img.mean(-1) + 0.02))[..., None]
