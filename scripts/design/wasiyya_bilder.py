"""Wasiyya: eigene, computergenerierte Bilder (Design Royal Imperial). Keine fremden Vorlagen.
Aufruf: python3 wasiyya_bilder.py <ausgabeordner> [name ...]"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

RNG = np.random.default_rng(20261125)


def hx(h):
    return np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)


def grid(W, H):
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    return X, Y


def vgrad(W, H, stops):
    t = np.linspace(0, 1, H)
    ts = [s[0] for s in stops]
    cols = np.stack([hx(s[1]) for s in stops])
    col = np.stack([np.interp(t, ts, cols[:, c]) for c in range(3)], -1).astype(np.float32)
    return np.repeat(col[:, None, :], W, 1)


def glow(img, X, Y, cx, cy, r, col, k=1.0, sx=1.0, sy=1.0):
    d2 = ((X - cx) / sx) ** 2 + ((Y - cy) / sy) ** 2
    img += (k * np.exp(-d2 / (r * r)))[..., None] * hx(col)


def mask(W, H, draw_fn, ss=4, blur=0.0):
    im = Image.new("L", (W * ss, H * ss), 0)
    d = ImageDraw.Draw(im)
    draw_fn(d, ss)
    im = im.resize((W, H), Image.LANCZOS)
    m = np.asarray(im, np.float32) / 255
    if blur:
        m = gaussian_filter(m, blur)
    return m


def poly(points):
    return lambda d, s: d.polygon([(x * s, y * s) for x, y in points], fill=255)


def polys(list_of_points):
    def f(d, s):
        for p in list_of_points:
            d.polygon([(x * s, y * s) for x, y in p], fill=255)
    return f


def ellipse(cx, cy, rx, ry):
    return lambda d, s: d.ellipse([(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s], fill=255)


def comp(img, m, col, a=1.0):
    c = hx(col) if isinstance(col, str) else col
    mm = (m * a)[..., None]
    img[:] = img * (1 - mm) + c * mm


def bokeh(img, n, cols, rmin, rmax, box, inten, blur, weight=None):
    H, W = img.shape[:2]
    layer = np.zeros_like(img)
    x0, x1, y0, y1 = box
    for _ in range(n):
        r = RNG.uniform(rmin, rmax)
        cx = RNG.uniform(x0, x1)
        cy = RNG.uniform(y0, y1)
        if weight is not None and RNG.random() > weight(cx, cy):
            continue
        col = hx(cols[RNG.integers(len(cols))]) * RNG.uniform(0.5, 1.0)
        xa, xb = int(max(0, cx - r - 3)), int(min(W, cx + r + 3))
        ya, yb = int(max(0, cy - r - 3)), int(min(H, cy + r + 3))
        if xa >= xb or ya >= yb:
            continue
        yy, xx = np.mgrid[ya:yb, xa:xb].astype(np.float32)
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        disc = np.clip((r - d) / 1.6 + 0.5, 0, 1)
        ring = np.exp(-((d - r * 0.9) / (r * 0.09 + 0.5)) ** 2) * 0.45
        layer[ya:yb, xa:xb] += ((disc * 0.55 + ring * disc) * inten)[..., None] * col
    if blur:
        layer = gaussian_filter(layer, (blur, blur, 0))
    img += layer


def grain(img, a=0.012):
    img += RNG.normal(0, a, img.shape[:2]).astype(np.float32)[..., None]


def vignette(img, X, Y, s=0.4):
    H, W = img.shape[:2]
    d = ((X - W / 2) / (W / 2)) ** 2 + ((Y - H / 2) / (H / 2)) ** 2
    img *= (1 - s * np.clip(d / 1.6, 0, 1) ** 1.3)[..., None]


def softclip(img, knee=0.82):
    hi = img > knee
    img[hi] = knee + (1 - knee) * (1 - np.exp(-(img[hi] - knee) / (1 - knee)))
    return np.clip(img, 0, 1)


def metal(X, Y, cx, width, dark="#6B4A10", light="#FFF0B8", mid="#D4A537"):
    t = (X - cx) / max(width, 1)
    f = np.exp(-((t + 0.28) / 0.22) ** 2)
    base = hx(mid) * (0.75 + 0.25 * np.cos(np.clip(t, -1.5, 1.5) * 1.6))[..., None]
    out = base * (1 - f[..., None] * 0.6) + hx(light) * f[..., None] * 0.6
    edge = np.clip(np.abs(t) - 0.75, 0, 1)[..., None] * 1.6
    return out * (1 - edge) + hx(dark) * edge


def save(img, path, q=86):
    img = softclip(img)
    Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(path, quality=q, optimize=True, progressive=True)


# ---------------------------------------------------------------- Szenen
def hero(W=1200, H=1500):
    X, Y = grid(W, H)
    img = vgrad(W, H, [(0, "#1C2858"), (0.5, "#0E1630"), (1, "#060A18")])
    glow(img, X, Y, 600, 760, 560, "#B98A24", 0.38)
    bokeh(img, 140, ["#F2CF6C", "#E2B54C", "#FFB04A", "#FFE7A0"], 40, 110, (0, W, 0, H), 0.16, 7,
          weight=lambda x, y: 0.35 + 0.65 * min(1, abs(x - 600) / 450))
    bokeh(img, 90, ["#F2CF6C", "#FFD27A", "#FFF0B8"], 8, 30, (0, W, 200, H), 0.32, 1.6,
          weight=lambda x, y: 0.25 + 0.75 * min(1, abs(x - 600) / 380))
    cx = 600
    # Kette
    chain = mask(W, H, poly([(cx - 3, 0), (cx + 3, 0), (cx + 3, 360), (cx - 3, 360)]))
    comp(img, chain, metal(X, Y, cx, 6), 1)
    for y in range(18, 350, 30):
        ring = mask(W, H, lambda d, s, y=y: d.ellipse([(cx - 8) * s, (y - 13) * s, (cx + 8) * s, (y + 13) * s], outline=255, width=int(3.5 * s)))
        comp(img, ring, metal(X, Y, cx, 10), 1)
    # Lichtkegel nach unten
    cone = mask(W, H, poly([(cx - 70, 960), (cx + 70, 960), (cx + 420, H), (cx - 420, H)]), blur=70)
    img += cone[..., None] * hx("#E2B54C") * 0.13
    # Haube
    capr = mask(W, H, lambda d, s: (d.pieslice([(cx - 150) * s, (360) * s, (cx + 150) * s, (620) * s], 180, 360, fill=255)))
    comp(img, capr, metal(X, Y, cx, 150), 1)
    comp(img, mask(W, H, ellipse(cx, 352, 16, 16)), metal(X, Y, cx, 16), 1)
    comp(img, mask(W, H, poly([(cx - 165, 482), (cx + 165, 482), (cx + 165, 502), (cx - 165, 502)])), metal(X, Y, cx, 165), 1)
    # Glaskörper
    body = [(cx - 140, 502), (cx + 140, 502), (cx + 165, 650), (cx + 95, 940), (cx - 95, 940), (cx - 165, 650)]
    bm = mask(W, H, poly(body))
    t = np.clip(np.sqrt(((X - cx) / 150) ** 2 + ((Y - 700) / 260) ** 2), 0, 1)
    glass = hx("#FFF3CC") * (1 - t[..., None]) ** 0.7 + hx("#C77A1E") * (1 - (1 - t[..., None]) ** 0.7)
    comp(img, bm, glass * 1.15, 0.96)
    core = np.zeros_like(img)
    glow(core, X, Y, cx, 700, 95, "#FFF8E0", 1.4)
    img += core * bm[..., None]
    glow(img, X, Y, cx, 700, 300, "#F2B64C", 0.55)
    glow(img, X, Y, cx, 700, 160, "#FFE7A0", 0.35)
    # Rahmenstreben
    for pts in ([(cx - 62, 502), (cx - 52, 502), (cx - 40, 940), (cx - 50, 940)],
                [(cx + 52, 502), (cx + 62, 502), (cx + 50, 940), (cx + 40, 940)],
                [(cx - 144, 502), (cx - 130, 502), (cx - 152, 650), (cx - 166, 650)],
                [(cx + 130, 502), (cx + 144, 502), (cx + 166, 650), (cx + 152, 650)],
                [(cx - 166, 650), (cx - 152, 650), (cx - 84, 940), (cx - 98, 940)],
                [(cx + 152, 650), (cx + 166, 650), (cx + 98, 940), (cx + 84, 940)],
                [(cx - 170, 642), (cx + 170, 642), (cx + 170, 660), (cx - 170, 660)]):
        comp(img, mask(W, H, poly(pts)), metal(X, Y, cx, 170), 1)
    # Fuß
    comp(img, mask(W, H, poly([(cx - 110, 940), (cx + 110, 940), (cx + 70, 1000), (cx - 70, 1000)])), metal(X, Y, cx, 110), 1)
    comp(img, mask(W, H, poly([(cx - 22, 1000), (cx + 22, 1000), (cx + 6, 1075), (cx - 6, 1075)])), metal(X, Y, cx, 22), 1)
    comp(img, mask(W, H, ellipse(cx, 1082, 10, 12)), metal(X, Y, cx, 10), 1)
    grain(img, 0.011)
    vignette(img, X, Y, 0.45)
    return img


def janazah(W=1600, H=1200):
    X, Y = grid(W, H)
    img = vgrad(W, H, [(0, "#0A1022"), (0.32, "#202B5C"), (0.55, "#5E5282"), (0.68, "#C98A5C"), (0.76, "#F2C46E"), (1, "#F7D894")])
    glow(img, X, Y, 800, 905, 330, "#FFD98A", 0.75, sx=1.6)
    glow(img, X, Y, 800, 905, 110, "#FFF3D0", 0.9)
    for yb, a in ((860, 0.10), (885, 0.14)):
        img += np.exp(-((Y - yb) / 22) ** 2)[..., None] * hx("#FFE3B0") * a
    # ferne Hügel
    xs = np.arange(W)
    hill = 878 + 18 * np.sin(xs / 210) + 10 * np.sin(xs / 77 + 1.3)
    hm = (Y > hill[None, :]).astype(np.float32)
    comp(img, gaussian_filter(hm, 1.2), "#2C2F57", 0.85)
    # Moschee
    G = 908
    shapes = [
        [(620, 790), (980, 790), (980, G), (620, G)],
        [(690, 760), (910, 760), (910, 795), (690, 795)],
    ]
    m = mask(W, H, polys(shapes))
    m = np.maximum(m, mask(W, H, lambda d, s: d.pieslice([650 * s, 610 * s, 950 * s, 910 * s], 180, 360, fill=255)))
    m = np.maximum(m, mask(W, H, lambda d, s: d.pieslice([610 * s, 745 * s, 712 * s, 847 * s], 180, 360, fill=255)))
    m = np.maximum(m, mask(W, H, lambda d, s: d.pieslice([888 * s, 745 * s, 990 * s, 847 * s], 180, 360, fill=255)))
    m = np.maximum(m, mask(W, H, poly([(797, 615), (803, 615), (803, 575), (797, 575)])))
    m = np.maximum(m, mask(W, H, lambda d, s: d.ellipse([788 * s, 548 * s, 812 * s, 572 * s], fill=255)))
    for mx in (548, 1052):
        m = np.maximum(m, mask(W, H, polys([[(mx - 17, G), (mx + 17, G), (mx + 17, 520), (mx - 17, 520)],
                                            [(mx - 26, 640), (mx + 26, 640), (mx + 26, 656), (mx - 26, 656)],
                                            [(mx - 24, 520), (mx + 24, 520), (mx + 24, 534), (mx - 24, 534)],
                                            [(mx - 17, 520), (mx + 17, 520), (mx, 448)]])))
    crescent = np.clip(mask(W, H, ellipse(800, 560, 11, 11)) - mask(W, H, ellipse(805, 556, 9, 9)), 0, 1)
    comp(img, gaussian_filter(m, 0.8), "#0B1226", 1)
    img += crescent[..., None] * hx("#F2CF6C") * 0.9
    # Fenster mit warmem Licht
    for wx in (680, 740, 860, 920):
        wm = mask(W, H, lambda d, s, wx=wx: (d.rectangle([(wx - 9) * s, 840 * s, (wx + 9) * s, 885 * s], fill=255), d.pieslice([(wx - 9) * s, 831 * s, (wx + 9) * s, 849 * s], 180, 360, fill=255)))
        img += wm[..., None] * hx("#F2B64C") * 0.85
        glow(img, X, Y, wx, 862, 30, "#F2B64C", 0.12)
    # Vordergrund
    fg = 930 + 22 * np.sin(xs / 300 + 0.6) + 8 * np.sin(xs / 90)
    fm = gaussian_filter((Y > fg[None, :]).astype(np.float32), 1.5)
    comp(img, fm, "#070B18", 1)
    img += np.exp(-((Y - 915) / 28) ** 2)[..., None] * hx("#FFE3B0") * 0.08
    grain(img, 0.013)
    vignette(img, X, Y, 0.35)
    return img


def testament(W=1600, H=1200):
    X, Y = grid(W, H)
    n = gaussian_filter(RNG.normal(0, 1, (H, W)).astype(np.float32), (1.2, 70))
    n2 = gaussian_filter(RNG.normal(0, 1, (H, W)).astype(np.float32), (6, 260))
    wood = hx("#3B2516") * (1 + 0.9 * n[..., None] + 0.6 * n2[..., None])
    img = wood * 0.75
    light = np.exp(-(((X - 560) / 900) ** 2 + ((Y - 380) / 650) ** 2))
    img = img * (0.35 + 1.25 * light[..., None])
    glow(img, X, Y, 560, 380, 520, "#FFB860", 0.12)
    ang = math.radians(-7)
    ca, sa = math.cos(ang), math.sin(ang)
    ox, oy = 800, 600

    def tr(p):
        x, y = p
        return (ox + x * ca - y * sa, oy + x * sa + y * ca)

    def page(sign, lift=0.0, off=0):
        pts = []
        for i in range(41):
            t = i / 40
            x = sign * (8 + t * 500)
            y = -300 - 26 * math.sin(math.pi * t) * (1 - t * 0.4) - lift + off
            pts.append((x, y))
        for i in range(41):
            t = 1 - i / 40
            x = sign * (8 + t * 500)
            y = 300 - 10 * math.sin(math.pi * t) + off
            pts.append((x, y))
        return [tr(p) for p in pts]

    sh = mask(W, H, polys([page(-1, 0, 14), page(1, 0, 14)]), blur=26)
    img *= (1 - 0.55 * sh)[..., None]
    for k in range(5, 0, -1):
        comp(img, mask(W, H, polys([page(-1, 0, k * 3), page(1, 0, k * 3)])), hx("#D9CDB4") * (0.7 + 0.05 * k), 1)
    cover = mask(W, H, polys([[tr((-530, -320)), tr((530, -320)), tr((530, 330)), tr((-530, 330))]]))
    comp(img, gaussian_filter(cover, 0.6) * (1 - mask(W, H, polys([page(-1), page(1)]))), "#142048", 0.0)
    pm = mask(W, H, polys([page(-1), page(1)]))
    lx = (X - ox) * ca + (Y - oy) * sa
    spine = np.clip(np.abs(lx) / 140, 0, 1) ** 0.6
    paper = hx("#F7F1E4") * (0.62 + 0.38 * spine)[..., None] * (0.82 + 0.3 * light[..., None])
    comp(img, pm, paper, 1)
    # Lesebändchen in Gold
    rib = [tr((-6, -290)), tr((6, -290)), tr((18, 380)), tr((4, 372)), tr((-6, 384))]
    comp(img, mask(W, H, poly(rib)), metal(X, Y, ox, 10), 1)
    # Füller
    pang = math.radians(32)
    pc, ps = math.cos(pang), math.sin(pang)
    px, py = 1080, 830

    def pt(x, y):
        return (px + x * pc - y * ps, py + x * ps + y * pc)

    pen = [pt(-330, -17), pt(250, -17), pt(250, 17), pt(-330, 17)]
    comp(img, mask(W, H, poly([(a + 18, b + 22) for a, b in pen]), blur=12), "#000000", 0.55)
    pm2 = mask(W, H, poly(pen))
    v = ((X - px) * -ps + (Y - py) * pc) / 17
    body = hx("#142048") * (0.55 + 0.45 * np.exp(-((v + 0.35) / 0.35) ** 2))[..., None] + hx("#9FB0E0") * (0.35 * np.exp(-((v + 0.45) / 0.12) ** 2))[..., None]
    comp(img, pm2, body, 1)
    u = (X - px) * pc + (Y - py) * ps
    gold_band = ((np.abs(u - 120) < 14) | (np.abs(u + 300) < 9)).astype(np.float32) * pm2
    comp(img, gold_band, metal(v * 17 + 0, Y, 0, 17), 1)
    nib = [pt(250, -15), pt(250, 15), pt(345, 0)]
    comp(img, mask(W, H, poly(nib)), metal(X, Y, pt(300, 0)[0], 60), 1)
    clip = [pt(60, -21), pt(230, -21), pt(230, -12), pt(60, -12)]
    comp(img, mask(W, H, poly(clip)), metal(X, Y, pt(150, 0)[0], 120), 1)
    bokeh(img, 40, ["#FFE7A0", "#F2CF6C"], 1.2, 3.2, (0, W, 0, H), 0.35, 0.6, weight=lambda x, y: math.exp(-(((x - 560) / 700) ** 2 + ((y - 380) / 500) ** 2)))
    grain(img, 0.012)
    vignette(img, X, Y, 0.5)
    return img


def krankheit(W=1600, H=1200):
    X, Y = grid(W, H)
    img = vgrad(W, H, [(0, "#141C38"), (1, "#0A0F20")]) * (0.9 + 0.1 * gaussian_filter(RNG.normal(0, 1, (H, W)).astype(np.float32), 30)[..., None])
    ax0, ax1, ay0, ay1 = 560, 1040, 170, 980
    r = (ax1 - ax0) / 2

    def arch(d, s, inset=0):
        d.rectangle([(ax0 + inset) * s, (ay0 + r) * s, (ax1 - inset) * s, (ay1 - inset) * s], fill=255)
        d.ellipse([(ax0 + inset) * s, (ay0 + inset) * s, (ax1 - inset) * s, (ay0 + 2 * r - inset) * s], fill=255)

    outer = mask(W, H, lambda d, s: arch(d, s, -26))
    comp(img, outer, "#1E2850", 1)
    win = mask(W, H, lambda d, s: arch(d, s, 0))
    sky = vgrad(W, H, [(0, "#5C6FA8"), (0.35, "#C9A3A0"), (0.6, "#F4C77A"), (0.8, "#FFE6AE"), (1, "#FFF2CF")])
    glow(sky, X, Y, 820, 760, 260, "#FFF6DA", 0.9)
    comp(img, win, sky, 1)
    for x0 in (717, 877):
        comp(img, mask(W, H, poly([(x0, ay0), (x0 + 6, ay0), (x0 + 6, ay1), (x0, ay1)])) * win, "#1E2850", 1)
    beam = mask(W, H, poly([(560, 980), (1040, 980), (1040, 600), (1600, 1200), (300, 1200)]), blur=60)
    img += beam[..., None] * hx("#FFD58A") * 0.20
    rays = np.zeros((H, W), np.float32)
    for k in range(9):
        x0 = 600 + k * 52
        rays = np.maximum(rays, mask(W, H, poly([(x0, 610), (x0 + 16, 610), (x0 + 360, 1200), (x0 + 300, 1200)]), blur=18) * RNG.uniform(0.3, 0.8))
    img += (rays * gaussian_filter(win, 120) * 3.0)[..., None] * hx("#FFE2A6") * 0.22
    floor = mask(W, H, poly([(0, 1000), (W, 1000), (W, H), (0, H)]))
    comp(img, floor, "#0C1124", 0.9)
    patch = mask(W, H, poly([(560, 1010), (1040, 1010), (1280, H), (420, H)]), blur=30)
    img += patch[..., None] * hx("#FFD58A") * 0.22
    sill = mask(W, H, poly([(530, 975), (1070, 975), (1070, 1000), (530, 1000)]))
    comp(img, sill, "#2A3462", 1)
    bokeh(img, 120, ["#FFF0C8", "#FFE2A6"], 0.8, 2.4, (550, 1400, 620, 1150), 0.5, 0.5, weight=lambda x, y: 0.9)
    grain(img, 0.012)
    vignette(img, X, Y, 0.45)
    return img


def sadaqa(W=1600, H=1200):
    X, Y = grid(W, H)
    img = vgrad(W, H, [(0, "#0E1630"), (0.35, "#2B3466"), (0.6, "#B6795E"), (0.74, "#F2BE6A"), (1, "#FFE0A0")])
    glow(img, X, Y, 1120, 800, 300, "#FFE7A8", 0.95, sx=1.4)
    glow(img, X, Y, 1120, 800, 90, "#FFF7DD", 1.1)
    ang = np.arctan2(Y - 800, X - 1120)
    rays = (0.5 + 0.5 * np.cos(ang * 26 + 0.4)) ** 6 * np.exp(-np.sqrt((X - 1120) ** 2 + (Y - 800) ** 2) / 700)
    img += gaussian_filter(rays, 3)[..., None] * hx("#FFE2A0") * 0.18
    xs = np.arange(W)
    hill = 900 - 90 * np.exp(-((xs - 640) / 520) ** 2) + 6 * np.sin(xs / 37)
    hm = gaussian_filter((Y > hill[None, :]).astype(np.float32), 1.0)
    comp(img, hm, "#090E1E", 1)
    tree = np.zeros((H, W), np.float32)
    tips = []

    def branch(x, y, a, L, w, depth):
        x2, y2 = x + math.cos(a) * L, y + math.sin(a) * L
        nx, ny = -math.sin(a), math.cos(a)
        w2 = w * 0.68
        seg.append([(x + nx * w, y + ny * w), (x2 + nx * w2, y2 + ny * w2), (x2 - nx * w2, y2 - ny * w2), (x - nx * w, y - ny * w)])
        if depth == 0:
            tips.append((x2, y2))
            return
        for da in (-0.42 + RNG.uniform(-0.12, 0.12), 0.38 + RNG.uniform(-0.12, 0.12)):
            branch(x2, y2, a + da, L * RNG.uniform(0.7, 0.8), w2, depth - 1)

    seg = []
    branch(640, 815, -math.pi / 2, 200, 22, 6)
    tree = mask(W, H, polys(seg))
    canopy = mask(W, H, ellipse(640, 360, 300, 150), ss=2)
    for k in range(70):
        a = math.pi + k / 70 * math.pi * 1.0 + RNG.uniform(-0.03, 0.03)
        rx, ry = 300 + RNG.uniform(-25, 15), 150 + RNG.uniform(-20, 20)
        canopy = np.maximum(canopy, mask(W, H, ellipse(640 + math.cos(a) * rx, 380 + math.sin(a) * ry, RNG.uniform(34, 62), RNG.uniform(28, 50)), ss=2))
    for k in range(26):
        a = k / 26 * math.pi + RNG.uniform(-0.05, 0.05)
        canopy = np.maximum(canopy, mask(W, H, ellipse(640 + math.cos(a) * 270, 400 + math.sin(a) * 70, RNG.uniform(30, 48), RNG.uniform(22, 34)), ss=2))
    canopy = gaussian_filter(canopy, 1.2)
    comp(img, np.maximum(tree, canopy), "#090E1E", 1)
    light_edge = gaussian_filter(canopy, 6) - canopy
    img += np.clip(light_edge, 0, 1)[..., None] * hx("#FFD58A") * 0.5 * np.clip((X - 500) / 600, 0, 1)[..., None]
    for bx, by, s in ((300, 380, 1.0), (340, 410, 0.8), (1350, 300, 0.9)):
        b = mask(W, H, lambda d, ss, bx=bx, by=by, s=s: d.line([((bx - 18 * s) * ss, (by - 6 * s) * ss), (bx * ss, by * ss), ((bx + 18 * s) * ss, (by - 6 * s) * ss)], fill=255, width=int(3 * ss)))
        comp(img, b, "#0B1226", 0.85)
    grain(img, 0.012)
    vignette(img, X, Y, 0.35)
    return img


def quran(W=1600, H=1200):
    X, Y = grid(W, H)
    img = vgrad(W, H, [(0, "#121B3E"), (0.6, "#0B1226"), (1, "#060A18")])
    beam = mask(W, H, poly([(640, 0), (960, 0), (1180, H), (420, H)]), blur=90)
    img += beam[..., None] * hx("#E9C26A") * 0.16
    glow(img, X, Y, 800, 560, 430, "#E2B54C", 0.3)
    stand = []
    for sgn in (-1, 1):
        stand.append([(800 - sgn * 330, 520), (800 - sgn * 290, 500), (800 + sgn * 260, 1040), (800 + sgn * 210, 1060)])
    sm = mask(W, H, polys(stand))
    n = gaussian_filter(RNG.normal(0, 1, (H, W)).astype(np.float32), (40, 2))
    woodc = hx("#6A4320") * (0.75 + 0.35 * n[..., None]) * (0.6 + 0.6 * np.exp(-((X - 800) / 400) ** 2)[..., None])
    comp(img, gaussian_filter(sm, 0.6), woodc, 1)
    comp(img, mask(W, H, poly([(560, 1040), (1040, 1040), (1040, 1064), (560, 1064)])), woodc * 0.8, 1)

    def leaf(sign, k=0):
        pts = []
        for i in range(41):
            t = i / 40
            pts.append((800 + sign * (10 + t * 430), 470 + 80 * t - 40 * math.sin(math.pi * t) - k * 4))
        for i in range(41):
            t = 1 - i / 40
            pts.append((800 + sign * (10 + t * 420), 610 + 130 * t - 18 * math.sin(math.pi * t) - k * 4))
        return pts

    comp(img, mask(W, H, polys([leaf(-1, -3), leaf(1, -3)]), blur=14), "#000000", 0.5)
    for k in range(4, 0, -1):
        comp(img, mask(W, H, polys([leaf(-1, -k), leaf(1, -k)])), hx("#CFC3A8") * (0.8 + 0.04 * k), 1)
    pm = mask(W, H, polys([leaf(-1), leaf(1)]))
    sp = np.clip(np.abs(X - 800) / 120, 0, 1) ** 0.5
    paper = hx("#FFF8E8") * (0.55 + 0.5 * sp)[..., None] * (0.85 + 0.35 * np.exp(-(((X - 800) / 500) ** 2 + ((Y - 480) / 300) ** 2)))[..., None]
    comp(img, pm, paper, 1)
    border = np.clip(pm - gaussian_filter(mask(W, H, polys([leaf(-1), leaf(1)]), ss=2), 4) * 1.15, 0, 1)
    img += border[..., None] * hx("#E2B54C") * 0.4
    bokeh(img, 260, ["#FFE7A0", "#F2CF6C", "#FFF3D0"], 0.8, 2.8, (450, 1150, 0, 1000), 0.55, 0.6, weight=lambda x, y: math.exp(-((x - 800) / 260) ** 2))
    grain(img, 0.012)
    vignette(img, X, Y, 0.45)
    return img


def familie(W=1600, H=1200):
    X, Y = grid(W, H)
    img = vgrad(W, H, [(0, "#1A1530"), (0.6, "#120F22"), (1, "#0A0814")])
    bokeh(img, 70, ["#FFB04A", "#F2CF6C", "#FF9A3C", "#FFE2A0"], 50, 130, (0, W, 0, 760), 0.22, 8)
    bokeh(img, 60, ["#FFD27A", "#FFF0C8"], 14, 40, (0, W, 0, 720), 0.3, 2.5)
    n = gaussian_filter(RNG.normal(0, 1, (H, W)).astype(np.float32), (1.5, 90))
    table = hx("#3A2214") * (0.8 + 0.5 * n[..., None])
    tm = gaussian_filter((Y > 760).astype(np.float32), 1.0)
    comp(img, tm, table * (0.5 + 0.8 * np.exp(-((X - 800) / 600) ** 2))[..., None] * np.clip((Y - 760) / 440 * 0.6 + 0.6, 0, 1.2)[..., None], 1)

    def glass(cx, base, scale=1.0):
        prof = []
        for i in range(61):
            t = i / 60
            y = base - t * 300 * scale
            rr = (52 - 26 * math.sin(math.pi * min(1, t * 1.25)) + 34 * t ** 2) * scale
            prof.append((y, rr))
        pts = [(cx - rr, y) for y, rr in prof] + [(cx + rr, y) for y, rr in reversed(prof)]
        return pts, prof

    for cx, base, sc in ((660, 900, 1.0), (980, 930, 1.06)):
        sau = mask(W, H, ellipse(cx, base + 6, 150 * sc, 34 * sc))
        comp(img, mask(W, H, ellipse(cx + 20, base + 26, 160 * sc, 34 * sc), blur=14), "#000000", 0.6)
        comp(img, sau, hx("#F5F2EC") * 0.85, 1)
        rim = np.clip(sau - mask(W, H, ellipse(cx, base + 4, 140 * sc, 28 * sc)), 0, 1)
        comp(img, rim, metal(X, Y, cx, 150 * sc), 1)
        pts, prof = glass(cx, base, sc)
        gm = mask(W, H, poly(pts))
        tea_top = base - 250 * sc
        tea = gm * (Y > tea_top)
        rel = np.clip((Y - tea_top) / (250 * sc), 0, 1)
        tcol = hx("#7A2410") * (1 - rel[..., None]) * 0.4 + hx("#C2541E") * 0.6 + hx("#FFB25A") * np.exp(-((X - cx) / (30 * sc)) ** 2)[..., None] * 0.6
        comp(img, tea, tcol, 0.95)
        comp(img, gm * (Y <= tea_top), "#FFFFFF", 0.10)
        comp(img, mask(W, H, ellipse(cx, tea_top, prof[50][1] * 0.98, 10 * sc)) * gm, "#E07A30", 0.9)
        hl = mask(W, H, poly([(cx - 30 * sc, base - 40 * sc), (cx - 22 * sc, base - 40 * sc), (cx - 40 * sc, base - 280 * sc), (cx - 50 * sc, base - 280 * sc)]), blur=2)
        img += (hl * gm)[..., None] * 0.45
        edge = np.clip(gm - gaussian_filter(gm, 2.5), 0, 1)
        img += edge[..., None] * 0.35
        for k in range(3):
            st = np.zeros((H, W), np.float32)
            pts_s = [(cx + (k - 1) * 18 + 16 * math.sin(i / 5 + k), base - 310 * sc - i * 4) for i in range(40)]
            st = mask(W, H, lambda d, s, p=pts_s: d.line([(x * s, y * s) for x, y in p], fill=255, width=int(5 * s)), ss=2, blur=7)
            img += st[..., None] * 0.10
    grain(img, 0.012)
    vignette(img, X, Y, 0.45)
    return img


def bestatter(W=1600, H=1200):
    X, Y = grid(W, H)
    img = vgrad(W, H, [(0, "#0D1430"), (0.35, "#26305F"), (0.55, "#8A7090"), (0.62, "#E9B46E"), (1, "#F5D590")])
    glow(img, X, Y, 800, 640, 220, "#FFE6B0", 0.6, sx=1.8)
    VP = (800, 640)
    ground = gaussian_filter((Y > 640).astype(np.float32), 1)
    comp(img, ground, "#0B1220", 1)
    path = mask(W, H, poly([(800 - 8, 640), (800 + 8, 640), (1180, H), (420, H)]))
    stone = hx("#5A5A72") * (0.4 + 0.9 * np.clip((Y - 640) / 560, 0, 1))[..., None]
    comp(img, path, stone, 1)
    img += (path * np.exp(-((X - 800) / 160) ** 2) * np.clip((Y - 640) / 560, 0, 1))[..., None] * hx("#FFD9A0") * 0.25
    for side in (-1, 1):
        for k in range(9):
            t = k / 8
            d = 0.12 + 0.88 * (1 - t) ** 1.6
            x = VP[0] + side * (60 + 640 * d)
            yb = VP[1] + 560 * d
            h = 560 * d + 30
            w = 52 * d + 6
            cm = mask(W, H, lambda dd, s, x=x, yb=yb, h=h, w=w: dd.ellipse([(x - w) * s, (yb - h) * s, (x + w) * s, (yb + 8) * s], fill=255))
            comp(img, gaussian_filter(cm, 0.8 + 2 * (1 - d)), hx("#0A1020") * (0.6 + 0.4 * d), 1)
            if k % 2 == 0:
                lx = VP[0] + side * (40 + 330 * d)
                ly = VP[1] + 560 * d - 20 * d
                glow(img, X, Y, lx, ly, 28 * d + 6, "#FFC46A", 0.9)
                glow(img, X, Y, lx, ly, 90 * d + 12, "#FFB04A", 0.18)
    img += np.exp(-((Y - 650) / 40) ** 2)[..., None] * hx("#FFE6C0") * 0.12
    fl = np.zeros_like(img)
    bokeh(fl, 220, ["#FFFFFF", "#F6F2EA"], 3, 9, (60, 600, 1000, 1190), 0.9, 1.2, weight=lambda x, y: (x / 600) * ((y - 1000) / 190))
    bokeh(fl, 220, ["#FFFFFF", "#F6F2EA"], 3, 9, (1000, 1540, 1000, 1190), 0.9, 1.2, weight=lambda x, y: ((1540 - x) / 540) * ((y - 1000) / 190))
    img += fl
    grain(img, 0.012)
    vignette(img, X, Y, 0.4)
    return img


SCENES = {"hero": hero, "janazah": janazah, "testament": testament, "krankheit": krankheit, "sadaqa": sadaqa, "quran": quran, "familie": familie, "bestatter": bestatter}

if __name__ == "__main__":
    out = sys.argv[1]
    names = sys.argv[2:] or list(SCENES)
    for nme in names:
        save(SCENES[nme](), f"{out}/{nme}.jpg")
        print("ok", nme, flush=True)
