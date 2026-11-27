#!/usr/bin/env python3
"""Reads what a running build delivers and looks for unreviewed texts: drafts, source data, locked
module texts. Usage: public-content-probe.py <base-url> <static-dir>. Exit 0 only without a hit.
Run from the repository. Reads and prints no secrets, sends no data."""
import json, os, re, sys, urllib.error, urllib.request

base, static_dir = sys.argv[1].rstrip("/"), sys.argv[2]

samples = {}
for name in ["janazah", "barzakh", "sadaqa-jariya", "testament-erbe", "ghusl-kafan", "patientenverfuegung", "kulturfilter", "sources", "quran-verses", "wissen-topics"]:
    text = open(f"src/lib/knowledge/{name}.ts", encoding="utf8").read()
    samples[name] = sorted({m[8:58] for m in re.findall(r'"([^"\n]{70,})"', text) if not m.startswith("http") and "Eigene sinngem" not in m})
entries = open("src/lib/knowledge/entries.ts", encoding="utf8").read()
samples["entries"] = sorted({c[8:58] for block in re.findall(r"\{\n\s+id: \"kb-.*?\n  \},", entries, re.S) if 'reviewedStatus: "orientation"' not in block for c in re.findall(r'"([^"\n]{70,})"', block)})
archive = open("docs/release/gesperrte-modultexte.md", encoding="utf8").read()
samples["modultexte"] = [m.strip() for m in re.findall(r"^- \*\*Original:\*\* (.+)$", archive, re.M) if len(m) > 25 and 'description' not in m and 'text:' not in m and 'hint:' not in m and 'helpText' not in m and 'moduleText' not in m and '"' not in m]
everything = [s for group in samples.values() for s in group]
print("Textproben", {k: len(v) for k, v in samples.items()})

hits = 0
files = [os.path.join(d, f) for d, _, fs in os.walk(static_dir) for f in fs if f.endswith((".js", ".css", ".json", ".map"))]
found = {}
for path in files:
    text = open(path, encoding="utf8", errors="ignore").read()
    for group, items in samples.items():
        count = sum(1 for s in items if s in text or json.dumps(s, ensure_ascii=False)[1:-1] in text)
        if count:
            found[group] = found.get(group, 0) + count
hits += sum(found.values())
print("JS", len(files), "Dateien, Treffer:", found or "keine")

slugs = re.findall(r'^\s+"([a-z-]+)",$', open("src/lib/knowledge/wissen-topics.ts", encoding="utf8").read(), re.M)
paths = ["/", "/check", "/preise", "/akuter-todesfall", "/konvertierte", "/wissen", "/wissen?q=ghusl", "/patientenverfuegung", "/janazah-kompass", "/barzakh", "/sadaqa-jariya", "/testament-erbe", "/islam-oder-kultur", "/sitemap.xml", "/api/knowledge/entries", "/api/knowledge/published-links", "/wissen/redaktion"] + [f"/wissen/{s}" for s in slugs]
for entry in re.findall(r'id: "(kb-[^"]+)"', entries):
    paths.append(f"/api/knowledge/entries/{entry}")
paths += [f"/api/knowledge/search?q={q}" for q in ["ghusl", "kafan", "janazah", "sadaqa", "barzakh", "testament", "patientenverf%C3%BCgung", "vorsorgevollmacht"]]
codes, bad = {}, []
for path in paths:
    try:
        response = urllib.request.urlopen(base + path, timeout=15)
        code, text = response.status, response.read().decode("utf8", "ignore")
    except urllib.error.HTTPError as error:
        code, text = error.code, ""
    codes[code] = codes.get(code, 0) + 1
    if code == 200 and (any(s in text for s in everything) or re.search(r"Fachlich geprüft|Geprüfte Wissensbasis|>Geprüft<", text)):
        bad.append(path)
hits += len(bad)
print("URLs", len(paths), codes, "mit ungeprüften Inhalten:", bad or "keine")

for path in ["/api/ai", "/api/ai/knowledge"]:
    body = json.dumps({"question": "Was ist Ghusl?", "messages": [{"role": "user", "content": "Was ist Ghusl?"}]}).encode()
    request = urllib.request.Request(base + path, data=body, headers={"Content-Type": "application/json", "Origin": base}, method="POST")
    try:
        response = urllib.request.urlopen(request, timeout=15)
        code, text = response.status, response.read().decode("utf8", "ignore")
    except urllib.error.HTTPError as error:
        code, text = error.code, ""
    leak = any(s in text for s in everything)
    hits += int(leak)
    print("POST", path, code, "ungeprüfte Texte:", leak)

print("ERGEBNIS", "SAUBER" if hits == 0 else f"{hits} TREFFER")
sys.exit(0 if hits == 0 else 1)
