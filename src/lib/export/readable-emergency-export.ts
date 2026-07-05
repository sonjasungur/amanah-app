import type { AmanahOrdnerData } from "@/lib/domain/types";
import { createEmergencyExportBundle } from "@/lib/domain/schema";

const SENSITIVE_KEYS = new Set([
  "passwordHash",
  "token",
  "tokenHash",
  "session",
  "saveStatus",
  "saveError",
  "id",
]);

export function sanitizeForExport(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sanitizeForExport);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) continue;
      out[k] = sanitizeForExport(v);
    }
    return out;
  }
  return value;
}

export interface ReadableEmergencySections {
  title: string;
  items: { label: string; value: string }[];
}

function str(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Ja" : "Nein";
  return String(v);
}

export function buildReadableEmergencySections(data: AmanahOrdnerData): ReadableEmergencySections[] {
  const bundle = createEmergencyExportBundle(data);
  const sanitized = sanitizeForExport(bundle.data) as AmanahOrdnerData;
  const ec = sanitized.emergencyCard ?? data.emergencyCard;
  const mw = data.medicalWishes;
  const poa = data.powerOfAttorney;
  const jw = data.janazahWishes;
  const fm = data.familyMessage;
  const digital = data.powerOfAttorney.digitalAccounts || data.digitalLegacy?.length
    ? `${data.powerOfAttorney.digitalAccounts || ""}${data.digitalLegacy?.length ? ` (${data.digitalLegacy.length} Einträge)` : ""}`.trim()
    : "";

  return [
    {
      title: "Notfallkontakte",
      items: [
        { label: "Name auf Notfallkarte", value: str(ec.name || data.userProfile.name) },
        { label: "Notfallkontakt 1", value: str(ec.emergencyContact1.name) },
        { label: "Telefon", value: str(ec.emergencyContact1.phone) },
        { label: "Beziehung", value: str(ec.emergencyContact1.relation) },
        { label: "Notfallkontakt 2", value: str(ec.emergencyContact2.name) },
        { label: "Telefon 2", value: str(ec.emergencyContact2.phone) },
        { label: "Hausarzt", value: str(ec.familyDoctor) },
      ],
    },
    {
      title: "Dokumente & medizinische Hinweise",
      items: [
        { label: "Dokumentenort", value: str(mw.documentLocation) },
        { label: "Patientenverfügung vorhanden", value: str(ec.hasPatientenverfuegung) },
        { label: "Vorsorgevollmacht vorhanden", value: str(ec.hasVorsorgevollmacht) },
        { label: "Medizinische Hinweise", value: str(mw.medicalWishes) },
        { label: "Allergien", value: str(ec.allergies) },
        { label: "Ansprechpartner Ärzte", value: str(mw.whoSpeaksToDoctors) },
      ],
    },
    {
      title: "Vertrauensperson / Vollmacht",
      items: [
        { label: "Bevollmächtigte Person", value: str(poa.authorizedPerson) },
        { label: "Ersatzperson", value: str(poa.substitutePerson) },
        { label: "Dokumente-Hinweis", value: str(poa.documents) },
      ],
    },
    {
      title: "Bestattungswünsche",
      items: [
        { label: "Islamische Bestattung", value: str(jw.islamicBurialDesired) },
        { label: "Bestatter", value: str(jw.preferredFuneralDirector) },
        { label: "Moschee", value: str(jw.preferredMosque) },
        { label: "Nachricht an Familie", value: str(jw.messageToFamily) },
      ],
    },
    {
      title: "Digitaler Nachlass (Hinweise)",
      items: [{ label: "Digitale Konten", value: str(digital || "—") }],
    },
    {
      title: "Schulden & Verpflichtungen",
      items: [
        {
          label: "Einträge",
          value: data.debtsAmanah.length
            ? data.debtsAmanah.map((d) => `${d.description} (${d.person})`).join("; ")
            : str(data.barzakhPlan?.importantDebtsAmanah),
        },
      ],
    },
    {
      title: "Familiennachricht",
      items: [
        { label: "Familienbrief", value: str(fm.familyLetter) },
        { label: "Wichtigste Wünsche", value: str(fm.keyWishesSummary) },
      ],
    },
  ].filter((s) => s.items.some((i) => i.value !== "—"));
}

export function buildReadableEmergencyMarkdown(data: AmanahOrdnerData): string {
  const disclaimer =
    "Orientierung und Vorbereitung — keine Garantie auf Vollständigkeit oder rechtliche/medizinische/religiöse Wirksamkeit. Fachliche Prüfung empfohlen.";
  const sections = buildReadableEmergencySections(data);
  const lines = [
    "# Amanah Notfallmappe",
    "",
    `Exportiert: ${new Date().toLocaleString("de-DE")}`,
    "",
    `> ${disclaimer}`,
    "",
  ];
  for (const sec of sections) {
    lines.push(`## ${sec.title}`, "");
    for (const item of sec.items) {
      if (item.value !== "—") lines.push(`- **${item.label}:** ${item.value}`);
    }
    lines.push("");
  }
  lines.push("---", "", "*Export sicher aufbewahren. Angehörige erhalten nichts automatisch.*");
  return lines.join("\n");
}

export function buildReadableEmergencyHtml(data: AmanahOrdnerData): string {
  const disclaimer =
    "Orientierung und Vorbereitung — keine Garantie auf Vollständigkeit oder rechtliche/medizinische/religiöse Wirksamkeit. Fachliche Prüfung empfohlen.";
  const sections = buildReadableEmergencySections(data);
  const sectionHtml = sections
    .map(
      (sec) => `
    <section>
      <h2>${escapeHtml(sec.title)}</h2>
      <dl>
        ${sec.items
          .filter((i) => i.value !== "—")
          .map(
            (i) =>
              `<dt>${escapeHtml(i.label)}</dt><dd>${escapeHtml(i.value)}</dd>`
          )
          .join("")}
      </dl>
    </section>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <title>Amanah Notfallmappe</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; line-height: 1.5; }
    h1 { color: #1e4d3a; border-bottom: 2px solid #c9a227; padding-bottom: 0.5rem; }
    h2 { color: #1e4d3a; font-size: 1.1rem; margin-top: 1.5rem; }
    dl { display: grid; grid-template-columns: minmax(140px, 38%) 1fr; gap: 0.35rem 1rem; }
    dt { font-weight: 600; color: #555; }
    dd { margin: 0; }
    .disclaimer { background: #f5f0e8; border-left: 4px solid #c9a227; padding: 1rem; margin: 1.5rem 0; font-size: 0.9rem; }
    .footer { font-size: 0.8rem; color: #666; margin-top: 2rem; border-top: 1px solid #ddd; padding-top: 1rem; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Amanah Notfallmappe</h1>
  <p><small>Exportiert: ${escapeHtml(new Date().toLocaleString("de-DE"))}</small></p>
  <div class="disclaimer">${escapeHtml(disclaimer)}</div>
  ${sectionHtml}
  <p class="footer">Export sicher aufbewahren. Angehörige erhalten nichts automatisch. Keine Rechtsberatung, keine medizinische Beratung, keine Fatwa.</p>
  <script>/* optional print */</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function openReadableEmergencyExport(data: AmanahOrdnerData): void {
  if (typeof window === "undefined") return;
  const html = buildReadableEmergencyHtml(data);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export function downloadReadableEmergencyMarkdown(data: AmanahOrdnerData): void {
  const md = buildReadableEmergencyMarkdown(data);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `amanah-notfallmappe-${new Date().toISOString().split("T")[0]}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
