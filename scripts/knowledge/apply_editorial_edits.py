#!/usr/bin/env python3
"""Apply a reviewed editorial edit set to the knowledge articles (owner order 26.11.2026, AP5).

Language only: edits may touch `summary`, `nextStep` and paragraphs of the kinds einleitung, erklaerung,
praxis, beispiel, kontext, amanah, recht. Qur'an, tafsir, hadith, fiqh and fatwa paragraphs and all source
objects stay untouched, so the independent source checks of build-p26/build-p27 keep their meaning.
Every edit applies only if its `old` text matches the current text exactly; otherwise the run aborts.
Open questions are appended to `openQuestions` (never a review level, never a release).

Usage: python3 scripts/knowledge/apply_editorial_edits.py <edits.json> [open-questions.json]
"""
import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[2] / "src/modules/islamic-knowledge/full-articles"
FILES = {"p26": BASE / "p26-articles.json", "p27": BASE / "p27-articles.json"}
EDITABLE = {"einleitung", "erklaerung", "praxis", "beispiel", "kontext", "amanah", "recht"}


def load():
    return {k: json.loads(p.read_text(encoding="utf-8")) for k, p in FILES.items()}


def find_article(data, article_id):
    if data["p27"].get("einstieg", {}).get("id") == article_id:
        return data["p27"]["einstieg"]
    for a in data["p27"]["articles"]:
        if a["id"] == article_id:
            return a
    for a in data["p26"]["articles"]:
        if a["id"] == article_id:
            return a
    raise SystemExit(f"unknown article {article_id}")


def locate(article, e):
    if e["field"] in ("summary", "nextStep"):
        return article, e["field"]
    sections = article["sections"]
    if "sectionIndex" in e:
        sec = sections[e["sectionIndex"]]
        if sec["key"] != e["sectionKey"]:
            raise SystemExit(f"{article['id']}: section {e['sectionIndex']} is {sec['key']}, not {e['sectionKey']}")
        candidates = [sec]
    else:
        candidates = [s for s in sections if s["key"] == e["sectionKey"]]
    for sec in candidates:
        paras = sec["paragraphs"]
        i = e["paragraphIndex"]
        if i < len(paras) and paras[i]["text"] == e["old"]:
            return paras[i], "text"
    raise SystemExit(f"{article['id']} {e.get('sectionKey')}[{e.get('paragraphIndex')}]: old text not found")


def main():
    edits = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    questions = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8")) if len(sys.argv) > 2 else []
    data = load()
    applied = 0
    for e in edits:
        art = find_article(data, e["articleId"])
        target, key = locate(art, e)
        if key == "text" and target.get("kind") not in EDITABLE:
            raise SystemExit(f"{e['articleId']}: kind {target.get('kind')} may not be edited")
        if target[key] != e["old"]:
            raise SystemExit(f"{e['articleId']} {key}: old text differs")
        target[key] = e["new"]
        applied += 1
    added = 0
    for q in questions:
        art = find_article(data, q["articleId"])
        if q.get("for") not in ("gelehrte", "jurist", "redaktion"):
            raise SystemExit(f"{q['articleId']}: open question needs for=gelehrte|jurist|redaktion")
        entry = {"question": q["question"], "for": q["for"], "refs": q.get("refs") or []}
        existing = art.setdefault("openQuestions", [])
        if entry not in existing:
            existing.append(entry)
            added += 1
    for k, p in FILES.items():
        p.write_text(json.dumps(data[k], ensure_ascii=False, indent=1) + ("\n" if p.read_text(encoding="utf-8").endswith("\n") else ""), encoding="utf-8")
    print(f"edits applied: {applied}, open questions added: {added}")


if __name__ == "__main__":
    main()
