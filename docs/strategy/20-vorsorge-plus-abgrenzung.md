# Vorsorge Plus – Abgrenzung kostenlos / Plus (Konzept)

Stand: 2026-10-31 · Grundlage: Vorgabe des Owners vom 31.10. · **nur Konzept, nichts gesperrt**

Quelle der Wahrheit im Code: `src/lib/billing/plan-matrix.ts` (Matrix), `src/lib/billing/plus-access.ts` (Zugangsregel). Lokal ansehen: `/intern/vorsorge-plus` (nur mit `AMANAH_INTERNAL_TOOLS=true` zur Build-Zeit; sonst 404).

## 1. Funktionsmatrix

| Funktion | Paket | Bereiche | Sperre technisch |
|---|---|---|---|
| Islamisches Wissenszentrum | kostenlos | `/wissen` | nie (Sadaqa Jariya, ohne Registrierung) |
| Informationen zu Erbrecht und Janazah | kostenlos | `/testament-erbe`, `/janazah-kompass`, `/akuter-todesfall`, `/patientenverfuegung`, `/konvertierte`, `/islam-oder-kultur`, `/barzakh`, `/sadaqa-jariya` | nie |
| Grundlegender Vorsorge-Check | kostenlos | `/check` | nie |
| Einstieg in persönliche Vorsorge | kostenlos | `/dashboard` (Übersicht), `/dashboard/notfallkarte` | nie |
| Dauerhafter Vorsorgeordner (verschlüsselt im Konto) | **Plus** | `/api/amanah` (Speichern) | serverseitig |
| Familie und Vertrauenspersonen | **Plus** | `/dashboard/personen`, `/familie`, `/familiengespraech` | nur Hinweis im Browser |
| Dokumentenübersicht | **Plus** | `/dashboard/dokumente` | nur Hinweis im Browser |
| Nachlass- und Schuldeninformationen | **Plus** | `/dashboard/schulden-amanah`, `/digitaler-nachlass`, `/testament` | nur Hinweis im Browser |
| Persönliche Vorsorge- und Janazah-Wünsche | **Plus** | `/dashboard/janazah`, `/ghusl-kafan`, `/bestattung`, `/krankheit`, `/vollmacht`, `/betreuung`, `/barzakh`, `/sadaqa-jariya` | nur Hinweis im Browser |
| PDF-Exporte | **Plus** | `/dashboard/pdf` | nur Hinweis im Browser |

Immer kostenlos, unabhängig vom Paket: Datenexport (Art. 15/20 DSGVO), Löschen von Daten und Konto (Art. 17), Widerruf der Einwilligung, E-Mail bestätigen, Passwort zurücksetzen.

**Preis:** Vorsorge Plus, geplanter Testpreis **39 € einmalig** (Standard im Produktkatalog; 29 € bleibt nur für Vergleichstests per `AMANAH_TEST_PRICE_VORSORGE_PLUS_CENTS=2900` wählbar). Kauf nur in der Sandbox.

Ein Test stellt sicher, dass jeder Dashboard-Bereich genau einer Funktion zugeordnet ist (`plus-plan.test.ts`).

## 2. Keine überraschende Wegnahme (Bestandsschutz)

| Regel | Umsetzung |
|---|---|
| Solange `AMANAH_BILLING_ENFORCE` nicht `true` ist, ist nichts gesperrt. | `resolvePlusAccess` → `not_enforced` |
| Konten, die vor `AMANAH_PLUS_LAUNCH_AT` angelegt wurden, behalten **alle** Funktionen dauerhaft. | → `existing_account` |
| Sperren ohne Starttermin sind nicht möglich: Ohne Datum gilt jedes Konto als Bestand; die Produktionsprüfung lehnt `ENFORCE=true` ohne Datum ab. | `production-config.ts`, `validate-production-env.mjs` |
| Gespeicherte Daten werden nie wegen eines fehlenden Kaufs gelöscht oder unlesbar. Lesen, Export und Löschen bleiben frei. | Sperre betrifft nur das Speichern neuer Angaben |
| Neue Nutzer sehen Plus-Bereiche als Vorschau mit Hinweis, nicht als Fehlerseite. | `PlusGate` |

`/api/billing/status` liefert `plusAccess: { allowed, reason }`.

## 3. Technische Grenzen (ehrlich)

- Wirksam sperrbar ist nur, was der Server leistet: die dauerhafte Speicherung im Konto. Alle Formulare und der Druck laufen im Browser. Eine Sperre dort ist nur ein Hinweis und lässt sich umgehen. Das ist vertretbar: Plus verkauft im Kern den sicheren, dauerhaften Ordner.
- Ein serverseitiges PDF (optional, ca. 2 PT) würde den PDF-Export wirksam sperrbar machen.
- Der lokale Browser-Modus (ohne Konto) bleibt eine Demo; dort ist keine Sperre vorgesehen.

## 4. Was noch fehlt, bevor etwas gesperrt wird

1. Owner-Entscheidung 31.10.: Vorsorge Plus mit **39 € einmalig als Testpreis** vorbereiten, **Bestandsschutz für Altkonten**. Weiter REQUIRES_OWNER: Starttermin (`AMANAH_PLUS_LAUNCH_AT`), endgültiger Preis, Freigabe der Sperren.
2. Öffentliche Preisseite `/preise` ersetzen: Sie zeigt noch die alten Marketing-Stufen (Basic 29 €, Komplett 79 €, Familie 99 €, „Kauf noch nicht möglich“) und passt nicht zum Produktkatalog. Bewusst nicht geändert (Vorgabe: zunächst nur Konzept).
3. REQUIRES_LEGAL_REVIEW: AGB, Widerrufsbelehrung für digitale Inhalte (§ 356 Abs. 5 BGB), Bestellbutton (§ 312j BGB), Rechnung/USt (Doku 17).
4. Live-Zahlungsanbieter (Doku 21).
5. Erst dann `AMANAH_BILLING_ENFORCE=true` mit `AMANAH_PLUS_LAUNCH_AT`.
