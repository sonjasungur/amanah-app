# Content Source Audit — Mein Wille

Stand: Branch `fix/content-sources-mobile-and-check`
Audit-Datum: 2026-07-14

## Legende Kategorien

| Kategorie | Bedeutung |
|-----------|-----------|
| `QURAN_PRIMARY` | Qur'an — Bubenheim/Elyas via QuranEnc |
| `SAHIH_PRIMARY` | Sahih al-Bukhari oder Sahih Muslim |
| `LEGAL_GERMANY` | Deutsches Recht / offizielle Behörden |
| `GENERAL_GUIDANCE` | Praktische Orientierung ohne Primärquelle |
| `FIQH_REVIEW_REQUIRED` | Fachliche Prüfung durch Gelehrten nötig |
| `REMOVE` | Entfernt oder gesperrt |

---

## Homepage — „Was du vorbereiten kannst“

| Route | Sichtbare Aussage | Kategorie | Quelle | Dublette | Korrekt | Änderung |
|-------|-------------------|-----------|--------|----------|---------|----------|
| `/` → `/wissen/notfallkarte` | Notfall und Gesundheit | GENERAL_GUIDANCE | — | nein | ja | Kachel als Link mit „Thema öffnen“ |
| `/` → `/wissen/vorsorgevollmacht` | Vollmachten | LEGAL_GERMANY | BMJV | nein | ja | Link repariert |
| `/` → `/wissen/janazah-wuensche` | Janazah und Bestattung | SAHIH_PRIMARY | Bukhari 1315/Muslim 944c | nein | ja | Link repariert |
| `/` → `/wissen/testament-erbe` | Testament, Erbe, Schulden | QURAN_PRIMARY + LEGAL | 4:11–4:176 | nein | ja | Link repariert |
| `/` → `/wissen/digitaler-nachlass` | Digitaler Nachlass | GENERAL_GUIDANCE | — | nein | ja | Link repariert |
| `/` → `/wissen/sadaqa-jariya` | Familie und Akhira | SAHIH_PRIMARY | Muslim 1631 | nein | ja | Link repariert |

---

## Wissensartikel — Übersicht

### Notfallkarte (`/wissen/notfallkarte`)

| Aussage | Kategorie | Quelle | Korrekt | Änderung |
|---------|-----------|--------|---------|----------|
| Notfallkontakte und Vollmacht-Verweis | GENERAL_GUIDANCE | — | ja | Artikelstruktur A–H |
| CTA → `/dashboard/notfallkarte` | — | — | ja | funktional |

### Patientenverfügung (`/wissen/patientenverfuegung`)

| Aussage | Kategorie | Quelle | Korrekt | Änderung |
|---------|-----------|--------|---------|----------|
| Deutsches Rechtsinstrument, keine islamische Spezialquelle | LEGAL_GERMANY | § 1901a BGB | ja | Erfundene islamische Quelle entfernt |
| BMG-Textbausteine | LEGAL_GERMANY | BMG URL | ja | Verlinkt |
| Verbraucherzentrale-Tool | LEGAL_GERMANY | VZ URL | ja | Verlinkt |
| Upload-Vorbereitung | GENERAL_GUIDANCE | — | ja | in legalNotes |

### Vorsorgevollmacht (`/wissen/vorsorgevollmacht`)

| Aussage | Kategorie | Quelle | Korrekt | Änderung |
|---------|-----------|--------|---------|----------|
| Ehegattennotvertretung begrenzt (§ 1358 BGB) | LEGAL_GERMANY | BGB | ja | Korrekt erklärt |
| Keine automatische Kinder-Rangfolge | LEGAL_GERMANY | — | ja | Unlogischer Abschnitt ersetzt |
| Haupt- und Ersatzperson | GENERAL_GUIDANCE | — | ja | in prepareItems |

### Janazah-Wünsche (`/wissen/janazah-wuensche`)

| Aussage | Kategorie | Quelle | Vers/Nummer | Dublette | Korrekt | Änderung |
|---------|-----------|--------|-------------|----------|---------|----------|
| Janazah beschleunigen | SAHIH_PRIMARY | Bukhari + Muslim | 1315 / 944c | **ja → zusammengeführt** | ja | `sourceGroup: janazah-hasten` |
| Belohnung Janazah-Gebet | SAHIH_PRIMARY | Bukhari | 1254 | nein | ja | ergänzt |
| Gräber besuchen | SAHIH_PRIMARY | Bukhari | 1273 | nein | ja | ergänzt (anderer Kontext) |
| Persönliche Wünsche ≠ Fiqh-Regel | GENERAL_GUIDANCE | — | — | nein | ja | explizit gekennzeichnet |
| Janazah-Checkliste | GENERAL_GUIDANCE | — | — | nein | ja | neu |

### Testament & Erbe (`/wissen/testament-erbe`)

| Aussage | Kategorie | Quelle | Vers/Nummer | Korrekt | Änderung |
|---------|-----------|--------|-------------|---------|----------|
| Erbanteile Söhne/Töchter | QURAN_PRIMARY | Bubenheim/Elyas | 4:11 | ja | QuranEnc-Metadaten |
| Erbanteile Ehepartner | QURAN_PRIMARY | Bubenheim/Elyas | 4:12 | ja | QuranEnc-Metadaten |
| Kalala/Geschwister | QURAN_PRIMARY | Bubenheim/Elyas | 4:176 | ja | ergänzt |
| Wasiyyah max. 1/3 | SAHIH_PRIMARY | Bukhari/Muslim | 2742 / 1628a | ja | beibehalten |
| Saʿd — Vermächtnis | SAHIH_PRIMARY | Bukhari | 2738 | ja | ergänzt |
| Kein Erbrechner | GENERAL_GUIDANCE | — | ja | explizit |

### Sadaqa Jariya (`/wissen/sadaqa-jariya`)

| Aussage | Kategorie | Quelle | Nummer | Korrekt | Änderung |
|---------|-----------|--------|--------|---------|----------|
| Drei fortlaufende Taten | SAHIH_PRIMARY | Muslim | 1631 | ja | beibehalten |
| Barzakh-Kontext | QURAN_PRIMARY | Bubenheim/Elyas | 23:99–100 | ja | ohne Spekulation |
| Partner Gemeinsam1 e.V. | GENERAL_GUIDANCE | Partner-URL + UTM | — | ja | Partnerkennzeichnung |

### Barzakh (`/wissen/barzakh`) — NEU

| Aussage | Kategorie | Quelle | Vers | Korrekt | Änderung |
|---------|-----------|--------|------|---------|----------|
| Zwischenzustand | QURAN_PRIMARY | Bubenheim/Elyas | 23:99–100 | ja | neu, keine Spekulation |
| Jeder Seele der Tod | QURAN_PRIMARY | Bubenheim/Elyas | 3:185 | ja | neu |

### Akhira-Vorsorge (`/wissen/akhira-vorsorge`) — NEU

| Aussage | Kategorie | Quelle | Korrekt | Änderung |
|---------|-----------|--------|---------|----------|
| Endlichkeit des Lebens | QURAN_PRIMARY | 3:185, 59:18 | ja | neu |
| Sadaqa nach dem Tod | SAHIH_PRIMARY | Muslim 1631 | ja | ohne Garantie |
| Sura al-Mulk als Schutzversprechen | REMOVE | — | — | nicht aufgenommen |

---

## Entfernte / korrigierte Aussagen

| Vorher | Status | Grund |
|--------|--------|-------|
| Doppelte Hadith-Karten Bukhari 1315 + Muslim 944c | Zusammengeführt | Gleicher Inhalt |
| Islamische Spezialquelle Patientenverfügung | Entfernt | Keine belastbare Quelle |
| Automatische Kinder-Rangfolge (Vollmacht) | Entfernt | Rechtlich falsch |
| Fiqh als Primärquelle | Herabgestuft | FIQH_REVIEW_REQUIRED |

---

## Quellenmatrix

Siehe `src/lib/knowledge/sources.ts` und `src/lib/knowledge/quran-verses.ts`.

---

## Fachliche Review-Punkte (offen)

1. Ghusl/Kafan-Details — Imam konsultieren
2. Testament/Erbrecht DE+Islam — Anwalt + Gelehrter
3. Hadith-Übersetzungen — sinngemäße Wiedergabe
4. Partner Gemeinsam1 e.V. — keine religiöse Bewertung
5. Barzakh/Akhira — bewusst minimal
